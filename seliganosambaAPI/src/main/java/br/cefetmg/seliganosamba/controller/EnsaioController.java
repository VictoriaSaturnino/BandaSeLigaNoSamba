package br.cefetmg.seliganosamba.controller;

import java.sql.Date;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.seliganosamba.model.Ensaio;
import br.cefetmg.seliganosamba.repository.EnsaioRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/v1/seliganosamba/ensaio") // http://localhost:9091/api/v1/seliganosamba/ensaio
public class EnsaioController {

    private final EnsaioRepository ensaioRepository;

    public EnsaioController(EnsaioRepository ensaioRepository) {
        this.ensaioRepository = ensaioRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ensaio> getById(@PathVariable Long id) {
        Ensaio ensaio = ensaioRepository.findById(id);
        if (ensaio != null) {
            return ResponseEntity.ok().body(ensaio);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping({"","/"})
    public ResponseEntity<List<Ensaio>> getAll() {
        List<Ensaio> ensaios = ensaioRepository.findAll();
        return ResponseEntity.ok().body(ensaios);
    }

    @PostMapping({"","/"})
    public ResponseEntity<Ensaio> create(@RequestBody Ensaio ensaio) {
        Long id = ensaioRepository.insert(ensaio);
        ensaio.setIdEnsaio(id);
        return ResponseEntity.ok().body(ensaio);
    }

    @PutMapping({"","/"})
    public ResponseEntity<Ensaio> update(@RequestBody Ensaio ensaio) {
        if (ensaio.getIdEnsaio() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ensaio não encontrado");
        }
        int qtd = ensaioRepository.update(ensaio);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum ensaio alterado");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi alterado mais de 1 ensaio.");
        }
        return ResponseEntity.ok().body(ensaio);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Ensaio> delete(@PathVariable Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Id do ensaio não encontrado");
        }
        Ensaio ensaio = ensaioRepository.findById(id);
        if (ensaio == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ensaio não encontrado");
        }
        int qtd = ensaioRepository.delete(id);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum ensaio excluído.");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi excluído mais de 1 ensaio.");
        }
        return ResponseEntity.ok().body(ensaio);
    }
}
