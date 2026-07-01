package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.User;
import com.fincontrol.backend.security.SecurityService;
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
    private final SecurityService securityService;

    @GetMapping("/resumo")
    public Map<String, Object> getResumo(@RequestParam(required = false, value = "mes") String mes) {
        User user = securityService.getAuthenticatedUser();
        return service.getResumo(mes, user);
    }
}
