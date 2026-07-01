package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.GastoFixo;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GastoFixoRepository extends JpaRepository<GastoFixo, Long> {
    List<GastoFixo> findByUser(User user);
    Optional<GastoFixo> findByIdAndUser(Long id, User user);
}
