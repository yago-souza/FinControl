package com.fincontrol.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DividaRecebivel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String tipo; // "DIVIDA" or "RECEBIVEL"
    private String descricao;
    private BigDecimal valor;
    private LocalDate dataVencimento;
    private String nomePessoa; // Credor or Devedor
    private Boolean pago = false;
    private LocalDate dataQuitacao;
}
