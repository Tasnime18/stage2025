package com.example.authentification_service.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AdminController {
    @GetMapping("/admin/hello")
    public String helloAdmin(){
        return "welcom Admin";
    }
    @GetMapping("/user/hello")
    public String helloUser(){
        return "welcom user";
    }
    
}
