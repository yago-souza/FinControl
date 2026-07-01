package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.RegraCategoria;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RegraCategoriaRepository extends JpaRepository<RegraCategoria, Long> {
    List<RegraCategoria> findByCategoriaUser(User user);
}
