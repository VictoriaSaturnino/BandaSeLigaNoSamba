package br.cefetmg.seliganosamba.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.seliganosamba.model.Usuario;
import br.cefetmg.seliganosamba.repository.UsuarioRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/v1/seliganosamba/usuario") // http://localhost:9091/api/v1/seliganosamba/usuario
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> getById(@PathVariable Long id) {
        Usuario usuario = usuarioRepository.findById(id);
        if (usuario != null) {
            return ResponseEntity.ok().body(usuario);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<Usuario> getByEmail(@PathVariable String email) {
        Usuario usuario = usuarioRepository.findByEmail(email);
        if (usuario != null) {
            return ResponseEntity.ok().body(usuario);
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping({"","/"})
    public ResponseEntity<List<Usuario>> getAll() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        return ResponseEntity.ok().body(usuarios);
    }

    @PostMapping({"","/"})
    public ResponseEntity<Usuario> create(@RequestBody Usuario usuario) {
        Long id = usuarioRepository.insert(usuario);
        usuario.setIdUsuario(id);
        return ResponseEntity.ok().body(usuario);
    }

    @PutMapping({"","/"})
    public ResponseEntity<Usuario> update(@RequestBody Usuario usuario) {
        if (usuario.getIdUsuario() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
        }
        int qtd = usuarioRepository.update(usuario);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum usuário alterado");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi alterado mais de 1 usuário.");
        }
        return ResponseEntity.ok().body(usuario);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Usuario> delete(@PathVariable Long id) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Id do usuário não encontrado");
        }
        Usuario usuario = usuarioRepository.findById(id);
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
        }
        int qtd = usuarioRepository.delete(id);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Nenhum usuário excluído.");
        }
        if (qtd > 1) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Foi excluído mais de 1 usuário.");
        }
        return ResponseEntity.ok().body(usuario);
    }

    @PatchMapping("/{id}/ativo")
    public ResponseEntity<Void> updateAtivo(@PathVariable Long id, @RequestParam Boolean ativo) {
        int qtd = usuarioRepository.updateAtivo(id, ativo);
        if (qtd == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado");
        }
        return ResponseEntity.ok().build();
    }
}