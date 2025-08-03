package com.example.user_service.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.user_service.model.Compte;

public interface CompteRepo extends JpaRepository<Compte, Long> {
    Optional<Compte> findByMail(String mail);

    
}
