package br.cefetmg.seliganosamba.model;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ensaio {
    private Long idEnsaio;
    private LocalDate dtEnsaio;  // corresponde ao DATE no MySQL
    private String horario;       // VARCHAR(45)
    private String local;         // VARCHAR(200)
}
