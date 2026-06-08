package com.fincontrol.backend.service;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.repository.GastoFixoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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
}
