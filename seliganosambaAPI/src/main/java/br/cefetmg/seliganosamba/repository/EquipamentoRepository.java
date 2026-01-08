package br.cefetmg.seliganosamba.repository;

import java.util.List;

import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import br.cefetmg.seliganosamba.model.Equipamento;

@RegisterBeanMapper(Equipamento.class)
public interface EquipamentoRepository {

    @SqlQuery("SELECT * FROM Equipamento;")
    List<Equipamento> findAll();

    @SqlQuery("SELECT * FROM Equipamento WHERE idEquipamento = :id;")
    Equipamento findById(@Bind("id") Long id);

    @SqlUpdate("""
        INSERT INTO Equipamento (nmEquipamento, disponivel)
        VALUES (:nmEquipamento, :disponivel);
    """)
    @GetGeneratedKeys
    Long insert(@BindBean Equipamento equipamento);

    @SqlUpdate("""
        UPDATE Equipamento
        SET nmEquipamento = :nmEquipamento,
            disponivel = :disponivel
        WHERE idEquipamento = :idEquipamento;
    """)
    int update(@BindBean Equipamento equipamento);

    @SqlUpdate("DELETE FROM Equipamento WHERE idEquipamento = :id;")
    int delete(@Bind("id") Long id);
}
