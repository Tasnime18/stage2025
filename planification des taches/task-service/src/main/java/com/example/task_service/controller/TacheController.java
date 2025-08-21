package com.example.task_service.controller;

import com.example.task_service.dto.TacheDTO;
import com.example.task_service.mapper.TacheMapper;
import com.example.task_service.model.Tache;
import com.example.task_service.service.TacheService;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/taches")
public class TacheController {

    private final TacheService tacheService;

    public TacheController(TacheService tacheService) {
        this.tacheService = tacheService;
    }

@GetMapping
public ResponseEntity<List<TacheDTO>> getTaches(@RequestAttribute("role") String role,
                                                @RequestAttribute("userId") Long userId) {
    List<Tache> taches = tacheService.getAllTaches();

    List<TacheDTO> dtoList = taches.stream()
            .map(TacheMapper::toDTO)
            .collect(Collectors.toList());

    return ResponseEntity.ok(dtoList);
}
@GetMapping("/mes-taches")
public ResponseEntity<List<TacheDTO>> getMesTaches(@RequestAttribute("userId") Long userId) {
    List<Tache> taches = tacheService.getTachesByAgentId(userId);
    List<TacheDTO> dtoList = taches.stream().map(TacheMapper::toDTO).collect(Collectors.toList());
    return ResponseEntity.ok(dtoList);
}


    @GetMapping("/filtre")
    public List<Tache> getTachesFiltres(
            @RequestParam(required = false) Long agentId,
            @RequestParam(required = false) String priorite,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end
    ) {
        return tacheService.rechercherTaches(agentId, priorite, start, end);
    }


    @PostMapping
    public ResponseEntity<TacheDTO> create(@RequestBody TacheDTO tacheDTO,
                                           @RequestAttribute("role") String role,
                                           @RequestAttribute("userId") Long userId) {
        if (!role.equals("ADMIN")) {
            tacheDTO.setAgentId(userId);
        }
        Tache tache = TacheMapper.toEntity(tacheDTO);
        Tache saved = tacheService.createTache(tache);
        return ResponseEntity.ok(TacheMapper.toDTO(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                     @RequestBody TacheDTO tacheDTO,
                                     @RequestAttribute("role") String role,
                                     @RequestAttribute("userId") Long userId) {
        return tacheService.getTacheById(id).map(tache -> {
            if (!role.equals("ADMIN") && !tache.getAgentId().equals(userId)) {
                return ResponseEntity.status(403).body("Accès refusé");
            }

            Tache toUpdate = TacheMapper.toEntity(tacheDTO);
            toUpdate.setId(id);
            toUpdate.setAgentId(tache.getAgentId());
            Tache updated = tacheService.updateTache(toUpdate);
            return ResponseEntity.ok(TacheMapper.toDTO(updated));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id,
                                    @RequestAttribute("role") String role,
                                    @RequestAttribute("userId") Long userId) {
        return tacheService.getTacheById(id).map(tache -> {
            if (!role.equals("ADMIN") && !tache.getAgentId().equals(userId)) {
                return ResponseEntity.status(403).body("Accès refusé");
            }
            tacheService.deleteTache(id);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
