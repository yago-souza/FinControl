package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Fatura;
import com.fincontrol.backend.model.LancamentoCartao;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.security.SecurityService;
import com.fincontrol.backend.service.FaturaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/faturas")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FaturaController {
    private final FaturaService service;
    private final SecurityService securityService;

    @GetMapping
    public List<Fatura> getAll() {
        User user = securityService.getAuthenticatedUser();
        return service.findAll(user);
    }

    @GetMapping("/{faturaId}/lancamentos")
    public List<LancamentoCartao> getLancamentos(@PathVariable Long faturaId) {
        User user = securityService.getAuthenticatedUser();
        return service.findLancamentosByFaturaId(faturaId, user);
    }

    @PostMapping("/{cartaoId}/importar")
    public Fatura importarCsv(@PathVariable Long cartaoId, 
                              @RequestParam("mesAno") String mesAno,
                              @RequestParam("file") MultipartFile file) {
        User user = securityService.getAuthenticatedUser();
        try {
            return service.importarCsv(cartaoId, mesAno, file, user);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao importar CSV: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Fatura updateFatura(@PathVariable Long id, @RequestBody Fatura fatura) {
        User user = securityService.getAuthenticatedUser();
        return service.updateFatura(id, fatura, user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFatura(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        service.deleteFatura(id, user);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/lancamentos/{id}")
    public LancamentoCartao updateLancamento(@PathVariable Long id, @RequestBody LancamentoCartao lancamento) {
        User user = securityService.getAuthenticatedUser();
        return service.updateLancamento(id, lancamento, user);
    }

    @DeleteMapping("/lancamentos/{id}")
    public ResponseEntity<Void> deleteLancamento(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        service.deleteLancamento(id, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{faturaId}/lancamentos")
    public LancamentoCartao addLancamento(@PathVariable Long faturaId, @RequestBody LancamentoCartao lancamento) {
        User user = securityService.getAuthenticatedUser();
        return service.addLancamento(faturaId, lancamento, user);
    }

    @PatchMapping("/{id}/marcar-paga")
    public Fatura marcarComoPaga(@PathVariable Long id, @RequestParam Boolean pago) {
        User user = securityService.getAuthenticatedUser();
        return service.marcarComoPaga(id, pago, user);
    }
}
