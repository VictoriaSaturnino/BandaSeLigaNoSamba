package br.cefetmg.seliganosamba.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario {
    private Long idUsuario;
    private String nome;
    private String email;
    private String senha;
    private String funcao;
    private LocalDate dtNascimento;
    private String telefone;
    private LocalDateTime dataCadastro;
    private Boolean ativo;
}