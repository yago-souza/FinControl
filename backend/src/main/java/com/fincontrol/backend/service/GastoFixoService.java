package com.fincontrol.backend.service;

import com.fincontrol.backend.model.GastoFixo;
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

    public List<GastoFixo> findAll() {
        return repository.findAll();
    }

    public GastoFixo save(GastoFixo gastoFixo) {
        return repository.save(gastoFixo);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    @Transactional
    public GastoFixo marcarComoPago(Long id, Boolean pago) {
        Optional<GastoFixo> optionalGastoFixo = repository.findById(id);
        if (optionalGastoFixo.isPresent()) {
            GastoFixo gastoFixo = optionalGastoFixo.get();
            gastoFixo.setPago(pago);
            return repository.save(gastoFixo);
        }
        return null;
    }
}
