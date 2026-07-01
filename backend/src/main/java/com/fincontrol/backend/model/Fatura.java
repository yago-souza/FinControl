package com.fincontrol.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Fatura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "cartao_id")
    private Cartao cartao;
    
    private String mesAno; // e.g., "2025-06"
    private Boolean pago = false;
    private Boolean fechada = false;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
