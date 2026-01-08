package br.cefetmg.seliganosamba.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.seliganosamba.model.Agendamento;
import br.cefetmg.seliganosamba.repository.AgendamentoRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/v1/seliganosamba/agendamento") // http://localhost:9091/api/v1/seliganosamba/agendamento
public class AgendamentoController {

    private final AgendamentoRepository agendamentoRepository;

    public AgendamentoController(AgendamentoRepository agendamentoRepository) {
        this.agendamentoRepository = agendamentoRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Agendamento> getById(@PathVariable Long id) {
        Agendamento agendamento = agendamentoRepository.findById(id);
        if (agendamento != null) {
            return ResponseEntity.ok().body(agendamento);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping({"","/"})
    public ResponseEntity<List<Agendamento>> getAll() {
        List<Agendamento> agendamentos = agendamentoRepository.findAll();
        return ResponseEntity.ok().body(agendamentos);
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<Agendamento>> getByUsuarioId(@PathVariable Long idUsuario) {
        List<Agendamento> agendamentos = agendamentoRepository.findByUsuarioId(idUsuario);
        return ResponseEntity.ok().body(agendamentos);
    }

    @GetMapping("/data/{dataEvento}")
    public ResponseEntity<List<Agendamento>> getByDataEvento(@PathVariable LocalDate dataEvento) {
        List<Agendamento> agendamentos = agendamentoRepository.findByDataEvento(dataEvento);
        return ResponseEntity.ok().body(agendamentos);
    }

    @GetMapping("/status/{aprovado}")
    public ResponseEntity<List<Agendamento>> getByAprovado(@PathVariable Boolean aprovado) {
        List<Agendamento> agendamentos = agendamentoRepository.findByAprovado(aprovado);
        return ResponseEntity.ok().body(agendamentos);
    }

    @PostMapping({"","/"})
    public ResponseEntity<Agendamento> create(@RequestBody Agendamento agendamento) {
        Long id = agendamentoRepository.insert(agendamento);
        agendamento.setIdAgendamento(id);
        return ResponseEntity.ok().body(agendamento);
    }

    @PutMapping({"","/"})
    public ResponseEntity<Agendamento> update(@RequestBody Agendamento agendamento) {
        if (agendamento.getIdAgendamento() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado");
        }
        int qtd = agendamentoRepository.update(agendamento);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum agendamento alterado");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi alterado mais de 1 agendamento.");
        }
        return ResponseEntity.ok().body(agendamento);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Agendamento> delete(@PathVariable Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Id do agendamento não encontrado");
        }
        Agendamento agendamento = agendamentoRepository.findById(id);
        if (agendamento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado");
        }
        int qtd = agendamentoRepository.delete(id);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum agendamento excluído.");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi excluído mais de 1 agendamento.");
        }
        return ResponseEntity.ok().body(agendamento);
    }

    @PatchMapping("/{id}/aprovado")
    public ResponseEntity<Void> updateAprovado(@PathVariable Long id, @RequestParam Boolean aprovado) {
        int qtd = agendamentoRepository.updateAprovado(id, aprovado);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Agendamento não encontrado");
        }
        return ResponseEntity.ok().build();
    }
}