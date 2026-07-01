package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Categoria;
import com.fincontrol.backend.model.RegraCategoria;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.CategoriaRepository;
import com.fincontrol.backend.security.SecurityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categorias")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CategoriaController {
    private final CategoriaRepository repository;
    private final SecurityService securityService;

    @GetMapping
    public List<Categoria> getAll() {
        User user = securityService.getAuthenticatedUser();
        return repository.findByUser(user);
    }

    @PostMapping
    public Categoria create(@RequestBody Categoria categoria) {
        User user = securityService.getAuthenticatedUser();
        categoria.setUser(user);
        if (categoria.getRegras() != null) {
            for (RegraCategoria r : categoria.getRegras()) {
                r.setCategoria(categoria);
            }
        }
        return repository.save(categoria);
    }

    @PutMapping("/{id}")
    public Categoria update(@PathVariable Long id, @RequestBody Categoria categoriaUpdate) {
        User user = securityService.getAuthenticatedUser();
        Categoria categoria = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        categoria.setNome(categoriaUpdate.getNome());
        categoria.setCor(categoriaUpdate.getCor());
        categoria.setMetaMensal(categoriaUpdate.getMetaMensal());
        
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
        User user = securityService.getAuthenticatedUser();
        Categoria categoria = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Categoria não encontrada"));
        repository.delete(categoria);
    }
}
