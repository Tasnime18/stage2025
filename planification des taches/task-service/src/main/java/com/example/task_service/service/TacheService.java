package com.example.task_service.service;

import com.example.task_service.model.Tache;
import com.example.task_service.repository.TacheRepo;
import com.example.task_service.specification.TacheSpecification;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TacheService {

    private final TacheRepo tacheRepository;

    public TacheService(TacheRepo tacheRepository) {
        this.tacheRepository = tacheRepository;
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
    public List<Tache> rechercherTaches(Long agentId, String priorite, LocalDateTime start, LocalDateTime end) {
        return tacheRepository.findAll(TacheSpecification.filtre(agentId, priorite, start, end));
    }
}
