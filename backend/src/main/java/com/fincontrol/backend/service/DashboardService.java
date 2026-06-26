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
    private final DividaRecebivelRepository dividaRecebivelRepository;
    private final CategoriaRepository categoriaRepository;

    public Map<String, Object> getResumo(String mesAno) {
        Map<String, Object> resumo = new HashMap<>();
        
        List<GastoFixo> gastosFixos = gastoFixoRepository.findAll();
        BigDecimal totalFixo = gastosFixos.stream().filter(GastoFixo::getAtivo)
            .map(GastoFixo::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        // Convert "MM/YYYY" to "YYYY-MM" if needed
        String queryMesAno = mesAno;
        if (queryMesAno != null && queryMesAno.contains("/")) {
            String[] parts = queryMesAno.split("/");
            if (parts.length == 2) {
                queryMesAno = parts[1] + "-" + parts[0];
            }
        }

        List<Fatura> faturas;
        if (queryMesAno != null && !queryMesAno.isEmpty()) {
            faturas = faturaRepository.findByMesAno(queryMesAno);
        } else {
            faturas = faturaRepository.findAll();
        }
        
        BigDecimal totalCartao = BigDecimal.ZERO;
        BigDecimal totalParcelado = BigDecimal.ZERO;
        BigDecimal totalAVista = BigDecimal.ZERO;
        Map<String, BigDecimal> gastosPorCategoria = new HashMap<>();
        List<Map<String, Object>> proximosVencimentos = new ArrayList<>();

        for (GastoFixo gf : gastosFixos) {
            if (gf.getAtivo() != null && gf.getAtivo()) {
                Categoria c = gf.getCategoria();
                String catNome = (c != null && c.getNome() != null) ? c.getNome() : "Outros";
                BigDecimal valor = gf.getValor() != null ? gf.getValor() : BigDecimal.ZERO;
                gastosPorCategoria.put(catNome, gastosPorCategoria.getOrDefault(catNome, BigDecimal.ZERO).add(valor));

                Map<String, Object> v = new HashMap<>();
                v.put("id", gf.getId());
                v.put("descricao", gf.getNome());
                v.put("valor", gf.getValor());
                v.put("dia", gf.getDiaVencimento() != null ? gf.getDiaVencimento() : 1);
                v.put("tipo", "GASTO_FIXO");
                v.put("pago", gf.getPago() != null ? gf.getPago() : false);
                proximosVencimentos.add(v);
            }
        }
        
        if (!faturas.isEmpty()) {
            List<Long> faturaIds = faturas.stream().map(Fatura::getId).collect(Collectors.toList());
            List<LancamentoCartao> lancamentos = lancamentoRepository.findByFaturaIdIn(faturaIds);
            Map<Long, List<LancamentoCartao>> lancamentosPorFatura = lancamentos.stream().collect(Collectors.groupingBy(l -> l.getFatura().getId()));

            for (Fatura f : faturas) {
                List<LancamentoCartao> lancs = lancamentosPorFatura.getOrDefault(f.getId(), new ArrayList<>());
                
                BigDecimal valorFatura = lancs.stream().map(LancamentoCartao::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);
                totalCartao = totalCartao.add(valorFatura);
                
                if (valorFatura.compareTo(BigDecimal.ZERO) > 0 && f.getCartao() != null) {
                    Map<String, Object> v = new HashMap<>();
                    v.put("id", f.getId());
                    v.put("descricao", "Fatura " + f.getCartao().getNome());
                    v.put("valor", valorFatura);
                    v.put("dia", f.getCartao().getDiaVencimento() != null ? f.getCartao().getDiaVencimento() : 1);
                    v.put("tipo", "FATURA");
                    v.put("pago", f.getPago() != null ? f.getPago() : false);
                    proximosVencimentos.add(v);
                }
                
                for (LancamentoCartao l : lancs) {
                    List<Categoria> cats = l.getCategorias();
                    if (cats == null || cats.isEmpty()) {
                        String catNome = "Outros";
                        gastosPorCategoria.put(catNome, gastosPorCategoria.getOrDefault(catNome, BigDecimal.ZERO).add(l.getValor()));
                    } else {
                        BigDecimal valorDividido = l.getValor().divide(BigDecimal.valueOf(cats.size()), 2, java.math.RoundingMode.HALF_UP);
                        for (Categoria c : cats) {
                            String catNome = c.getNome() != null ? c.getNome() : "Outros";
                            gastosPorCategoria.put(catNome, gastosPorCategoria.getOrDefault(catNome, BigDecimal.ZERO).add(valorDividido));
                        }
                    }
                    
                    if (l.getTotalParcelas() != null && l.getTotalParcelas() > 1) {
                        totalParcelado = totalParcelado.add(l.getValor());
                    } else {
                        totalAVista = totalAVista.add(l.getValor());
                    }
                }
            }
        }

        // 1. Fetch and calculate PIX Debts and Receivables
        int targetYear = java.time.LocalDate.now().getYear();
        int targetMonth = java.time.LocalDate.now().getMonthValue();
        if (queryMesAno != null && queryMesAno.matches("\\d{4}-\\d{2}")) {
            String[] parts = queryMesAno.split("-");
            targetYear = Integer.parseInt(parts[0]);
            targetMonth = Integer.parseInt(parts[1]);
        }

        List<DividaRecebivel> allDividas = dividaRecebivelRepository.findAllByOrderByDataVencimentoAsc();
        int finalTargetYear = targetYear;
        int finalTargetMonth = targetMonth;
        List<DividaRecebivel> dividasNoMes = allDividas.stream()
            .filter(dr -> dr.getDataVencimento() != null && 
                          dr.getDataVencimento().getYear() == finalTargetYear && 
                          dr.getDataVencimento().getMonthValue() == finalTargetMonth)
            .collect(Collectors.toList());

        BigDecimal totalAPagarMes = BigDecimal.ZERO;
        BigDecimal totalAReceberMes = BigDecimal.ZERO;

        for (DividaRecebivel dr : dividasNoMes) {
            BigDecimal valor = dr.getValor() != null ? dr.getValor() : BigDecimal.ZERO;
            if ("DIVIDA".equals(dr.getTipo())) {
                totalAPagarMes = totalAPagarMes.add(valor);
            } else if ("RECEBIVEL".equals(dr.getTipo())) {
                totalAReceberMes = totalAReceberMes.add(valor);
            }

            // Include in Proximos Vencimentos
            Map<String, Object> v = new HashMap<>();
            v.put("id", dr.getId());
            v.put("descricao", dr.getDescricao() + " (" + dr.getNomePessoa() + ")");
            v.put("valor", valor);
            v.put("dia", dr.getDataVencimento().getDayOfMonth());
            v.put("tipo", dr.getTipo()); // "DIVIDA" or "RECEBIVEL"
            v.put("pago", dr.getPago() != null ? dr.getPago() : false);
            proximosVencimentos.add(v);
        }

        proximosVencimentos.sort((m1, m2) -> {
            Integer dia1 = (Integer) m1.get("dia");
            Integer dia2 = (Integer) m2.get("dia");
            return dia1.compareTo(dia2);
        });

        BigDecimal totalProximosVencimentos = proximosVencimentos.stream()
            .map(m -> (BigDecimal) m.get("valor"))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Metas de Gastos por Categoria
        List<Categoria> categorias = categoriaRepository.findAll();
        List<Map<String, Object>> metasCategorias = new ArrayList<>();
        for (Categoria c : categorias) {
            if (c.getMetaMensal() != null) {
                BigDecimal gasto = gastosPorCategoria.getOrDefault(c.getNome(), BigDecimal.ZERO);
                BigDecimal restante = c.getMetaMensal().subtract(gasto);
                if (restante.compareTo(BigDecimal.ZERO) < 0) {
                    restante = BigDecimal.ZERO;
                }
                double percentual = 0.0;
                if (c.getMetaMensal().compareTo(BigDecimal.ZERO) > 0) {
                    percentual = gasto.multiply(BigDecimal.valueOf(100))
                        .divide(c.getMetaMensal(), 2, java.math.RoundingMode.HALF_UP)
                        .doubleValue();
                }
                boolean excedeu = gasto.compareTo(c.getMetaMensal()) > 0;
                boolean proximoLimite = percentual >= 80.0;

                Map<String, Object> metaMap = new HashMap<>();
                metaMap.put("categoriaId", c.getId());
                metaMap.put("categoriaNome", c.getNome());
                metaMap.put("categoriaCor", c.getCor());
                metaMap.put("metaMensal", c.getMetaMensal());
                metaMap.put("gastoMes", gasto);
                metaMap.put("restante", restante);
                metaMap.put("percentual", percentual);
                metaMap.put("excedeu", excedeu);
                metaMap.put("proximoLimite", proximoLimite);
                metasCategorias.add(metaMap);
            }
        }

        // 3. Detalhamento de Investimentos (Tipos e Caixinhas)
        List<Investimento> investimentos = investimentoRepository.findAll();
        BigDecimal totalInvestido = investimentos.stream()
            .map(Investimento::getValor).reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, BigDecimal> caixinhaMap = new HashMap<>();
        Map<String, BigDecimal> prazoMap = new HashMap<>();
        
        prazoMap.put("CURTO_PRAZO", BigDecimal.ZERO);
        prazoMap.put("MEDIO_PRAZO", BigDecimal.ZERO);
        prazoMap.put("LONGO_PRAZO", BigDecimal.ZERO);
        
        for (Investimento inv : investimentos) {
            BigDecimal val = inv.getValor() != null ? inv.getValor() : BigDecimal.ZERO;
            
            if (inv.getCaixinha() != null) {
                String cxNome = inv.getCaixinha().getNome();
                caixinhaMap.put(cxNome, caixinhaMap.getOrDefault(cxNome, BigDecimal.ZERO).add(val));
            } else {
                String cxNome = "Sem Caixinha";
                caixinhaMap.put(cxNome, caixinhaMap.getOrDefault(cxNome, BigDecimal.ZERO).add(val));
            }
            
            if (inv.getTipoPrazo() != null && !inv.getTipoPrazo().isEmpty()) {
                String prazoKey = inv.getTipoPrazo();
                prazoMap.put(prazoKey, prazoMap.getOrDefault(prazoKey, BigDecimal.ZERO).add(val));
            } else {
                String prazoKey = "NÃO_ESPECIFICADO";
                prazoMap.put(prazoKey, prazoMap.getOrDefault(prazoKey, BigDecimal.ZERO).add(val));
            }
        }
        
        List<Map<String, Object>> investidoPorCaixinha = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : caixinhaMap.entrySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("nome", entry.getKey());
            m.put("valor", entry.getValue());
            investidoPorCaixinha.add(m);
        }
        
        List<Map<String, Object>> investidoPorPrazo = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : prazoMap.entrySet()) {
            Map<String, Object> m = new HashMap<>();
            m.put("prazo", entry.getKey());
            m.put("valor", entry.getValue());
            investidoPorPrazo.add(m);
        }

        resumo.put("totalCartao", totalCartao);
        resumo.put("totalParcelado", totalParcelado);
        resumo.put("totalAVista", totalAVista);
        resumo.put("gastosPorCategoria", gastosPorCategoria);
        resumo.put("totalFixo", totalFixo);
        resumo.put("totalInvestido", totalInvestido);
        resumo.put("gastosFixos", gastosFixos);
        resumo.put("faturas", faturas);
        resumo.put("proximosVencimentos", proximosVencimentos);
        resumo.put("totalProximosVencimentos", totalProximosVencimentos);
        
        resumo.put("totalAPagarMes", totalAPagarMes);
        resumo.put("totalAReceberMes", totalAReceberMes);
        resumo.put("metasCategorias", metasCategorias);
        resumo.put("investidoPorCaixinha", investidoPorCaixinha);
        resumo.put("investidoPorPrazo", investidoPorPrazo);
        
        return resumo;
    }
}
