package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.LancamentoCartao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LancamentoCartaoRepository extends JpaRepository<LancamentoCartao, Long> {
    List<LancamentoCartao> findByFaturaId(Long faturaId);
}
