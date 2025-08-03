package com.example.task_service.specification;

import com.example.task_service.model.Tache;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class TacheSpecification {

    public static Specification<Tache> filtre(Long agentId, String priorite, LocalDateTime start, LocalDateTime end) {
        return (root, query, cb) -> {
            var predicate = cb.conjunction();

            if (agentId != null) {
                predicate = cb.and(predicate, cb.equal(root.get("agentId"), agentId));
            }
            if (priorite != null) {
                predicate = cb.and(predicate, cb.equal(root.get("priorite"), priorite));
            }
            if (start != null) {
                predicate = cb.and(predicate, cb.greaterThanOrEqualTo(root.get("dateDebut"), start));
            }
            if (end != null) {
                predicate = cb.and(predicate, cb.lessThanOrEqualTo(root.get("dateDebut"), end));
            }
            return predicate;
        };
    }
}
