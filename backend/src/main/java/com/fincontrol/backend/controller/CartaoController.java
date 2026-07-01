package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Cartao;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.security.SecurityService;
import com.fincontrol.backend.service.CartaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cartoes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CartaoController {
    private final CartaoService service;
    private final SecurityService securityService;

    @GetMapping
    public List<Cartao> getAll() {
        User user = securityService.getAuthenticatedUser();
        return service.findByUser(user);
    }

    @PostMapping
    public Cartao create(@RequestBody Cartao cartao) {
        User user = securityService.getAuthenticatedUser();
        return service.save(cartao, user);
    }

    @PutMapping("/{id}")
    public Cartao update(@PathVariable Long id, @RequestBody Cartao cartao) {
        User user = securityService.getAuthenticatedUser();
        Cartao existing = service.findByIdAndUser(id, user);
        existing.setNome(cartao.getNome());
        existing.setLimite(cartao.getLimite());
        existing.setDiaVencimento(cartao.getDiaVencimento());
        return service.save(existing, user);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        service.delete(id, user);
    }
}
