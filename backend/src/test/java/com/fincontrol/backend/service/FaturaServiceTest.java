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

    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        user = new User(1L, "teste@teste.com", "senha", "João", "USER");
    }

    @Test
    void testMarcarComoPaga() {
        Cartao cartao = new Cartao();
        cartao.setUser(user);

        Fatura fatura = new Fatura();
        fatura.setId(1L);
        fatura.setPago(false);
        fatura.setCartao(cartao);

        when(faturaRepository.findById(1L)).thenReturn(Optional.of(fatura));
        when(faturaRepository.save(any(Fatura.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Fatura resultado = faturaService.marcarComoPaga(1L, true, user);

        assertNotNull(resultado);
        assertTrue(resultado.getPago());
        verify(faturaRepository, times(1)).save(fatura);

        resultado = faturaService.marcarComoPaga(1L, false, user);

        assertNotNull(resultado);
        assertFalse(resultado.getPago());
    }

    @Test
    void testAddLancamento() {
        Cartao cartao = new Cartao();
        cartao.setUser(user);

        Fatura fatura = new Fatura();
        fatura.setId(1L);
        fatura.setMesAno("2026-06");
        fatura.setCartao(cartao);

        LancamentoCartao lancamento = new LancamentoCartao();
        lancamento.setDescricao("Nova compra");
        lancamento.setParcela(1);
        lancamento.setTotalParcelas(1);

        when(faturaRepository.findById(1L)).thenReturn(Optional.of(fatura));
        when(lancamentoRepository.save(any(LancamentoCartao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LancamentoCartao resultado = faturaService.addLancamento(1L, lancamento, user);

        assertNotNull(resultado);
        assertEquals(fatura, resultado.getFatura());
        verify(lancamentoRepository, times(1)).save(lancamento);
    }

    @Test
    void testGerarParcelasFuturas() {
        Cartao cartao = new Cartao();
        cartao.setId(1L);
        cartao.setUser(user);

        Fatura fatura = new Fatura();
        fatura.setId(10L);
        fatura.setMesAno("2026-06");
        fatura.setCartao(cartao);

        LancamentoCartao lancamento = new LancamentoCartao();
        lancamento.setId(100L);
        lancamento.setFatura(fatura);
        lancamento.setDescricao("Compra parcelada");
        lancamento.setValor(new java.math.BigDecimal("50.00"));
        lancamento.setParcela(1);
        lancamento.setTotalParcelas(3);

        Fatura targetFatura2 = new Fatura();
        targetFatura2.setId(11L);
        targetFatura2.setMesAno("2026-07");
        targetFatura2.setCartao(cartao);

        Fatura targetFatura3 = new Fatura();
        targetFatura3.setId(12L);
        targetFatura3.setMesAno("2026-08");
        targetFatura3.setCartao(cartao);

        when(cartaoRepository.findById(1L)).thenReturn(Optional.of(cartao));
        when(faturaRepository.findByCartaoIdAndMesAno(1L, "2026-07")).thenReturn(Optional.of(targetFatura2));
        when(faturaRepository.findByCartaoIdAndMesAno(1L, "2026-08")).thenReturn(Optional.of(targetFatura3));
        when(lancamentoRepository.findByFaturaId(11L)).thenReturn(java.util.Collections.emptyList());
        when(lancamentoRepository.findByFaturaId(12L)).thenReturn(java.util.Collections.emptyList());
        when(lancamentoRepository.save(any(LancamentoCartao.class))).thenAnswer(invocation -> invocation.getArgument(0));

        faturaService.gerarParcelasFuturas(lancamento, user);

        verify(lancamentoRepository, times(2)).save(any(LancamentoCartao.class));
    }

    @Test
    void testImportarCsvEvitaDuplicadas() throws Exception {
        Cartao cartao = new Cartao();
        cartao.setId(1L);
        cartao.setUser(user);

        Fatura fatura = new Fatura();
        fatura.setId(10L);
        fatura.setMesAno("2026-06");
        fatura.setCartao(cartao);

        when(cartaoRepository.findById(1L)).thenReturn(Optional.of(cartao));
        when(faturaRepository.findByCartaoIdAndMesAno(1L, "2026-06")).thenReturn(Optional.of(fatura));

        LancamentoCartao existing = new LancamentoCartao();
        existing.setId(200L);
        existing.setData(java.time.LocalDate.of(2026, 6, 26));
        existing.setDescricao("Compra Duplicada");
        existing.setValor(new java.math.BigDecimal("15.50"));
        existing.setParcela(1);
        existing.setTotalParcelas(1);
        existing.setFatura(fatura);

        when(lancamentoRepository.findByFaturaId(10L)).thenReturn(java.util.Arrays.asList(existing));
        when(regraRepository.findByCategoriaUser(user)).thenReturn(java.util.Collections.emptyList());

        String csvData = "data;descricao;valor\n" +
                         "26/06/2026;Compra Duplicada;15.50\n" +
                         "26/06/2026;Compra Nova;20.00\n";

        org.springframework.web.multipart.MultipartFile mockFile = mock(org.springframework.web.multipart.MultipartFile.class);
        when(mockFile.getOriginalFilename()).thenReturn("fatura.csv");
        when(mockFile.getInputStream()).thenReturn(new java.io.ByteArrayInputStream(csvData.getBytes(java.nio.charset.StandardCharsets.UTF_8)));

        faturaService.importarCsv(1L, "2026-06", mockFile, user);

        verify(lancamentoRepository, times(1)).saveAll(anyList());
    }

    @Test
    void testUpdateLancamentoPropagaParaFuturos() {
        Cartao cartao = new Cartao();
        cartao.setId(1L);
        cartao.setUser(user);

        Fatura faturaJun = new Fatura();
        faturaJun.setId(10L);
        faturaJun.setMesAno("2026-06");
        faturaJun.setCartao(cartao);

        Fatura faturaJul = new Fatura();
        faturaJul.setId(11L);
        faturaJul.setMesAno("2026-07");
        faturaJul.setCartao(cartao);

        LancamentoCartao lJun = new LancamentoCartao();
        lJun.setId(100L);
        lJun.setDescricao("Compra Teste");
        lJun.setValor(new java.math.BigDecimal("50.00"));
        lJun.setParcela(1);
        lJun.setTotalParcelas(2);
        lJun.setFatura(faturaJun);

        LancamentoCartao lJul = new LancamentoCartao();
        lJul.setId(101L);
        lJul.setDescricao("Compra Teste");
        lJul.setValor(new java.math.BigDecimal("50.00"));
        lJul.setParcela(2);
        lJul.setTotalParcelas(2);
        lJul.setFatura(faturaJul);

        when(lancamentoRepository.findById(100L)).thenReturn(Optional.of(lJun));
        when(faturaRepository.findByCartaoIdAndMesAno(1L, "2026-07")).thenReturn(Optional.of(faturaJul));
        when(lancamentoRepository.findByFaturaId(11L)).thenReturn(java.util.Arrays.asList(lJul));
        when(lancamentoRepository.save(any(LancamentoCartao.class))).thenAnswer(i -> i.getArgument(0));

        LancamentoCartao update = new LancamentoCartao();
        update.setDescricao("Compra Editada");
        update.setValor(new java.math.BigDecimal("55.00"));
        update.setParcela(1);
        update.setTotalParcelas(2);
        update.setCategorias(new java.util.ArrayList<>());

        faturaService.updateLancamento(100L, update, user);

        verify(lancamentoRepository, times(2)).save(any(LancamentoCartao.class));
        assertEquals("Compra Editada", lJul.getDescricao());
        assertEquals(new java.math.BigDecimal("55.00"), lJul.getValor());
    }
}
