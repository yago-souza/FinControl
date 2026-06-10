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
    void testGetResumoGastosPorCategoria() {
        Fatura f = new Fatura();
        f.setId(1L);
        f.setMesAno("xxxx-yy");

        Categoria c1 = new Categoria();
        c1.setNome("Alimentacao");

        LancamentoCartao l1 = new LancamentoCartao();
        l1.setFatura(f);
        l1.setCategoria(c1);
        l1.setValor(new BigDecimal("100.00"));

        LancamentoCartao l2 = new LancamentoCartao();
        l2.setFatura(f);
        l2.setCategoria(c1);
        l2.setValor(new BigDecimal("50.00"));

        when(faturaRepository.findAll()).thenReturn(Arrays.asList(f));
        when(lancamentoRepository.findAll()).thenReturn(Arrays.asList(l1, l2));

        Map<String, Object> resumo = dashboardService.getResumo(null);

        Map<String, BigDecimal> gastosPorCategoria = (Map<String, BigDecimal>) resumo.get("gastosPorCategoria");
        assertEquals(new BigDecimal("150.00"), gastosPorCategoria.get("Alimentacao"));
    }
}