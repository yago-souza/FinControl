package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Caixinha;
import com.fincontrol.backend.repository.CaixinhaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/caixinhas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CaixinhaController {
    private final CaixinhaRepository repository;

    @GetMapping
    public List<Caixinha> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Caixinha create(@RequestBody Caixinha caixinha) {
        return repository.save(caixinha);
    }

    @PutMapping("/{id}")
    public Caixinha update(@PathVariable Long id, @RequestBody Caixinha updateData) {
        Caixinha c = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Caixinha não encontrada"));
        c.setNome(updateData.getNome());
        return repository.save(c);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
