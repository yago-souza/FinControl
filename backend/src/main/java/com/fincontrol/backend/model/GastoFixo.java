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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "gasto_fixo_categoria",
        joinColumns = @JoinColumn(name = "gasto_fixo_id"),
        inverseJoinColumns = @JoinColumn(name = "categoria_id")
    )
    private java.util.List<Categoria> categorias = new java.util.ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
