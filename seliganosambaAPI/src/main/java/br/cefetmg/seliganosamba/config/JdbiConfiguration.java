package br.cefetmg.seliganosamba.config;

import java.time.temporal.ChronoUnit;

import javax.sql.DataSource;

import org.jdbi.v3.core.Jdbi;
import org.jdbi.v3.core.statement.SqlLogger;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.sqlobject.SqlObjectPlugin;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class JdbiConfiguration {

    @Value( "${jdbi.showsql}" )
    private boolean showsql;

    @Bean
    @ConfigurationProperties("spring.datasource")
    DataSource driverManagerDataSource() {
        return new DriverManagerDataSource();
    }

    @Bean
    DataSourceTransactionManager dataSourceTransactionManager(DataSource dataSource) {
        DataSourceTransactionManager dataSourceTransactionManager = new DataSourceTransactionManager();
        dataSourceTransactionManager.setDataSource(dataSource);
        return dataSourceTransactionManager;
    }

    @Bean
    Jdbi jdbi(DataSource dataSource) {
        Jdbi jdbiRet = Jdbi.create(dataSource)
                .installPlugin(new SqlObjectPlugin());

        if (showsql) {
            SqlLogger sqlLogger = new SqlLogger() {
                @Override
                public void logAfterExecution(StatementContext context) {
                    log.info("JDBI.SQL: \n {} \n PARAMETERS: {} \n TIME: {} ms",
                            context.getRenderedSql(),
                            context.getBinding().toString(),
                            context.getElapsedTime(ChronoUnit.MILLIS));
                }
            };
            jdbiRet.setSqlLogger(sqlLogger);
        }

        return jdbiRet;
    }
}
