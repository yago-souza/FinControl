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

    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        user = new User(1L, "teste@teste.com", "senha", "João", "USER");
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

        when(faturaRepository.findByUser(user)).thenReturn(Arrays.asList(f));
        when(lancamentoRepository.findByFaturaIdIn(Arrays.asList(1L))).thenReturn(Arrays.asList(l1, l2));

        Map<String, Object> resumo = dashboardService.getResumo(null, user);

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

        when(gastoFixoRepository.findByUser(user)).thenReturn(Arrays.asList(gf));
        when(faturaRepository.findByUser(user)).thenReturn(Arrays.asList(f));
        when(lancamentoRepository.findByFaturaIdIn(Arrays.asList(1L))).thenReturn(Arrays.asList(l1));
        when(investimentoRepository.findByUser(user)).thenReturn(Arrays.asList(inv));
        when(dividaRecebivelRepository.findByUserOrderByDataVencimentoAsc(user)).thenReturn(Collections.emptyList());
        when(categoriaRepository.findByUser(user)).thenReturn(Collections.emptyList());

        Map<String, Object> resumo = dashboardService.getResumo(null, user);

        assertEquals(new BigDecimal("120.00"), resumo.get("totalFixo"));
        assertEquals(new BigDecimal("300.00"), resumo.get("totalCartao"));
        assertEquals(new BigDecimal("1000.00"), resumo.get("totalInvestido"));
    }
}
