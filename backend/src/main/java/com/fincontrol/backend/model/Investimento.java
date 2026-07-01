package com.fincontrol.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Investimento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String tipo; // "RENDA_FIXA", "VARIAVEL"
    private BigDecimal valor;
    private LocalDate data;
    private String tipoPrazo; // "CURTO_PRAZO", "MEDIO_PRAZO", "LONGO_PRAZO"

    @ManyToOne
    @JoinColumn(name = "caixinha_id")
    private Caixinha caixinha;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
