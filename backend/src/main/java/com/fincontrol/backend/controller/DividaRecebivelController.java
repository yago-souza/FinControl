package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.DividaRecebivel;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.repository.DividaRecebivelRepository;
import com.fincontrol.backend.security.SecurityService;
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
    private final SecurityService securityService;

    @GetMapping
    public List<DividaRecebivel> getAll() {
        User user = securityService.getAuthenticatedUser();
        return repository.findByUserOrderByDataVencimentoAsc(user);
    }

    @PostMapping
    public DividaRecebivel create(@RequestBody DividaRecebivel dividaRecebivel) {
        User user = securityService.getAuthenticatedUser();
        dividaRecebivel.setUser(user);
        return repository.save(dividaRecebivel);
    }

    @PutMapping("/{id}")
    public DividaRecebivel update(@PathVariable Long id, @RequestBody DividaRecebivel updateData) {
        User user = securityService.getAuthenticatedUser();
        DividaRecebivel dr = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Dívida/Recebível não encontrado"));
        dr.setDescricao(updateData.getDescricao());
        dr.setValor(updateData.getValor());
        dr.setDataVencimento(updateData.getDataVencimento());
        dr.setNomePessoa(updateData.getNomePessoa());
        dr.setTipo(updateData.getTipo());
        dr.setPago(updateData.getPago());
        dr.setDataQuitacao(updateData.getDataQuitacao());
        return repository.save(dr);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        DividaRecebivel dr = repository.findByIdAndUser(id, user)
            .orElseThrow(() -> new RuntimeException("Dívida/Recebível não encontrado"));
        repository.delete(dr);
    }

    @PatchMapping("/{id}/quitar")
    public DividaRecebivel toggleQuitar(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        DividaRecebivel dr = repository.findByIdAndUser(id, user)
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
