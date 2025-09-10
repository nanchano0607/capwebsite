package com.example.capshop.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.capshop.domain.Cap;
import com.example.capshop.repository.CapRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class CapService {
    private final CapRepository capRepository;
    public Cap save(Cap cap){
        return capRepository.save(cap);
    }

    public List<Cap> findAll() {
        return capRepository.findAll();
    }

    public void deleteById(Long id) {
        capRepository.deleteById(id);
    }

    public List<Cap> findByName(String keyword) {
        return capRepository.findByNameContaining(keyword);
    }
    public Cap findById(Long id) {
    return capRepository.findById(id).orElse(null); // 없으면 null
    }

    public List<Cap> findMainCap(){
        return capRepository.findByIsMainCapTrue();
    }

    @Transactional
    public void setMainCap(Long id) {
        
        Cap cap = capRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 ID의 모자가 없습니다. id=" + id));

        cap.setMainCap(true);
    }
}


