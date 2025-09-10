package com.example.capshop.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.capshop.domain.User;
import com.example.capshop.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {
    private final UserService userService;
    
    @PostMapping("/save")
    public void saveUser(@RequestBody User user){
        userService.save(user);
    }
    @GetMapping("/all")
    public List<User> allUser(){
        return userService.findAll();

    }
    
}
