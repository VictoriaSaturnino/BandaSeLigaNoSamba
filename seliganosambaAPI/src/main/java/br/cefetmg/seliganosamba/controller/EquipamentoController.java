package br.cefetmg.seliganosamba.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.seliganosamba.model.Equipamento;
import br.cefetmg.seliganosamba.repository.EquipamentoRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/v1/seliganosamba/equipamento") // http://localhost:9091/api/v1/seliganosamba/equipamento
public class EquipamentoController {

    private final EquipamentoRepository equipamentoRepository;

    public EquipamentoController(EquipamentoRepository equipamentoRepository) {
        this.equipamentoRepository = equipamentoRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Equipamento> getById(@PathVariable Long id) {
        Equipamento equipamento = equipamentoRepository.findById(id);
        if (equipamento != null) {
            return ResponseEntity.ok().body(equipamento);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping({"","/"})
    public ResponseEntity<List<Equipamento>> getAll() {
        List<Equipamento> equipamentos = equipamentoRepository.findAll();
        return ResponseEntity.ok().body(equipamentos);
    }

    @PostMapping({"","/"})
    public ResponseEntity<Equipamento> create(@RequestBody Equipamento equipamento) {
        Long id = equipamentoRepository.insert(equipamento);
        equipamento.setIdEquipamento(id);
        return ResponseEntity.ok().body(equipamento);
    }

    @PutMapping({"","/"})
    public ResponseEntity<Equipamento> update(@RequestBody Equipamento equipamento) {
        if (equipamento.getIdEquipamento() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipamento não encontrado");
        }
        int qtd = equipamentoRepository.update(equipamento);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum equipamento alterado");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi alterado mais de 1 equipamento.");
        }
        return ResponseEntity.ok().body(equipamento);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Equipamento> delete(@PathVariable Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Id do equipamento não encontrado");
        }
        Equipamento equipamento = equipamentoRepository.findById(id);
        if (equipamento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Equipamento não encontrado");
        }
        int qtd = equipamentoRepository.delete(id);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum equipamento excluído.");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi excluído mais de 1 equipamento.");
        }
        return ResponseEntity.ok().body(equipamento);
    }
}
