package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Categoria;
import com.fincontrol.backend.model.RegraCategoria;
import com.fincontrol.backend.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoriaController {
    private final CategoriaRepository repository;

    @GetMapping
    public List<Categoria> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Categoria create(@RequestBody Categoria categoria) {
        if (categoria.getRegras() != null) {
            for (RegraCategoria r : categoria.getRegras()) {
                r.setCategoria(categoria);
            }
        }
        return repository.save(categoria);
    }

    @PutMapping("/{id}")
    public Categoria update(@PathVariable Long id, @RequestBody Categoria categoriaUpdate) {
        Categoria categoria = repository.findById(id).orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        categoria.setNome(categoriaUpdate.getNome());
        categoria.setCor(categoriaUpdate.getCor());
        
        // Clear and reload rules in place to handle JPA cascade/orphan removal properly
        categoria.getRegras().clear();
        if (categoriaUpdate.getRegras() != null) {
            for (RegraCategoria r : categoriaUpdate.getRegras()) {
                r.setCategoria(categoria);
                categoria.getRegras().add(r);
            }
        }
        return repository.save(categoria);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }
}
