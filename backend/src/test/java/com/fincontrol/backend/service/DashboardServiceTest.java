package com.fincontrol.backend.service;

import com.fincontrol.backend.model.*;
import com.fincontrol.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class DashboardServiceTest {

    @Mock
    private FaturaRepository faturaRepository;
    @Mock
    private GastoFixoRepository gastoFixoRepository;
    @Mock
    private LancamentoCartaoRepository lancamentoRepository;
    @Mock
    private InvestimentoRepository investimentoRepository;
    @Mock
    private DividaRecebivelRepository dividaRecebivelRepository;
    @Mock
    private CategoriaRepository categoriaRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetResumoGastosEParcelas() {
        Fatura f = new Fatura();
        f.setId(1L);

        Categoria c1 = new Categoria();
        c1.setNome("Alimentacao");

        LancamentoCartao l1 = new LancamentoCartao();
        l1.setFatura(f);
        l1.setCategorias(java.util.Arrays.asList(c1));
        l1.setValor(new BigDecimal("100.00"));
        l1.setTotalParcelas(1);

        LancamentoCartao l2 = new LancamentoCartao();
        l2.setFatura(f);
        l2.setCategorias(java.util.Arrays.asList(c1));
        l2.setValor(new BigDecimal("50.00"));
        l2.setTotalParcelas(3);

        when(faturaRepository.findAll()).thenReturn(Arrays.asList(f));
        when(lancamentoRepository.findByFaturaIdIn(Arrays.asList(1L))).thenReturn(Arrays.asList(l1, l2));

        Map<String, Object> resumo = dashboardService.getResumo(null);

        Map<String, BigDecimal> gastosPorCategoria = (Map<String, BigDecimal>) resumo.get("gastosPorCategoria");
        assertEquals(new BigDecimal("150.00"), gastosPorCategoria.get("Alimentacao"));
        
        assertEquals(new BigDecimal("50.00"), resumo.get("totalParcelado"));
        assertEquals(new BigDecimal("100.00"), resumo.get("totalAVista"));
        assertEquals(new BigDecimal("150.00"), resumo.get("totalCartao"));
    }

    @Test
    void testProximosVencimentosEInvestimentos() {
        GastoFixo gf = new GastoFixo();
        gf.setId(1L);
        gf.setNome("Internet");
        gf.setValor(new BigDecimal("120.00"));
        gf.setAtivo(true);
        gf.setDiaVencimento(10);

        Cartao cartao = new Cartao();
        cartao.setNome("Nubank");
        cartao.setDiaVencimento(5);

        Fatura f = new Fatura();
        f.setId(1L);
        f.setCartao(cartao);

        LancamentoCartao l1 = new LancamentoCartao();
        l1.setFatura(f);
        l1.setValor(new BigDecimal("300.00"));

        Investimento inv = new Investimento();
        inv.setValor(new BigDecimal("1000.00"));

        when(gastoFixoRepository.findAll()).thenReturn(Arrays.asList(gf));
        when(faturaRepository.findAll()).thenReturn(Arrays.asList(f));
        when(lancamentoRepository.findByFaturaIdIn(Arrays.asList(1L))).thenReturn(Arrays.asList(l1));
        when(investimentoRepository.findAll()).thenReturn(Arrays.asList(inv));

        Map<String, Object> resumo = dashboardService.getResumo(null);

        assertEquals(new BigDecimal("120.00"), resumo.get("totalFixo"));
        assertEquals(new BigDecimal("1000.00"), resumo.get("totalInvestido"));

        List<Map<String, Object>> vencimentos = (List<Map<String, Object>>) resumo.get("proximosVencimentos");
        assertEquals(2, vencimentos.size());

        // sorted by day: dia 5 comes first, dia 10 second
        assertEquals("Fatura Nubank", vencimentos.get(0).get("descricao"));
        assertEquals(5, vencimentos.get(0).get("dia"));
        
        assertEquals("Internet", vencimentos.get(1).get("descricao"));
        assertEquals(10, vencimentos.get(1).get("dia"));
    }

    @Test
    void testNovasFuncionalidades() {
        // 1. Mock Category and Category Limit
        Categoria cat1 = new Categoria();
        cat1.setId(1L);
        cat1.setNome("Lazer");
        cat1.setCor("blue");
        cat1.setMetaMensal(new BigDecimal("500.00"));

        when(categoriaRepository.findAll()).thenReturn(Arrays.asList(cat1));

        // Create transaction to spend in "Lazer"
        Fatura fat = new Fatura();
        fat.setId(1L);
        LancamentoCartao lanc = new LancamentoCartao();
        lanc.setFatura(fat);
        lanc.setCategorias(Arrays.asList(cat1));
        lanc.setValor(new BigDecimal("400.00")); // 400 of 500 meta (80% -> proximoLimite = true)

        when(faturaRepository.findByMesAno(any())).thenReturn(Arrays.asList(fat));
        when(lancamentoRepository.findByFaturaIdIn(Arrays.asList(1L))).thenReturn(Arrays.asList(lanc));

        // 2. Mock Investments with Caixinha and Term/Prazo
        Caixinha cx = new Caixinha();
        cx.setId(1L);
        cx.setNome("Viagem");

        Investimento inv1 = new Investimento();
        inv1.setValor(new BigDecimal("1000.00"));
        inv1.setCaixinha(cx);
        inv1.setTipoPrazo("MEDIO_PRAZO");

        Investimento inv2 = new Investimento();
        inv2.setValor(new BigDecimal("500.00"));
        inv2.setCaixinha(null);
        inv2.setTipoPrazo("CURTO_PRAZO");

        when(investimentoRepository.findAll()).thenReturn(Arrays.asList(inv1, inv2));

        // 3. Mock Debts and Receivables
        DividaRecebivel dr1 = new DividaRecebivel();
        dr1.setId(1L);
        dr1.setTipo("DIVIDA");
        dr1.setDescricao("Jantar no cartão");
        dr1.setNomePessoa("Namorada");
        dr1.setValor(new BigDecimal("100.00"));
        dr1.setDataVencimento(java.time.LocalDate.of(2026, 6, 7));
        dr1.setPago(false);

        DividaRecebivel dr2 = new DividaRecebivel();
        dr2.setId(2L);
        dr2.setTipo("RECEBIVEL");
        dr2.setDescricao("Empréstimo");
        dr2.setNomePessoa("Amigo");
        dr2.setValor(new BigDecimal("50.00"));
        dr2.setDataVencimento(java.time.LocalDate.of(2026, 6, 12));
        dr2.setPago(true);

        when(dividaRecebivelRepository.findAllByOrderByDataVencimentoAsc()).thenReturn(Arrays.asList(dr1, dr2));

        // Call Service
        Map<String, Object> resumo = dashboardService.getResumo("06/2026");

        // Assert Debts and Receivables
        assertEquals(new BigDecimal("100.00"), resumo.get("totalAPagarMes"));
        assertEquals(new BigDecimal("50.00"), resumo.get("totalAReceberMes"));

        List<Map<String, Object>> vencimentos = (List<Map<String, Object>>) resumo.get("proximosVencimentos");
        assertEquals(2, vencimentos.size());
        assertEquals("Jantar no cartão (Namorada)", vencimentos.get(0).get("descricao"));
        assertEquals(7, vencimentos.get(0).get("dia"));
        assertEquals("DIVIDA", vencimentos.get(0).get("tipo"));

        // Assert Category Limit
        List<Map<String, Object>> metas = (List<Map<String, Object>>) resumo.get("metasCategorias");
        assertEquals(1, metas.size());
        assertEquals("Lazer", metas.get(0).get("categoriaNome"));
        assertEquals(new BigDecimal("400.00"), metas.get(0).get("gastoMes"));
        assertEquals(new BigDecimal("100.00"), metas.get(0).get("restante"));
        assertEquals(80.0, metas.get(0).get("percentual"));
        assertEquals(true, metas.get(0).get("proximoLimite"));
        assertEquals(false, metas.get(0).get("excedeu"));

        // Assert Investments
        List<Map<String, Object>> porCaixinha = (List<Map<String, Object>>) resumo.get("investidoPorCaixinha");
        assertEquals(2, porCaixinha.size());
        BigDecimal valorViagem = porCaixinha.stream().filter(m -> "Viagem".equals(m.get("nome"))).map(m -> (BigDecimal) m.get("valor")).findFirst().orElse(BigDecimal.ZERO);
        assertEquals(new BigDecimal("1000.00"), valorViagem);

        List<Map<String, Object>> porPrazo = (List<Map<String, Object>>) resumo.get("investidoPorPrazo");
        assertEquals(3, porPrazo.size()); // CURTO, MEDIO, LONGO
        BigDecimal valorMedio = porPrazo.stream().filter(m -> "MEDIO_PRAZO".equals(m.get("prazo"))).map(m -> (BigDecimal) m.get("valor")).findFirst().orElse(BigDecimal.ZERO);
        assertEquals(new BigDecimal("1000.00"), valorMedio);
    }

    @Test
    void testResumoGastoFixoComCategoria() {
        Categoria cat1 = new Categoria();
        cat1.setId(1L);
        cat1.setNome("Lazer");
        cat1.setCor("blue");
        cat1.setMetaMensal(new BigDecimal("500.00"));

        GastoFixo gf = new GastoFixo();
        gf.setId(1L);
        gf.setNome("Netflix");
        gf.setValor(new BigDecimal("50.00"));
        gf.setAtivo(true);
        gf.setCategorias(Arrays.asList(cat1));

        when(gastoFixoRepository.findAll()).thenReturn(Arrays.asList(gf));
        when(faturaRepository.findAll()).thenReturn(Collections.emptyList());
        when(categoriaRepository.findAll()).thenReturn(Arrays.asList(cat1));

        Map<String, Object> resumo = dashboardService.getResumo(null);

        Map<String, BigDecimal> gastosPorCategoria = (Map<String, BigDecimal>) resumo.get("gastosPorCategoria");
        assertEquals(new BigDecimal("50.00"), gastosPorCategoria.get("Lazer"));

        List<Map<String, Object>> metas = (List<Map<String, Object>>) resumo.get("metasCategorias");
        assertEquals(1, metas.size());
        assertEquals(new BigDecimal("50.00"), metas.get(0).get("gastoMes"));
    }

    @Test
    void testResumoGastoFixoComMultiplasCategorias() {
        Categoria cat1 = new Categoria();
        cat1.setId(1L);
        cat1.setNome("Lazer");
        cat1.setCor("blue");
        cat1.setMetaMensal(new BigDecimal("500.00"));

        Categoria cat2 = new Categoria();
        cat2.setId(2L);
        cat2.setNome("Alimentacao");
        cat2.setCor("green");
        cat2.setMetaMensal(new BigDecimal("300.00"));

        GastoFixo gf = new GastoFixo();
        gf.setId(1L);
        gf.setNome("Internet Compartilhada");
        gf.setValor(new BigDecimal("100.00"));
        gf.setAtivo(true);
        gf.setCategorias(Arrays.asList(cat1, cat2));

        when(gastoFixoRepository.findAll()).thenReturn(Arrays.asList(gf));
        when(faturaRepository.findAll()).thenReturn(Collections.emptyList());
        when(categoriaRepository.findAll()).thenReturn(Arrays.asList(cat1, cat2));

        Map<String, Object> resumo = dashboardService.getResumo(null);

        Map<String, BigDecimal> gastosPorCategoria = (Map<String, BigDecimal>) resumo.get("gastosPorCategoria");
        assertEquals(new BigDecimal("50.00"), gastosPorCategoria.get("Lazer"));
        assertEquals(new BigDecimal("50.00"), gastosPorCategoria.get("Alimentacao"));
    }
}
