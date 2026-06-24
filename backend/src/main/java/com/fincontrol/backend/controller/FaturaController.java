package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Fatura;
import com.fincontrol.backend.model.LancamentoCartao;
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

    @GetMapping
    public List<Fatura> getAll() {
        return service.findAll();
    }

    @GetMapping("/{faturaId}/lancamentos")
    public List<LancamentoCartao> getLancamentos(@PathVariable Long faturaId) {
        return service.findLancamentosByFaturaId(faturaId);
    }

    @PostMapping("/{cartaoId}/importar")
    public Fatura importarCsv(@PathVariable Long cartaoId, 
                              @RequestParam("mesAno") String mesAno,
                              @RequestParam("file") MultipartFile file) {
        try {
            return service.importarCsv(cartaoId, mesAno, file);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao importar CSV: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public Fatura updateFatura(@PathVariable Long id, @RequestBody Fatura fatura) {
        return service.updateFatura(id, fatura);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFatura(@PathVariable Long id) {
        service.deleteFatura(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/lancamentos/{id}")
    public LancamentoCartao updateLancamento(@PathVariable Long id, @RequestBody LancamentoCartao lancamento) {
        return service.updateLancamento(id, lancamento);
    }

    @DeleteMapping("/lancamentos/{id}")
    public ResponseEntity<Void> deleteLancamento(@PathVariable Long id) {
        service.deleteLancamento(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{faturaId}/lancamentos")
    public LancamentoCartao addLancamento(@PathVariable Long faturaId, @RequestBody LancamentoCartao lancamento) {
        return service.addLancamento(faturaId, lancamento);
    }

    @PatchMapping("/{id}/marcar-paga")
    public Fatura marcarComoPaga(@PathVariable Long id, @RequestParam Boolean pago) {
        return service.marcarComoPaga(id, pago);
    }
}
