package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Cartao;
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

    @GetMapping
    public List<Cartao> getAll() {
        return service.findAll();
    }

    @PostMapping
    public Cartao create(@RequestBody Cartao cartao) {
        return service.save(cartao);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
