package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.Caixinha;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaixinhaRepository extends JpaRepository<Caixinha, Long> {
    List<Caixinha> findByUser(User user);
    Optional<Caixinha> findByIdAndUser(Long id, User user);
}
