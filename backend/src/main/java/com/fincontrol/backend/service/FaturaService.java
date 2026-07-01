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

        Pattern installmentPattern = Pattern.compile("(\\d{2})/(\\d{2})");

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
            String line;
            boolean firstLine = true;
            String separator = ",";
            
            int idxData = 0, idxDesc = 1, idxValor = 2; // defaults
            
            while ((line = br.readLine()) != null) {
                if (firstLine) { 
                    firstLine = false;
                    if (line.contains(";")) {
                        separator = ";";
                    }
                    String[] headers = line.split(separator + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                    for (int i = 0; i < headers.length; i++) {
                        String h = headers[i].toLowerCase().trim().replace("\"", "");
                        if (h.equals("data") || h.equals("date")) idxData = i;
                        else if (h.contains("descri") || h.contains("title") || h.contains("hist")) idxDesc = i;
                        else if (h.contains("valor") || h.contains("amount")) idxValor = i;
                    }
                    continue; 
                } 
                
                String[] values = line.split(separator + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
                if (values.length <= Math.max(idxData, Math.max(idxDesc, idxValor))) continue;

                LancamentoCartao l = new LancamentoCartao();
                l.setFatura(fatura);
                
                String dataStr = values[idxData].replace("\"", "").trim();
                String descStr = values[idxDesc].replace("\"", "").trim();
                String valorStr = values[idxValor].replace("\"", "").trim();
                
                try {
                    if (dataStr.contains("-")) {
                        l.setData(LocalDate.parse(dataStr));
                    } else {
                        l.setData(LocalDate.parse(dataStr, DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                    }
                } catch(Exception e) {
                    l.setData(LocalDate.now()); // fallback
                }

                Matcher matcher = installmentPattern.matcher(descStr);
                if (matcher.find()) {
                    String descWithoutInstallment = descStr.substring(0, matcher.start()) + " " + descStr.substring(matcher.end());
                    descWithoutInstallment = descWithoutInstallment.replace("-  ", " ").replace(" - ", " ").replaceAll("\\s{2,}", " ").trim();
                    if (descWithoutInstallment.endsWith("-")) {
                        descWithoutInstallment = descWithoutInstallment.substring(0, descWithoutInstallment.length() - 1).trim();
                    }
                    l.setDescricao(descWithoutInstallment);
                    l.setParcela(Integer.parseInt(matcher.group(1)));
                    l.setTotalParcelas(Integer.parseInt(matcher.group(2)));
                } else {
                    l.setDescricao(descStr);
                    l.setParcela(1);
                    l.setTotalParcelas(1);
                }
                
                l.setValor(parseValor(valorStr));
                
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
        lancamento.setDescricao(lancamentoUpdate.getDescricao());
        lancamento.setValor(lancamentoUpdate.getValor());
        lancamento.setData(lancamentoUpdate.getData());
        lancamento.setParcela(lancamentoUpdate.getParcela());
        lancamento.setTotalParcelas(lancamentoUpdate.getTotalParcelas());
        lancamento.setCategorias(lancamentoUpdate.getCategorias());
        return lancamentoRepository.save(lancamento);
    }

    public void deleteLancamento(Long id, User user) {
        LancamentoCartao lancamento = lancamentoRepository.findById(id).orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));
        if (!lancamento.getFatura().getCartao().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Acesso negado");
        }
        lancamentoRepository.delete(lancamento);
    }
}
