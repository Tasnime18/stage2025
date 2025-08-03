package com.example.user_service.dto;

public class CompteDTO {
    private String nom;
    private String prenom;
    private String mail;
    private String motdepasse; 
    private String role;

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


    
}
