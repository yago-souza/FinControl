package com.fincontrol.backend.service;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.repository.GastoFixoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GastoFixoScheduler {
    private final GastoFixoRepository repository;

    // Run at 00:00:00 on the 1st day of every month
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void resetGastosFixosPagamento() {
        log.info("Iniciando reset mensal do status de pagamento dos gastos fixos...");
        List<GastoFixo> gastos = repository.findAll();
        for (GastoFixo g : gastos) {
            g.setPago(false);
        }
        repository.saveAll(gastos);
        log.info("Reset mensal de status de pagamento dos gastos fixos concluído!");
    }
}
