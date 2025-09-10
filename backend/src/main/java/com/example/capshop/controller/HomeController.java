package com.example.capshop.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;


@Controller
public class HomeController {
    @GetMapping("/")
    public String home() {
        // static 폴더의 index.html로 리다이렉트
        return "index";
    }
}

