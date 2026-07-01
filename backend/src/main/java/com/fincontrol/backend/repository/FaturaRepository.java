package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.Fatura;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface FaturaRepository extends JpaRepository<Fatura, Long> {
    List<Fatura> findByUserAndMesAno(User user, String mesAno);
    List<Fatura> findByUser(User user);
    Optional<Fatura> findByCartaoIdAndMesAno(Long cartaoId, String mesAno);
    Optional<Fatura> findByIdAndUser(Long id, User user);
}
