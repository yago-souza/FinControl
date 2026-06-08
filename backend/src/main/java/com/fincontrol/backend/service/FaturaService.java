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

@Service
@RequiredArgsConstructor
public class FaturaService {
    private final FaturaRepository faturaRepository;
    private final LancamentoCartaoRepository lancamentoRepository;
    private final CartaoRepository cartaoRepository;
    private final RegraCategoriaRepository regraRepository;

    public Fatura importarCsv(Long cartaoId, String mesAno, MultipartFile file) throws Exception {
        Cartao cartao = cartaoRepository.findById(cartaoId).orElseThrow(() -> new RuntimeException("Cart?o n?o encontrado"));
        
        Fatura fatura = new Fatura();
        fatura.setCartao(cartao);
        fatura.setMesAno(mesAno);
        fatura = faturaRepository.save(fatura);

        List<RegraCategoria> regras = regraRepository.findAll();
        List<LancamentoCartao> lancamentos = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            boolean firstLine = true;
            while ((line = br.readLine()) != null) {
                if (firstLine) { firstLine = false; continue; } // Pula cabe?alho
                
                String[] values = line.split("[,;]");
                if (values.length < 3) continue;

                LancamentoCartao l = new LancamentoCartao();
                l.setFatura(fatura);
                
                // Exemplo simples: Data, Descri??o, Valor
                String dataStr = values[0].trim();
                String desc = values[1].trim();
                String valorStr = values[2].trim().replace("R$", "").replace(".", "").replace(",", ".").trim();
                
                try {
                    l.setData(LocalDate.parse(dataStr, DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                } catch(Exception e) {
                    l.setData(LocalDate.now()); // fallback
                }
                l.setDescricao(desc);
                try {
                    l.setValor(new BigDecimal(valorStr));
                } catch(Exception e) {
                    l.setValor(BigDecimal.ZERO);
                }
                
                // Aplica regras
                for (RegraCategoria r : regras) {
                    if (desc.toUpperCase().contains(r.getPalavraChave().toUpperCase())) {
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
}
