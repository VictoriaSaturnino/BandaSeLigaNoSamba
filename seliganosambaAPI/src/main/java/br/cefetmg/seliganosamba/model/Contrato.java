package br.cefetmg.seliganosamba.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Contrato {
    private Long idContrato;
    private Long idAgendamento;
    private String pdf;
    private BigDecimal valor;
    private Boolean assinaturaProdutor;
    private Boolean assinaturaContratante;
    private LocalDateTime dataCriacao;
    private LocalDateTime dataAssinatura;
}