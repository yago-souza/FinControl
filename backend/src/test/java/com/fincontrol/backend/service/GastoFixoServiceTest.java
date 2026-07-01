package com.fincontrol.backend.service;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.GastoFixoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class GastoFixoServiceTest {

    @Mock
    private GastoFixoRepository repository;

    @InjectMocks
    private GastoFixoService service;

    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        user = new User(1L, "teste@teste.com", "senha", "João", "USER");
    }

    @Test
    void testMarcarComoPago() {
        GastoFixo gasto = new GastoFixo();
        gasto.setId(1L);
        gasto.setPago(false);
        gasto.setUser(user);

        when(repository.findByIdAndUser(1L, user)).thenReturn(Optional.of(gasto));
        when(repository.save(any(GastoFixo.class))).thenAnswer(invocation -> invocation.getArgument(0));

        GastoFixo resultado = service.marcarComoPago(1L, true, user);

        assertNotNull(resultado);
        assertTrue(resultado.getPago());
        verify(repository, times(1)).save(gasto);

        resultado = service.marcarComoPago(1L, false, user);

        assertNotNull(resultado);
        assertFalse(resultado.getPago());
    }
}
