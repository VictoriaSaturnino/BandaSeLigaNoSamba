package br.cefetmg.seliganosamba.repository;

import java.util.List;

import org.jdbi.v3.sqlobject.config.RegisterBeanMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.GetGeneratedKeys;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import br.cefetmg.seliganosamba.model.Usuario;

@RegisterBeanMapper(Usuario.class)
public interface UsuarioRepository {

    @SqlQuery("SELECT * FROM Usuario;")
    List<Usuario> findAll();

    @SqlQuery("SELECT * FROM Usuario WHERE idUsuario = :id;")
    Usuario findById(@Bind("id") Long id);

    @SqlQuery("SELECT * FROM Usuario WHERE email = :email;")
    Usuario findByEmail(@Bind("email") String email);

    @SqlUpdate("""
        INSERT INTO Usuario (nome, email, senha, funcao, dtNascimento, telefone, dataCadastro, ativo)
        VALUES (:nome, :email, :senha, :funcao, :dtNascimento, :telefone, :dataCadastro, :ativo);
    """)
    @GetGeneratedKeys
    Long insert(@BindBean Usuario usuario);

    @SqlUpdate("""
        UPDATE Usuario
        SET nome = :nome,
            email = :email,
            senha = :senha,
            funcao = :funcao,
            dtNascimento = :dtNascimento,
            telefone = :telefone,
            dataCadastro = :dataCadastro,
            ativo = :ativo
        WHERE idUsuario = :idUsuario;
    """)
    int update(@BindBean Usuario usuario);

    @SqlUpdate("DELETE FROM Usuario WHERE idUsuario = :id;")
    int delete(@Bind("id") Long id);

    @SqlUpdate("UPDATE Usuario SET ativo = :ativo WHERE idUsuario = :id;")
    int updateAtivo(@Bind("id") Long id, @Bind("ativo") Boolean ativo);
}