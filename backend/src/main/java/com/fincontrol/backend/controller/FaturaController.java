package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Fatura;
import com.fincontrol.backend.model.LancamentoCartao;
import com.fincontrol.backend.service.FaturaService;
import lombok.RequiredArgsConstructor;
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
}
