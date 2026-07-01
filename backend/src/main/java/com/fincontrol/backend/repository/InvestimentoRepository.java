package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.Investimento;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvestimentoRepository extends JpaRepository<Investimento, Long> {
    List<Investimento> findByUser(User user);
    Optional<Investimento> findByIdAndUser(Long id, User user);
}
