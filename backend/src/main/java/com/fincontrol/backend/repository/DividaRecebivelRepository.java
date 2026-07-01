package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.DividaRecebivel;
import com.fincontrol.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DividaRecebivelRepository extends JpaRepository<DividaRecebivel, Long> {
    List<DividaRecebivel> findByUserOrderByDataVencimentoAsc(User user);
    Optional<DividaRecebivel> findByIdAndUser(Long id, User user);
}
