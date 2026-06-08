package com.fincontrol.backend.service;

import com.fincontrol.backend.model.Cartao;
import com.fincontrol.backend.repository.CartaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartaoService {
    private final CartaoRepository repository;

    public List<Cartao> findAll() {
        return repository.findAll();
    }

    public Cartao save(Cartao cartao) {
        return repository.save(cartao);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
