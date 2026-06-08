package com.fincontrol.backend.controller;

import com.fincontrol.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {
    private final DashboardService service;

    @GetMapping("/resumo")
    public Map<String, Object> getResumo(@RequestParam(required = false) String mes) {
        return service.getResumo(mes);
    }
}
