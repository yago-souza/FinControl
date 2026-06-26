package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.Fatura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FaturaRepository extends JpaRepository<Fatura, Long> {
    List<Fatura> findByMesAno(String mesAno);
    Optional<Fatura> findByCartaoIdAndMesAno(Long cartaoId, String mesAno);
}
