package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.Categoria;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByUser(User user);
    Optional<Categoria> findByIdAndUser(Long id, User user);
}
