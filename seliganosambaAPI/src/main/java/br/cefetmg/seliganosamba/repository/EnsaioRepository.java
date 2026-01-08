package br.cefetmg.seliganosamba.repository;

import java.util.List;

import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import br.cefetmg.seliganosamba.model.Ensaio;

@RegisterBeanMapper(Ensaio.class)
public interface EnsaioRepository {

    @SqlQuery("SELECT * FROM Ensaio;")
    List<Ensaio> findAll();

    @SqlQuery("SELECT * FROM Ensaio WHERE idEnsaio = :id;")
    Ensaio findById(@Bind("id") Long id);

    @SqlUpdate("""
        INSERT INTO Ensaio (dtEnsaio, horario, local)
        VALUES (:dtEnsaio, :horario, :local);
    """)
    @GetGeneratedKeys
    Long insert(@BindBean Ensaio ensaio);

    @SqlUpdate("""
        UPDATE Ensaio
        SET dtEnsaio = :dtEnsaio,
            horario = :horario,
            local = :local
        WHERE idEnsaio = :idEnsaio;
    """)
    int update(@BindBean Ensaio ensaio);

    @SqlUpdate("DELETE FROM Ensaio WHERE idEnsaio = :id;")
    int delete(@Bind("id") Long id);
}
