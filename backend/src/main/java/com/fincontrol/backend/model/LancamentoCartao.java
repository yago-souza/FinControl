package com.fincontrol.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LancamentoCartao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "fatura_id")
    private Fatura fatura;
    
    private String descricao;
    private BigDecimal valor;
    private LocalDate data;
    private Integer parcela; // 1 para a vista, ou numero da parcela
    private Integer totalParcelas; // total de parcelas
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "lancamento_categoria",
        joinColumns = @JoinColumn(name = "lancamento_id"),
        inverseJoinColumns = @JoinColumn(name = "categoria_id")
    )
    private java.util.List<Categoria> categorias = new java.util.ArrayList<>();
}
