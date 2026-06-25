package com.fincontrol.backend.repository;

import com.fincontrol.backend.model.DividaRecebivel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DividaRecebivelRepository extends JpaRepository<DividaRecebivel, Long> {
    List<DividaRecebivel> findAllByOrderByDataVencimentoAsc();
}
