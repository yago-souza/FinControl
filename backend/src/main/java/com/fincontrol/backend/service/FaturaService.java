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

    public Fatura importarCsv(Long cartaoId, String mesAno, MultipartFile file) throws Exception {
        Cartao cartao = cartaoRepository.findById(cartaoId).orElseThrow(() -> new RuntimeException("Cartão não encontrado"));
        
        Fatura fatura = new Fatura();
        fatura.setCartao(cartao);
        fatura.setMesAno(mesAno);
        fatura = faturaRepository.save(fatura);

        List<RegraCategoria> regras = regraRepository.findAll();
        List<LancamentoCartao> lancamentos = new ArrayList<>();

        Pattern installmentPattern = Pattern.compile("(\\d{2})/(\\d{2})");

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
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
                
                // Aplica regras
                for (RegraCategoria r : regras) {
                    if (l.getDescricao().toUpperCase().contains(r.getPalavraChave().toUpperCase())) {
                        l.setCategoria(r.getCategoria());
                        break;
                    }
                }
                
                lancamentos.add(l);
            }
        }

        lancamentoRepository.saveAll(lancamentos);
        return fatura;
    }
    
    public List<Fatura> findAll() {
        return faturaRepository.findAll();
    }

    public List<LancamentoCartao> findLancamentosByFaturaId(Long faturaId) {
        return lancamentoRepository.findByFaturaId(faturaId);
    }

    public Fatura updateFatura(Long id, Fatura faturaUpdate) {
        Fatura fatura = faturaRepository.findById(id).orElseThrow(() -> new RuntimeException("Fatura não encontrada"));
        fatura.setMesAno(faturaUpdate.getMesAno());
        fatura.setFechada(faturaUpdate.getFechada());
        return faturaRepository.save(fatura);
    }

    public void deleteFatura(Long id) {
        List<LancamentoCartao> lancamentos = findLancamentosByFaturaId(id);
        lancamentoRepository.deleteAll(lancamentos);
        faturaRepository.deleteById(id);
    }

    public LancamentoCartao updateLancamento(Long id, LancamentoCartao lancamentoUpdate) {
        LancamentoCartao lancamento = lancamentoRepository.findById(id).orElseThrow(() -> new RuntimeException("Lançamento não encontrado"));
        lancamento.setDescricao(lancamentoUpdate.getDescricao());
        lancamento.setValor(lancamentoUpdate.getValor());
        lancamento.setData(lancamentoUpdate.getData());
        lancamento.setParcela(lancamentoUpdate.getParcela());
        lancamento.setTotalParcelas(lancamentoUpdate.getTotalParcelas());
        if (lancamentoUpdate.getCategoria() != null && lancamentoUpdate.getCategoria().getId() != null) {
            lancamento.setCategoria(lancamentoUpdate.getCategoria());
        } else {
            lancamento.setCategoria(null);
        }
        return lancamentoRepository.save(lancamento);
    }

    public void deleteLancamento(Long id) {
        lancamentoRepository.deleteById(id);
    }
}
