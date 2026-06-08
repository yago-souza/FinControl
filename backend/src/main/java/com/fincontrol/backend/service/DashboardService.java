package com.fincontrol.backend.service;

import com.fincontrol.backend.model.*;
import com.fincontrol.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {
    private final FaturaRepository faturaRepository;
    private final GastoFixoRepository gastoFixoRepository;
    private final LancamentoCartaoRepository lancamentoRepository;
    private final InvestimentoRepository investimentoRepository;

    public Map<String, Object> getResumo(String mesAno) {
        Map<String, Object> resumo = new HashMap<>();
        
        List<GastoFixo> gastosFixos = gastoFixoRepository.findAll();
        BigDecimal totalFixo = gastosFixos.stream().filter(GastoFixo::getAtivo)
            .map(GastoFixo::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
            
        List<Fatura> faturas = faturaRepository.findAll();
        if (mesAno != null && !mesAno.isEmpty()) {
            faturas = faturas.stream().filter(f -> mesAno.equals(f.getMesAno())).collect(Collectors.toList());
        }
        
        BigDecimal totalCartao = BigDecimal.ZERO;
        for (Fatura f : faturas) {
            List<LancamentoCartao> lancs = lancamentoRepository.findAll().stream()
                .filter(l -> l.getFatura().getId().equals(f.getId())).collect(Collectors.toList());
            totalCartao = totalCartao.add(lancs.stream().map(LancamentoCartao::getValor).reduce(BigDecimal.ZERO, BigDecimal::add));
        }

        List<Investimento> investimentos = investimentoRepository.findAll();
        BigDecimal totalInvestido = investimentos.stream()
            .map(Investimento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        resumo.put("totalCartao", totalCartao);
        resumo.put("totalFixo", totalFixo);
        resumo.put("totalInvestido", totalInvestido);
        resumo.put("gastosFixos", gastosFixos);
        resumo.put("faturas", faturas);
        
        return resumo;
    }
}
