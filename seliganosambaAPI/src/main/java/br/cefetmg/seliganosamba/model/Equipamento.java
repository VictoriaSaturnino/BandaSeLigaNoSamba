package br.cefetmg.seliganosamba.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Equipamento {
    private Long idEquipamento;  // corresponde ao ID no banco
    private String nmEquipamento; // nome do equipamento
    private char disponivel;      // 'S' para disponível, 'N' para indisponível
}
