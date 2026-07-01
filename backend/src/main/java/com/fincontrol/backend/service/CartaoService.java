package com.fincontrol.backend.service;

import com.fincontrol.backend.model.Cartao;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.CartaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartaoService {
    private final CartaoRepository repository;

    public List<Cartao> findByUser(User user) {
        return repository.findByUser(user);
    }

    public Cartao findByIdAndUser(Long id, User user) {
        return repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Cartão não encontrado"));
    }

    public Cartao save(Cartao cartao, User user) {
        cartao.setUser(user);
        return repository.save(cartao);
    }

    public void delete(Long id, User user) {
        Cartao cartao = findByIdAndUser(id, user);
        repository.delete(cartao);
    }
}
