package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Investimento;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.InvestimentoRepository;
import com.fincontrol.backend.security.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investimentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvestimentoController {
    private final InvestimentoRepository repository;
    private final SecurityService securityService;

    @GetMapping
    public List<Investimento> getAll() {
        User user = securityService.getAuthenticatedUser();
        return repository.findByUser(user);
    }

    @PostMapping
    public Investimento create(@RequestBody Investimento investimento) {
        User user = securityService.getAuthenticatedUser();
        investimento.setUser(user);
        return repository.save(investimento);
    }

    @PutMapping("/{id}")
    public Investimento update(@PathVariable Long id, @RequestBody Investimento updateData) {
        User user = securityService.getAuthenticatedUser();
        Investimento inv = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Investimento não encontrado"));
        inv.setTipo(updateData.getTipo());
        inv.setValor(updateData.getValor());
        inv.setData(updateData.getData());
        inv.setTipoPrazo(updateData.getTipoPrazo());
        inv.setCaixinha(updateData.getCaixinha());
        return repository.save(inv);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        Investimento inv = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Investimento não encontrado"));
        repository.delete(inv);
    }
}
