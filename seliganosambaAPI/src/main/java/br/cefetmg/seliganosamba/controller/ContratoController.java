package br.cefetmg.seliganosamba.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.seliganosamba.model.Contrato;
import br.cefetmg.seliganosamba.repository.ContratoRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/v1/seliganosamba/contrato") // http://localhost:9091/api/v1/seliganosamba/contrato
public class ContratoController {

    private final ContratoRepository contratoRepository;

    public ContratoController(ContratoRepository contratoRepository) {
        this.contratoRepository = contratoRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contrato> getById(@PathVariable Long id) {
        Contrato contrato = contratoRepository.findById(id);
        if (contrato != null) {
            return ResponseEntity.ok().body(contrato);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping({"","/"})
    public ResponseEntity<List<Contrato>> getAll() {
        List<Contrato> contratos = contratoRepository.findAll();
        return ResponseEntity.ok().body(contratos);
    }

    @GetMapping("/agendamento/{idAgendamento}")
    public ResponseEntity<Contrato> getByAgendamentoId(@PathVariable Long idAgendamento) {
        Contrato contrato = contratoRepository.findByAgendamentoId(idAgendamento);
        if (contrato != null) {
            return ResponseEntity.ok().body(contrato);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping("/pendentes")
    public ResponseEntity<List<Contrato>> getPendentesAssinatura() {
        List<Contrato> contratos = contratoRepository.findPendentesAssinatura();
        return ResponseEntity.ok().body(contratos);
    }

    @PostMapping({"","/"})
    public ResponseEntity<Contrato> create(@RequestBody Contrato contrato) {
        Long id = contratoRepository.insert(contrato);
        contrato.setIdContrato(id);
        return ResponseEntity.ok().body(contrato);
    }

    @PutMapping({"","/"})
    public ResponseEntity<Contrato> update(@RequestBody Contrato contrato) {
        if (contrato.getIdContrato() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado");
        }
        int qtd = contratoRepository.update(contrato);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum contrato alterado");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi alterado mais de 1 contrato.");
        }
        return ResponseEntity.ok().body(contrato);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Contrato> delete(@PathVariable Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Id do contrato não encontrado");
        }
        Contrato contrato = contratoRepository.findById(id);
        if (contrato == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado");
        }
        int qtd = contratoRepository.delete(id);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum contrato excluído.");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi excluído mais de 1 contrato.");
        }
        return ResponseEntity.ok().body(contrato);
    }

    @PatchMapping("/{id}/assinaturas")
    public ResponseEntity<Void> updateAssinaturas(@PathVariable Long id,
                                                 @RequestParam Boolean assinaturaProdutor,
                                                 @RequestParam Boolean assinaturaContratante) {
        int qtd = contratoRepository.updateAssinaturas(id, assinaturaProdutor, assinaturaContratante);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Contrato não encontrado");
        }
        return ResponseEntity.ok().build();
    }
}