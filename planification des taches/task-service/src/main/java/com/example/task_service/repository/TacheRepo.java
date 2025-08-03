package com.example.task_service.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.task_service.model.Tache;

public interface TacheRepo extends JpaRepository<Tache,Long>,JpaSpecificationExecutor<Tache> {
    List<Tache> findByAgentId(Long agentId);

   @Query("SELECT t FROM Tache t WHERE " +
            "(:agentId IS NULL OR t.agentId = :agentId) AND " +
            "(:priorite IS NULL OR t.priorite = :priorite) AND " +
            "(:start IS NULL OR t.dateDebut >= :start) AND " +
            "(:end IS NULL OR t.dateDebut <= :end)")
    List<Tache> findByFiltres(@Param("agentId") Long agentId,
                              @Param("priorite") String priorite,
                              @Param("start") LocalDateTime start,
                              @Param("end") LocalDateTime end);

}
