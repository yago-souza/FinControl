package com.fincontrol.backend.service;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.GastoFixoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GastoFixoService {
    private final GastoFixoRepository repository;

    public List<GastoFixo> findByUser(User user) {
        return repository.findByUser(user);
    }

    public GastoFixo findByIdAndUser(Long id, User user) {
        return repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Gasto fixo não encontrado"));
    }

    public GastoFixo save(GastoFixo gastoFixo, User user) {
        gastoFixo.setUser(user);
        return repository.save(gastoFixo);
    }

    public void delete(Long id, User user) {
        GastoFixo gasto = findByIdAndUser(id, user);
        repository.delete(gasto);
    }

    @Transactional
    public GastoFixo marcarComoPago(Long id, Boolean pago, User user) {
        GastoFixo gastoFixo = findByIdAndUser(id, user);
        gastoFixo.setPago(pago);
        return repository.save(gastoFixo);
    }
}
