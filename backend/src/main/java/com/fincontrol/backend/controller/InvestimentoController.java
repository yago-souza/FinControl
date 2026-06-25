package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Investimento;
import com.fincontrol.backend.repository.InvestimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investimentos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvestimentoController {
    private final InvestimentoRepository repository;

    @GetMapping
    public List<Investimento> getAll() {
        return repository.findAll();
    }

    @PostMapping
    public Investimento create(@RequestBody Investimento investimento) {
        return repository.save(investimento);
    }

    @PutMapping("/{id}")
    public Investimento update(@PathVariable Long id, @RequestBody Investimento updateData) {
        Investimento inv = repository.findById(id)
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
        repository.deleteById(id);
    }
}
