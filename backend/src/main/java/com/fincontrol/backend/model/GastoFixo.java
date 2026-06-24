package com.fincontrol.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GastoFixo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nome;
    private String tipo; // "ASSINATURA", "CONTA", "FINANCIAMENTO"
    private BigDecimal valor;
    private Integer diaVencimento;
    private Boolean pago = false;
    private Boolean ativo = true;
}
