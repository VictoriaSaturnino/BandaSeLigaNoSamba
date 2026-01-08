package br.cefetmg.seliganosamba.repository;

import java.time.LocalDate;
import java.util.List;

import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import br.cefetmg.seliganosamba.model.Agendamento;

@RegisterBeanMapper(Agendamento.class)
public interface AgendamentoRepository {

    @SqlQuery("SELECT * FROM Agendamento;")
    List<Agendamento> findAll();

    @SqlQuery("SELECT * FROM Agendamento WHERE idAgendamento = :id;")
    Agendamento findById(@Bind("id") Long id);

    @SqlQuery("SELECT * FROM Agendamento WHERE idUsuario = :idUsuario;")
    List<Agendamento> findByUsuarioId(@Bind("idUsuario") Long idUsuario);

    @SqlQuery("SELECT * FROM Agendamento WHERE dataEvento = :dataEvento;")
    List<Agendamento> findByDataEvento(@Bind("dataEvento") LocalDate dataEvento);

    @SqlQuery("SELECT * FROM Agendamento WHERE aprovado = :aprovado;")
    List<Agendamento> findByAprovado(@Bind("aprovado") Boolean aprovado);

    @SqlUpdate("""
        INSERT INTO Agendamento (idUsuario, nomeEvento, quantidadeConvidados, rua, numero, bairro, cidade, estado, 
                                dataEvento, horario, sonorizacao, tipoEvento, orcamento, aprovado, dataCriacao)
        VALUES (:idUsuario, :nomeEvento, :quantidadeConvidados, :rua, :numero, :bairro, :cidade, :estado,
                :dataEvento, :horario, :sonorizacao, :tipoEvento, :orcamento, :aprovado, :dataCriacao);
    """)
    @GetGeneratedKeys
    Long insert(@BindBean Agendamento agendamento);

    @SqlUpdate("""
        UPDATE Agendamento
        SET idUsuario = :idUsuario,
            nomeEvento = :nomeEvento,
            quantidadeConvidados = :quantidadeConvidados,
            rua = :rua,
            numero = :numero,
            bairro = :bairro,
            cidade = :cidade,
            estado = :estado,
            dataEvento = :dataEvento,
            horario = :horario,
            sonorizacao = :sonorizacao,
            tipoEvento = :tipoEvento,
            orcamento = :orcamento,
            aprovado = :aprovado,
            dataCriacao = :dataCriacao
        WHERE idAgendamento = :idAgendamento;
    """)
    int update(@BindBean Agendamento agendamento);

    @SqlUpdate("DELETE FROM Agendamento WHERE idAgendamento = :id;")
    int delete(@Bind("id") Long id);

    @SqlUpdate("UPDATE Agendamento SET aprovado = :aprovado WHERE idAgendamento = :id;")
    int updateAprovado(@Bind("id") Long id, @Bind("aprovado") Boolean aprovado);
}