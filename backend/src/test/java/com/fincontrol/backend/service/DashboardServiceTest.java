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
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
        l1.setCategoria(c1);
        l1.setValor(new BigDecimal("100.00"));
        l1.setTotalParcelas(1);

        LancamentoCartao l2 = new LancamentoCartao();
        l2.setFatura(f);
        l2.setCategoria(c1);
        l2.setValor(new BigDecimal("50.00"));
        l2.setTotalParcelas(3);

        when(faturaRepository.findAll()).thenReturn(Arrays.asList(f));
        when(lancamentoRepository.findAll()).thenReturn(Arrays.asList(l1, l2));

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
        when(lancamentoRepository.findAll()).thenReturn(Arrays.asList(l1));
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
}
