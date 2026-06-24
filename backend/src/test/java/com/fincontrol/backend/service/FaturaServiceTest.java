package com.fincontrol.backend.service;

import com.fincontrol.backend.model.*;
import com.fincontrol.backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class FaturaServiceTest {

    @Mock
    private FaturaRepository faturaRepository;
    @Mock
    private LancamentoCartaoRepository lancamentoRepository;
    @Mock
    private CartaoRepository cartaoRepository;
    @Mock
    private RegraCategoriaRepository regraRepository;

    @InjectMocks
    private FaturaService faturaService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testMarcarComoPaga() {
        Fatura fatura = new Fatura();
        fatura.setId(1L);
        fatura.setPago(false);

        when(faturaRepository.findById(1L)).thenReturn(Optional.of(fatura));
        when(faturaRepository.save(any(Fatura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Fatura resultado = faturaService.marcarComoPaga(1L, true);

        assertNotNull(resultado);
        assertTrue(resultado.getPago());
        verify(faturaRepository, times(1)).save(fatura);

        resultado = faturaService.marcarComoPaga(1L, false);

        assertNotNull(resultado);
        assertFalse(resultado.getPago());
    }

    @Test
    void testAddLancamento() {
        Fatura fatura = new Fatura();
        fatura.setId(1L);

        LancamentoCartao lancamento = new LancamentoCartao();
        lancamento.setDescricao("Nova compra");

        when(faturaRepository.findById(1L)).thenReturn(Optional.of(fatura));
        when(lancamentoRepository.save(any(LancamentoCartao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LancamentoCartao resultado = faturaService.addLancamento(1L, lancamento);

        assertNotNull(resultado);
        assertEquals(fatura, resultado.getFatura());
        verify(lancamentoRepository, times(1)).save(lancamento);
    }
}
