package com.fincontrol.backend.service;

import com.fincontrol.backend.model.*;
import com.fincontrol.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class FaturaService {
    private final FaturaRepository faturaRepository;
    private final LancamentoCartaoRepository lancamentoRepository;
    private final CartaoRepository cartaoRepository;
    private final RegraCategoriaRepository regraRepository;

    private BigDecimal parseValor(String valorStr) {
        valorStr = valorStr.replaceAll("[^0-9.,-]", "");
        int lastComma = valorStr.lastIndexOf(',');
        int lastDot = valorStr.lastIndexOf('.');
        if (lastComma > lastDot) {
            valorStr = valorStr.replace(".", "").replace(",", ".");
        } else if (lastDot > lastComma) {
            valorStr = valorStr.replace(",", "");
        } else if (lastComma != -1) {
            valorStr = valorStr.replace(",", ".");
        }
        try {
            return new BigDecimal(valorStr);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public Fatura getOrCreateFatura(Long cartaoId, String mesAno, User user) {
        Cartao cartao = cartaoRepository.findById(cartaoId)
            .orElseThrow(() -> new RuntimeException("Cartão não encontrado"));
        if (!cartao.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        return faturaRepository.findByCartaoIdAndMesAno(cartaoId, mesAno)
            .orElseGet(() -> {
                Fatura fatura = new Fatura();
                fatura.setCartao(cartao);
                fatura.setMesAno(mesAno);
                fatura.setUser(user);
                fatura.setPago(false);
                fatura.setFechada(false);
                return faturaRepository.save(fatura);
            });
    }

    public Fatura importarCsv(Long cartaoId, String mesAno, MultipartFile file, User user) throws Exception {
        Cartao cartao = cartaoRepository.findById(cartaoId).orElseThrow(() -> new RuntimeException("Cartão não encontrado"));
        if (!cartao.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        
        Fatura fatura = getOrCreateFatura(cartaoId, mesAno, user);

        List<RegraCategoria> regras = regraRepository.findByCategoriaUser(user);
        List<LancamentoCartao> lancamentos = new ArrayList<>();
        List<LancamentoCartao> existingLancamentos = lancamentoRepository.findByFaturaId(fatura.getId());

        List<com.fincontrol.backend.util.FaturaImportParser.ParsedRow> parsedRows = com.fincontrol.backend.util.FaturaImportParser.parse(file);

        for (com.fincontrol.backend.util.FaturaImportParser.ParsedRow row : parsedRows) {
            LancamentoCartao l = new LancamentoCartao();
            l.setFatura(fatura);
            l.setData(row.getData());
            l.setDescricao(row.getDescricao());
            l.setValor(row.getValor());
            l.setParcela(row.getParcela());
            l.setTotalParcelas(row.getTotalParcelas());
            
            // Prevenção de duplicatas
            boolean isDuplicate = false;
            for (LancamentoCartao existing : existingLancamentos) {
                if (existing.getData().equals(l.getData()) &&
                    existing.getDescricao().equalsIgnoreCase(l.getDescricao()) &&
                    existing.getValor().compareTo(l.getValor()) == 0 &&
                    existing.getParcela().equals(l.getParcela()) &&
                    existing.getTotalParcelas().equals(l.getTotalParcelas())) {
                    isDuplicate = true;
                    break;
                }
            }
            if (isDuplicate) {
                continue;
            }
            
            // Aplica regras
            List<Categoria> matchedCategories = new ArrayList<>();
            for (RegraCategoria r : regras) {
                if (l.getDescricao().toUpperCase().contains(r.getPalavraChave().toUpperCase())) {
                    if (r.getCategoria() != null && !matchedCategories.contains(r.getCategoria())) {
                        matchedCategories.add(r.getCategoria());
                    }
                }
            }
            l.setCategorias(matchedCategories);
            
            lancamentos.add(l);
        }

        lancamentoRepository.saveAll(lancamentos);
        
        // Gerar parcelas futuras para os novos lançamentos salvos
        for (LancamentoCartao l : lancamentos) {
            gerarParcelasFuturas(l, user);
        }
        
        return fatura;
    }
    
    public void gerarParcelasFuturas(LancamentoCartao l, User user) {
        if (l.getTotalParcelas() == null || l.getTotalParcelas() <= 1) {
            return;
        }
        
        int currentParcela = l.getParcela() != null ? l.getParcela() : 1;
        int totalParcelas = l.getTotalParcelas();
        if (currentParcela >= totalParcelas) {
            return;
        }
        
        Fatura baseFatura = l.getFatura();
        if (baseFatura == null) {
            return;
        }
        
        java.time.YearMonth baseYearMonth = java.time.YearMonth.parse(baseFatura.getMesAno());
        
        for (int p = currentParcela + 1; p <= totalParcelas; p++) {
            int offset = p - currentParcela;
            java.time.YearMonth targetYearMonth = baseYearMonth.plusMonths(offset);
            String targetMesAno = targetYearMonth.toString();
            
            Fatura targetFatura = getOrCreateFatura(baseFatura.getCartao().getId(), targetMesAno, user);
            
            // Verifica duplicidade no destino
            List<LancamentoCartao> existingInTarget = lancamentoRepository.findByFaturaId(targetFatura.getId());
            boolean exists = false;
            for (LancamentoCartao existing : existingInTarget) {
                if (existing.getDescricao().equalsIgnoreCase(l.getDescricao()) &&
                    existing.getValor().compareTo(l.getValor()) == 0 &&
                    existing.getParcela().equals(p) &&
                    existing.getTotalParcelas().equals(totalParcelas)) {
                    exists = true;
                    break;
                }
            }
            
            if (!exists) {
                LancamentoCartao futureL = new LancamentoCartao();
                futureL.setFatura(targetFatura);
                futureL.setDescricao(l.getDescricao());
                futureL.setValor(l.getValor());
                futureL.setData(l.getData() != null ? l.getData().plusMonths(offset) : LocalDate.now().plusMonths(offset));
                futureL.setParcela(p);
                futureL.setTotalParcelas(totalParcelas);
                futureL.setCategorias(new ArrayList<>(l.getCategorias()));
                lancamentoRepository.save(futureL);
            }
        }
    }
    
    public List<Fatura> findAll(User user) {
        return faturaRepository.findByUser(user);
    }

    public List<LancamentoCartao> findLancamentosByFaturaId(Long faturaId, User user) {
        Fatura fatura = faturaRepository.findById(faturaId)
            .orElseThrow(() -> new RuntimeException("Fatura não encontrada"));
        if (!fatura.getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        return lancamentoRepository.findByFaturaId(faturaId);
    }

    public Fatura updateFatura(Long id, Fatura faturaUpdate, User user) {
        Fatura fatura = faturaRepository.findById(id).orElseThrow(() -> new RuntimeException("Fatura não encontrada"));
        if (!fatura.getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        fatura.setMesAno(faturaUpdate.getMesAno());
        fatura.setFechada(faturaUpdate.getFechada());
        fatura.setPago(faturaUpdate.getPago());
        return faturaRepository.save(fatura);
    }

    public Fatura marcarComoPaga(Long id, Boolean pago, User user) {
        Fatura fatura = faturaRepository.findById(id).orElseThrow(() -> new RuntimeException("Fatura não encontrada"));
        if (!fatura.getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        fatura.setPago(pago);
        return faturaRepository.save(fatura);
    }

    public LancamentoCartao addLancamento(Long faturaId, LancamentoCartao lancamento, User user) {
        Fatura fatura = faturaRepository.findById(faturaId).orElseThrow(() -> new RuntimeException("Fatura não encontrada"));
        if (!fatura.getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        lancamento.setFatura(fatura);
        LancamentoCartao saved = lancamentoRepository.save(lancamento);
        gerarParcelasFuturas(saved, user);
        return saved;
    }

    public void deleteFatura(Long id, User user) {
        Fatura fatura = faturaRepository.findById(id).orElseThrow(() -> new RuntimeException("Fatura não encontrada"));
        if (!fatura.getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        List<LancamentoCartao> lancamentos = lancamentoRepository.findByFaturaId(id);
        lancamentoRepository.deleteAll(lancamentos);
        faturaRepository.delete(fatura);
    }

    public LancamentoCartao updateLancamento(Long id, LancamentoCartao lancamentoUpdate, User user) {
        LancamentoCartao lancamento = lancamentoRepository.findById(id).orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));
        if (!lancamento.getFatura().getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        
        String oldDesc = lancamento.getDescricao();
        java.math.BigDecimal oldValor = lancamento.getValor();
        Integer oldParc = lancamento.getParcela();
        Integer oldTotal = lancamento.getTotalParcelas();
        
        lancamento.setDescricao(lancamentoUpdate.getDescricao());
        lancamento.setValor(lancamentoUpdate.getValor());
        lancamento.setData(lancamentoUpdate.getData());
        lancamento.setParcela(lancamentoUpdate.getParcela());
        lancamento.setTotalParcelas(lancamentoUpdate.getTotalParcelas());
        lancamento.setCategorias(lancamentoUpdate.getCategorias());
        LancamentoCartao saved = lancamentoRepository.save(lancamento);
        
        if (oldTotal != null && oldTotal > 1 && oldParc != null && oldParc < oldTotal) {
            propagarAlteracaoParcelas(saved, oldDesc, oldValor, oldParc, oldTotal, user);
        }
        
        return saved;
    }

    private void propagarAlteracaoParcelas(LancamentoCartao baseLancamento, String oldDesc, java.math.BigDecimal oldValor, Integer oldParc, Integer oldTotal, User user) {
        Fatura baseFatura = baseLancamento.getFatura();
        if (baseFatura == null) return;
        
        java.time.YearMonth baseYearMonth = java.time.YearMonth.parse(baseFatura.getMesAno());
        Long cardId = baseFatura.getCartao().getId();
        
        for (int p = oldParc + 1; p <= oldTotal; p++) {
            int offset = p - oldParc;
            java.time.YearMonth targetYearMonth = baseYearMonth.plusMonths(offset);
            String targetMesAno = targetYearMonth.toString();
            
            java.util.Optional<Fatura> optFatura = faturaRepository.findByCartaoIdAndMesAno(cardId, targetMesAno);
            if (optFatura.isPresent()) {
                Fatura targetFatura = optFatura.get();
                java.util.List<LancamentoCartao> targetLancamentos = lancamentoRepository.findByFaturaId(targetFatura.getId());
                for (LancamentoCartao fut : targetLancamentos) {
                    if (fut.getParcela().equals(p) &&
                        fut.getTotalParcelas().equals(oldTotal) &&
                        fut.getDescricao().equalsIgnoreCase(oldDesc) &&
                        fut.getValor().compareTo(oldValor) == 0) {
                        
                        fut.setDescricao(baseLancamento.getDescricao());
                        fut.setValor(baseLancamento.getValor());
                        if (baseLancamento.getData() != null) {
                            fut.setData(baseLancamento.getData().plusMonths(offset));
                        }
                        fut.setCategorias(new java.util.ArrayList<>(baseLancamento.getCategorias()));
                        lancamentoRepository.save(fut);
                        break;
                    }
                }
            }
        }
    }

    public void deleteLancamento(Long id, User user) {
        LancamentoCartao lancamento = lancamentoRepository.findById(id).orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));
        if (!lancamento.getFatura().getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        
        String desc = lancamento.getDescricao();
        java.math.BigDecimal valor = lancamento.getValor();
        Integer parc = lancamento.getParcela();
        Integer total = lancamento.getTotalParcelas();
        
        lancamentoRepository.delete(lancamento);
        
        if (total != null && total > 1 && parc != null && parc < total) {
            propagarDelecaoParcelas(lancamento.getFatura(), desc, valor, parc, total, user);
        }
    }

    private void propagarDelecaoParcelas(Fatura baseFatura, String desc, java.math.BigDecimal valor, Integer parc, Integer total, User user) {
        if (baseFatura == null) return;
        
        java.time.YearMonth baseYearMonth = java.time.YearMonth.parse(baseFatura.getMesAno());
        Long cardId = baseFatura.getCartao().getId();
        
        for (int p = parc + 1; p <= total; p++) {
            int offset = p - parc;
            java.time.YearMonth targetYearMonth = baseYearMonth.plusMonths(offset);
            String targetMesAno = targetYearMonth.toString();
            
            java.util.Optional<Fatura> optFatura = faturaRepository.findByCartaoIdAndMesAno(cardId, targetMesAno);
            if (optFatura.isPresent()) {
                Fatura targetFatura = optFatura.get();
                java.util.List<LancamentoCartao> targetLancamentos = lancamentoRepository.findByFaturaId(targetFatura.getId());
                for (LancamentoCartao fut : targetLancamentos) {
                    if (fut.getParcela().equals(p) &&
                        fut.getTotalParcelas().equals(total) &&
                        fut.getDescricao().equalsIgnoreCase(desc) &&
                        fut.getValor().compareTo(valor) == 0) {
                        
                        lancamentoRepository.delete(fut);
                        break;
                    }
                }
            }
        }
    }
}
