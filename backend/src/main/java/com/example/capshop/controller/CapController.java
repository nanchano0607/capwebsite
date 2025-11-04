package com.example.capshop.controller;

import java.util.ArrayList;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public void saveCap(@RequestBody java.util.Map<String, Object> requestData){
        System.out.println("받은 데이터: " + requestData);
        
        // Cap 기본 정보 생성
        Cap cap = new Cap();
        cap.setName((String) requestData.get("name"));
        cap.setPrice(Long.valueOf(requestData.get("price").toString()));
        cap.setColor((String) requestData.get("color"));
        cap.setDescription((String) requestData.get("description"));
        cap.setSizeInfo((String) requestData.get("sizeInfo"));
        cap.setMainImageUrl((String) requestData.get("mainImageUrl"));
        
        // size 리스트 처리
        @SuppressWarnings("unchecked")
        List<String> sizes = (List<String>) requestData.get("size");
        cap.setSize(sizes);
        
        // imageUrls 리스트 처리
        @SuppressWarnings("unchecked")
        List<String> imageUrls = (List<String>) requestData.get("imageUrls");
        cap.setImageUrls(imageUrls);
        
        // Cap 먼저 저장
        Cap savedCap = capService.save(cap);
        
        // sizeStocks 처리
        @SuppressWarnings("unchecked")
        java.util.Map<String, Object> sizeStocks = (java.util.Map<String, Object>) requestData.get("sizeStocks");
        if (sizeStocks != null && !sizeStocks.isEmpty()) {
            for (java.util.Map.Entry<String, Object> entry : sizeStocks.entrySet()) {
                String size = entry.getKey();
                Long stock = Long.valueOf(entry.getValue().toString());
                
                // 사이즈별 재고 저장
                capService.updateStockBySize(savedCap.getId(), size, stock);
                System.out.println("사이즈별 재고 저장: " + size + " = " + stock);
            }
        }
        
        System.out.println("상품 저장 완료: " + savedCap.getName());
    }
    @PostMapping("/delete/{id}")
    public void deleteCap(@PathVariable("id") Long id){
        capService.deleteById(id);   
        System.out.print("삭제완료");
    }
    @GetMapping("/{id}")
    public Cap capDetail(@PathVariable("id") Long id){
        return capService.findById(id);
    }
    @GetMapping("/findAll")
    public List<Cap> findAll(){
        return capService.findAll();
    }
    
    @GetMapping("/new")
    public List<Cap> findNewCaps(){
        return capService.findNewCaps();
    }
    
    @PostMapping("/setNew/{id}")
    public void setCapAsNew(@PathVariable("id") Long id){
        capService.setIsNew(id, true);
        System.out.println("상품 " + id + " NEW 설정 완료");
    }
    
    @PostMapping("/unsetNew/{id}")
    public void unsetCapAsNew(@PathVariable("id") Long id){
        capService.setIsNew(id, false);
        System.out.println("상품 " + id + " NEW 해제 완료");
    }
    
    @PostMapping("/updateStock/{id}")
    public void updateStock(@PathVariable("id") Long id, @RequestBody Long stock) {
        capService.updateStock(id, stock);
        System.out.println("상품 " + id + " 재고 변경: " + stock);
    }
    
    // 사이즈별 재고 업데이트
    @PostMapping("/updateStock/{id}/{size}")
    public void updateStockBySize(
            @PathVariable("id") Long id, 
            @PathVariable("size") String size, 
            @RequestBody Long stock) {
        capService.updateStockBySize(id, size, stock);
        System.out.println("상품 " + id + " 사이즈 " + size + " 재고 변경: " + stock);
    }
    
    // 특정 상품의 모든 사이즈별 재고 조회
    @GetMapping("/stocks/{id}")
    public java.util.Map<String, Long> getStocksByCapId(@PathVariable("id") Long id) {
        Cap cap = capService.findById(id);
        java.util.Map<String, Long> stockMap = new java.util.HashMap<>();
        
        if (cap != null && cap.getStocks() != null) {
            for (com.example.capshop.domain.CapStock stock : cap.getStocks()) {
                stockMap.put(stock.getSize(), stock.getStock());
            }
        }
        
        return stockMap;
    }
    
    @GetMapping("/getImages/{id}")
    public List<String> getImages(@PathVariable("id") Long id) {
        Cap cap = capService.findById(id);
        List<String> filenames = new ArrayList<>();
        if (cap.getMainImageUrl() != null) {
            filenames.add(cap.getMainImageUrl().substring(cap.getMainImageUrl().lastIndexOf("/") + 1));
        }
        if (cap.getImageUrls() != null) {
            for (String url : cap.getImageUrls()) {
                filenames.add(url.substring(url.lastIndexOf("/") + 1));
            }
        }
        return filenames;
    }

}
