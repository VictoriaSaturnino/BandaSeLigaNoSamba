package br.cefetmg.seliganosamba.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Agendamento {
    private Long idAgendamento;
    private Long idUsuario;
    private String nomeEvento;
    private Integer quantidadeConvidados;
    private String rua;
    private String numero;
    private String bairro;
    private String cidade;
    private String estado;
    private LocalDate dataEvento;
    private LocalTime horario;
    private Boolean sonorizacao;
    private String tipoEvento;
    private BigDecimal orcamento;
    private Boolean aprovado;
    private LocalDateTime dataCriacao;
}