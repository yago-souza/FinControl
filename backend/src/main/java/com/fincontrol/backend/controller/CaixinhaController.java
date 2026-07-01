package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Caixinha;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.CaixinhaRepository;
import com.fincontrol.backend.security.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caixinhas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CaixinhaController {
    private final CaixinhaRepository repository;
    private final SecurityService securityService;

    @GetMapping
    public List<Caixinha> getAll() {
        User user = securityService.getAuthenticatedUser();
        return repository.findByUser(user);
    }

    @PostMapping
    public Caixinha create(@RequestBody Caixinha caixinha) {
        User user = securityService.getAuthenticatedUser();
        caixinha.setUser(user);
        return repository.save(caixinha);
    }

    @PutMapping("/{id}")
    public Caixinha update(@PathVariable Long id, @RequestBody Caixinha updateData) {
        User user = securityService.getAuthenticatedUser();
        Caixinha c = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Caixinha não encontrada"));
        c.setNome(updateData.getNome());
        return repository.save(c);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        Caixinha c = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Caixinha não encontrada"));
        repository.delete(c);
    }
}
