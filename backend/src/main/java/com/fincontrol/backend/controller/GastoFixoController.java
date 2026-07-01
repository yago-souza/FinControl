package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.model.User;
import com.fincontrol.backend.security.SecurityService;
import com.fincontrol.backend.service.GastoFixoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/gastos-fixos")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GastoFixoController {
    private final GastoFixoService service;
    private final SecurityService securityService;

    @GetMapping
    public List<GastoFixo> getAll() {
        User user = securityService.getAuthenticatedUser();
        return service.findByUser(user);
    }

    @PostMapping
    public GastoFixo create(@RequestBody GastoFixo gastoFixo) {
        User user = securityService.getAuthenticatedUser();
        return service.save(gastoFixo, user);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        User user = securityService.getAuthenticatedUser();
        service.delete(id, user);
    }

    @PutMapping("/{id}/pagar")
    public ResponseEntity<GastoFixo> marcarComoPago(@PathVariable Long id, @RequestParam(value = "pago", defaultValue = "true") Boolean pago) {
        User user = securityService.getAuthenticatedUser();
        GastoFixo gastoFixo = service.marcarComoPago(id, pago, user);
        if (gastoFixo != null) {
            return ResponseEntity.ok(gastoFixo);
        }
        return ResponseEntity.notFound().build();
    }
}
