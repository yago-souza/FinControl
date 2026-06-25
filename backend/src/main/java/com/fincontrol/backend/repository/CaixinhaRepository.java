package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.Caixinha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CaixinhaRepository extends JpaRepository<Caixinha, Long> {
}
