package com.example.task_service.service;

import com.example.task_service.dto.CompteDTO;
import com.example.task_service.dto.TacheDTO;
import com.example.task_service.mapper.TacheMapper;
import com.example.task_service.model.ParametrageCouleur;
import com.example.task_service.model.Tache;
import com.example.task_service.repository.ParametrageColorRepository;
import com.example.task_service.repository.TacheRepo;

import jakarta.persistence.criteria.Predicate;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TacheService {

    private final TacheRepo tacheRepository;
    private final ParametrageColorRepository paramColorRepo;
    private final RestTemplate restTemplate;

    private final String USER_SERVICE_URL = "http://localhost:8082/users";

    public TacheService(TacheRepo tacheRepository, ParametrageColorRepository paramColorRepo, RestTemplate restTemplate) {
        this.tacheRepository = tacheRepository;
        this.paramColorRepo = paramColorRepo;
        this.restTemplate = restTemplate;
    }

    public Tache createTache(Tache tache) {
        if (tache.getEtat() == null || tache.getEtat().isEmpty()) {
            tache.setEtat("A faire");
    }
        return tacheRepository.save(tache);
    }

    public List<Tache> getAllTaches() {
        return tacheRepository.findAll();
    }

    public List<Tache> getTachesByAgentId(Long agentId) {
        return tacheRepository.findByAgentId(agentId);
    }

    public Optional<Tache> getTacheById(Long id) {
        return tacheRepository.findById(id);
    }

    public void deleteTache(Long id) {
        tacheRepository.deleteById(id);
    }

    public Tache updateTache(Tache tache) {
        return tacheRepository.save(tache);
    }
    public List<Tache> rechercherTaches(Long agentId, String priorite, LocalDateTime start, LocalDateTime end, Long serviceId) {
    List<Long> finalAgentIds = serviceId != null ? getAgentIdsByServiceId(serviceId) : null;

    return tacheRepository.findAll((root, query, cb) -> {
        List<Predicate> predicates = new ArrayList<>();

        if (agentId != null) {
            predicates.add(cb.equal(root.get("agentId"), agentId));
        } else if (finalAgentIds != null && !finalAgentIds.isEmpty()) {
            predicates.add(root.get("agentId").in(finalAgentIds));
        }

        if (priorite != null && !priorite.trim().isEmpty()) {
            predicates.add(
                cb.equal(
                    cb.upper(root.get("priorite")),
                    cb.upper(cb.literal(priorite.trim()))
                )
            );
        }

        if (start != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("dateDebut"), start));
        }
        if (end != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("dateDebut"), end));
        }

        return cb.and(predicates.toArray(new Predicate[0]));
    });
}
private List<Long> getAgentIdsByServiceId(Long serviceId) {
    try {
        String url = "http://localhost:8082/users/by-service/" + serviceId;
        ResponseEntity<List<CompteDTO>> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            null,
            new ParameterizedTypeReference<List<CompteDTO>>() {}
        );
        List<CompteDTO> agents = response.getBody();
        if (agents != null && !agents.isEmpty()) {
            return agents.stream()
                         .map(CompteDTO::getId)
                         .collect(Collectors.toList());
        }
    } catch (Exception e) {
        System.err.println("Erreur appel user-service : " + e.getMessage());
    }
    return List.of();
}

//parametrage couleur

    public TacheDTO toDTOWithColor(Tache tache) {
    TacheDTO dto = TacheMapper.toDTO(tache);

    LocalDateTime now = LocalDateTime.now();
    LocalDateTime dateFin = tache.getDateDebut().plusHours(tache.getDureeEnHeures());
    boolean estEnRetard = !"Terminée".equalsIgnoreCase(tache.getEtat()) && dateFin.isBefore(now);

    String etatPourCouleur = estEnRetard ? "En retard" : tache.getEtat();
    ParametrageCouleur param = paramColorRepo.findByEtatIgnoreCase(etatPourCouleur).orElse(null);

    if (param != null) {
        dto.setCodeColor(param.getCodeColor());
        dto.setConteneur(param.isConteneur());
    } else {
        dto.setCodeColor("#CCCCCC");
        dto.setConteneur(false);
    }

    if ("HAUTE".equalsIgnoreCase(tache.getPriorite())) {
        ParametrageCouleur paramCadre = paramColorRepo.findByEtatIgnoreCase("prioritaire").orElse(null);
        if (paramCadre != null) {
            dto.setCadre(true);
        } else {
            dto.setCadre(false);
        }
    } else {
        dto.setCadre(false);
    }
    dto.setEtat(tache.getEtat());

    return dto;
}
    public List<Tache> getTachesByServiceId(Long serviceId) {
        String url = USER_SERVICE_URL + "/by-service/" + serviceId;
        ResponseEntity<List<CompteDTO>> response;

        try {
            response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<CompteDTO>>() {}
            );
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de la récupération des agents du service ID " + serviceId, e);
        }

        List<CompteDTO> agents = response.getBody();
        if (agents == null || agents.isEmpty()) {
            return List.of();
        }

        List<Long> agentIds = agents.stream()
                                    .map(CompteDTO::getId)
                                    .collect(Collectors.toList());

        return tacheRepository.findByAgentIdIn(agentIds);
    }

    
}