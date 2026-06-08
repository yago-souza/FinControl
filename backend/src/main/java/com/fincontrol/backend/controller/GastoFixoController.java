package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.service.GastoFixoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gastos-fixos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GastoFixoController {
    private final GastoFixoService service;

    @GetMapping
    public List<GastoFixo> getAll() {
        return service.findAll();
    }

    @PostMapping
    public GastoFixo create(@RequestBody GastoFixo gastoFixo) {
        return service.save(gastoFixo);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
