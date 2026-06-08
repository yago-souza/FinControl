package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.RegraCategoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegraCategoriaRepository extends JpaRepository<RegraCategoria, Long> {
}
