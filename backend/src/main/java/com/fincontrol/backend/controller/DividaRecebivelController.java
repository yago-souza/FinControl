package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.DividaRecebivel;
import com.fincontrol.backend.repository.DividaRecebivelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/dividas-recebiveis")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DividaRecebivelController {
    private final DividaRecebivelRepository repository;

    @GetMapping
    public List<DividaRecebivel> getAll() {
        return repository.findAllByOrderByDataVencimentoAsc();
    }

    @PostMapping
    public DividaRecebivel create(@RequestBody DividaRecebivel dividaRecebivel) {
        return repository.save(dividaRecebivel);
    }

    @PutMapping("/{id}")
    public DividaRecebivel update(@PathVariable Long id, @RequestBody DividaRecebivel updateData) {
        DividaRecebivel dr = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Dívida/Recebível não encontrado"));
        dr.setDescricao(updateData.getDescricao());
        dr.setValor(updateData.getValor());
        dr.setDataVencimento(updateData.getDataVencimento());
        dr.setNomePessoa(updateData.getNomePessoa());
        dr.setTipo(updateData.getTipo());
        return repository.save(dr);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        repository.deleteById(id);
    }

    @PatchMapping("/{id}/quitar")
    public DividaRecebivel toggleQuitar(@PathVariable Long id) {
        DividaRecebivel dr = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Dívida/Recebível não encontrado"));
        boolean currentStatus = dr.getPago() != null ? dr.getPago() : false;
        dr.setPago(!currentStatus);
        if (dr.getPago()) {
            dr.setDataQuitacao(LocalDate.now());
        } else {
            dr.setDataQuitacao(null);
        }
        return repository.save(dr);
    }
}
