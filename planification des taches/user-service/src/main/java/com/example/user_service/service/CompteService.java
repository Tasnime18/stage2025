package com.example.user_service.service;

import java.util.List;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.user_service.dto.CompteDTO;
import com.example.user_service.model.Compte;
import com.example.user_service.repository.CompteRepo;

@Service
public class CompteService {
    private final CompteRepo compteRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    public CompteService(CompteRepo compteRepo, BCryptPasswordEncoder passwordEncoder) {
        this.compteRepo = compteRepo;
        this.passwordEncoder = passwordEncoder;
    }

    public Compte addCompte(CompteDTO dto) {
        Compte compte = new Compte();
        compte.setNom(dto.getNom());
        compte.setPrenom(dto.getPrenom());
        compte.setMail(dto.getMail());
        compte.setMotdepasse(passwordEncoder.encode(dto.getMotdepasse()));
        compte.setRole(dto.getRole());

        return compteRepo.save(compte);
    }

    public List<Compte> getUsers() {
        return compteRepo.findAll();
    }

    public Compte getUserById(Long id) {
        return compteRepo.findById(id).orElse(null);
    }

    public Compte update(Long id, Compte compteDetails) {
        Compte compte = compteRepo.findById(id).orElse(null);
        if (compte == null) return null;

        compte.setNom(compteDetails.getNom());
        compte.setPrenom(compteDetails.getPrenom());
        compte.setMail(compteDetails.getMail());

        if (compteDetails.getMotdepasse() != null && !compteDetails.getMotdepasse().isBlank()) {
            compte.setMotdepasse(passwordEncoder.encode(compteDetails.getMotdepasse()));
        }

        return compteRepo.save(compte);
    }

    public void deleteUser(Long id) {
        compteRepo.deleteById(id);
    }

    public Compte findByMail(String mail) {
        return compteRepo.findByMail(mail).orElse(null);
    }
    public boolean setActifStatus(Long id, boolean status) {
    Compte compte = compteRepo.findById(id).orElse(null);
    if (compte == null) return false;

    compte.setActif(status);
    compteRepo.save(compte);
    return true;
}

}

