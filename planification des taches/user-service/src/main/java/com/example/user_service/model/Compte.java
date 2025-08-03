package com.example.user_service.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="comptes")
public class Compte {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String nom;
    private String prenom;
    private String mail;
    private String motdepasse;
    private String role;

    private boolean actif = true; 

    public Long getId() {
    return id;
}

public void setId(Long id) {
    this.id = id;
}

public String getNom() {
    return nom;
}

public void setNom(String nom) {
    this.nom = nom;
}

public String getPrenom() {
    return prenom;
}

public void setPrenom(String prenom) {
    this.prenom = prenom;
}

public String getMail() {
    return mail;
}

public void setMail(String mail) {
    this.mail = mail;
}
public String getMotdepasse() {
    return motdepasse;
}

public void setMotdepasse(String motdepasse) {
    this.motdepasse = motdepasse;
}
public String getRole() {
    return role;
}

public void setRole(String role) {
    this.role = role;
}
public boolean isActif() {
    return actif;
}

public void setActif(boolean actif) {
    this.actif = actif;
}




    
}
