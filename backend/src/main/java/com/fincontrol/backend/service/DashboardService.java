package com.fincontrol.backend.service;

import com.fincontrol.backend.model.*;
import com.fincontrol.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
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
        BigDecimal totalParcelado = BigDecimal.ZERO;
        BigDecimal totalAVista = BigDecimal.ZERO;
        Map<String, BigDecimal> gastosPorCategoria = new HashMap<>();
        List<Map<String, Object>> proximosVencimentos = new ArrayList<>();

        for (GastoFixo gf : gastosFixos) {
            if (gf.getAtivo() != null && gf.getAtivo()) {
                Map<String, Object> v = new HashMap<>();
                v.put("descricao", gf.getNome());
                v.put("valor", gf.getValor());
                v.put("dia", gf.getDiaVencimento() != null ? gf.getDiaVencimento() : 1);
                v.put("tipo", "GASTO_FIXO");
                proximosVencimentos.add(v);
            }
        }

        for (Fatura f : faturas) {
            List<LancamentoCartao> lancs = lancamentoRepository.findAll().stream()
                .filter(l -> l.getFatura().getId().equals(f.getId())).collect(Collectors.toList());
            
            BigDecimal valorFatura = lancs.stream().map(LancamentoCartao::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
            totalCartao = totalCartao.add(valorFatura);
            
            if (valorFatura.compareTo(BigDecimal.ZERO) > 0 && f.getCartao() != null) {
                Map<String, Object> v = new HashMap<>();
                v.put("descricao", "Fatura " + f.getCartao().getNome());
                v.put("valor", valorFatura);
                v.put("dia", f.getCartao().getDiaVencimento() != null ? f.getCartao().getDiaVencimento() : 1);
                v.put("tipo", "FATURA");
                proximosVencimentos.add(v);
            }
            
            for (LancamentoCartao l : lancs) {
                String catNome = (l.getCategoria() != null && l.getCategoria().getNome() != null) ? l.getCategoria().getNome() : "Outros";
                gastosPorCategoria.put(catNome, gastosPorCategoria.getOrDefault(catNome, BigDecimal.ZERO).add(l.getValor()));
                
                if (l.getTotalParcelas() != null && l.getTotalParcelas() > 1) {
                    totalParcelado = totalParcelado.add(l.getValor());
                } else {
                    totalAVista = totalAVista.add(l.getValor());
                }
            }
        }

        proximosVencimentos.sort((m1, m2) -> {
            Integer dia1 = (Integer) m1.get("dia");
            Integer dia2 = (Integer) m2.get("dia");
            return dia1.compareTo(dia2);
        });

        List<Investimento> investimentos = investimentoRepository.findAll();
        BigDecimal totalInvestido = investimentos.stream()
            .map(Investimento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        resumo.put("totalCartao", totalCartao);
        resumo.put("totalParcelado", totalParcelado);
        resumo.put("totalAVista", totalAVista);
        resumo.put("gastosPorCategoria", gastosPorCategoria);
        resumo.put("totalFixo", totalFixo);
        resumo.put("totalInvestido", totalInvestido);
        resumo.put("gastosFixos", gastosFixos);
        resumo.put("faturas", faturas);
        resumo.put("proximosVencimentos", proximosVencimentos);
        
        return resumo;
    }
}