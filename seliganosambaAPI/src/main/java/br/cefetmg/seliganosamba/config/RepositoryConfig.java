package br.cefetmg.seliganosamba.config;

import org.jdbi.v3.core.Jdbi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import br.cefetmg.seliganosamba.repository.UsuarioRepository;
import br.cefetmg.seliganosamba.repository.EnsaioRepository;
import br.cefetmg.seliganosamba.repository.EquipamentoRepository;
import br.cefetmg.seliganosamba.repository.AgendamentoRepository;
import br.cefetmg.seliganosamba.repository.ContratoRepository;

@Configuration
public class RepositoryConfig {

    @Bean
    public UsuarioRepository usuarioRepository(Jdbi jdbi) {
        return jdbi.onDemand(UsuarioRepository.class);
    }

    @Bean
    public EnsaioRepository ensaioRepository(Jdbi jdbi) {
        return jdbi.onDemand(EnsaioRepository.class);
    }

    @Bean
    public EquipamentoRepository equipamentoRepository(Jdbi jdbi) {
        return jdbi.onDemand(EquipamentoRepository.class);
    }

    @Bean
    public AgendamentoRepository agendamentoRepository(Jdbi jdbi) {
        return jdbi.onDemand(AgendamentoRepository.class);
    }

    @Bean
    public ContratoRepository contratoRepository(Jdbi jdbi) {
        return jdbi.onDemand(ContratoRepository.class);
    }
}