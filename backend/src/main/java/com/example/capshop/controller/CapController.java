package com.example.capshop.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.capshop.domain.Cap;
import com.example.capshop.service.CapService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cap")
public class CapController {
    private final CapService capService;
    @PostMapping("/save")
    public void saveCap(@RequestBody Cap cap){
        capService.save(cap);
        //return "cap.getId()";
    }
    @PostMapping("/delete/{id}")
    public void deleteCap(@PathVariable("id") Long id){
        capService.deleteById(id);   
        System.out.print("삭제완료");
    }
    @GetMapping("/{id}")
    public Cap capDetail(@PathVariable("id") Long id){
        System.out.println("모자찾기" + id);
        return capService.findById(id);
    }
    @GetMapping("/findAll")
    public List<Cap> findAll(){
        return capService.findAll();
    }
    @PostMapping("/setMain")
    public ResponseEntity<?> setMainCap(@RequestParam Long id){
        capService.setMainCap(id);
        return ResponseEntity.ok().build();
    }
    

}
