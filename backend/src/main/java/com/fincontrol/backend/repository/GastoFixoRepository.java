package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.GastoFixo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GastoFixoRepository extends JpaRepository<GastoFixo, Long> {
}
