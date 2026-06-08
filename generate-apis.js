const fs = require('fs');
const path = require('path');

const writeJavaFile = (subpath, content) => {
    const fullPath = path.join(__dirname, 'backend', 'src', 'main', 'java', 'com', 'fincontrol', 'backend', subpath);
    fs.writeFileSync(fullPath, content, 'utf8');
};

const cartaoService = `package com.fincontrol.backend.service;

import com.fincontrol.backend.model.Cartao;
import com.fincontrol.backend.repository.CartaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartaoService {
    private final CartaoRepository repository;

    public List<Cartao> findAll() {
        return repository.findAll();
    }

    public Cartao save(Cartao cartao) {
        return repository.save(cartao);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
`;

const cartaoController = `package com.fincontrol.backend.controller;

import com.fincontrol.backend.model.Cartao;
import com.fincontrol.backend.service.CartaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cartoes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CartaoController {
    private final CartaoService service;

    @GetMapping
    public List<Cartao> getAll() {
        return service.findAll();
    }

    @PostMapping
    public Cartao create(@RequestBody Cartao cartao) {
        return service.save(cartao);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
`;

const gastoFixoService = `package com.fincontrol.backend.service;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.repository.GastoFixoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GastoFixoService {
    private final GastoFixoRepository repository;

    public List<GastoFixo> findAll() {
        return repository.findAll();
    }

    public GastoFixo save(GastoFixo gastoFixo) {
        return repository.save(gastoFixo);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }
}
`;

const gastoFixoController = `package com.fincontrol.backend.controller;

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
`;

writeJavaFile('service/CartaoService.java', cartaoService);
writeJavaFile('controller/CartaoController.java', cartaoController);
writeJavaFile('service/GastoFixoService.java', gastoFixoService);
writeJavaFile('controller/GastoFixoController.java', gastoFixoController);
