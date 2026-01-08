package br.cefetmg.seliganosamba.repository;

import java.util.List;

import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import br.cefetmg.seliganosamba.model.Contrato;

@RegisterBeanMapper(Contrato.class)
public interface ContratoRepository {

    @SqlQuery("SELECT * FROM Contrato;")
    List<Contrato> findAll();

    @SqlQuery("SELECT * FROM Contrato WHERE idContrato = :id;")
    Contrato findById(@Bind("id") Long id);

    @SqlQuery("SELECT * FROM Contrato WHERE idAgendamento = :idAgendamento;")
    Contrato findByAgendamentoId(@Bind("idAgendamento") Long idAgendamento);

    @SqlQuery("""
        SELECT * FROM Contrato 
        WHERE assinaturaProdutor = false OR assinaturaContratante = false;
    """)
    List<Contrato> findPendentesAssinatura();

    @SqlUpdate("""
        INSERT INTO Contrato (idAgendamento, pdf, valor, assinaturaProdutor, 
                            assinaturaContratante, dataCriacao, dataAssinatura)
        VALUES (:idAgendamento, :pdf, :valor, :assinaturaProdutor, 
                :assinaturaContratante, :dataCriacao, :dataAssinatura);
    """)
    @GetGeneratedKeys
    Long insert(@BindBean Contrato contrato);

    @SqlUpdate("""
        UPDATE Contrato
        SET idAgendamento = :idAgendamento,
            pdf = :pdf,
            valor = :valor,
            assinaturaProdutor = :assinaturaProdutor,
            assinaturaContratante = :assinaturaContratante,
            dataCriacao = :dataCriacao,
            dataAssinatura = :dataAssinatura
        WHERE idContrato = :idContrato;
    """)
    int update(@BindBean Contrato contrato);

    @SqlUpdate("DELETE FROM Contrato WHERE idContrato = :id;")
    int delete(@Bind("id") Long id);

    @SqlUpdate("""
        UPDATE Contrato 
        SET assinaturaProdutor = :assinaturaProdutor,
            assinaturaContratante = :assinaturaContratante,
            dataAssinatura = CASE 
                WHEN :assinaturaProdutor = true AND :assinaturaContratante = true 
                THEN NOW() 
                ELSE NULL 
            END
        WHERE idContrato = :id;
    """)
    int updateAssinaturas(@Bind("id") Long id, 
                         @Bind("assinaturaProdutor") Boolean assinaturaProdutor,
                         @Bind("assinaturaContratante") Boolean assinaturaContratante);
}