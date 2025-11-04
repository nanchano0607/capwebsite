package com.example.capshop.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
public class ImageController {
    private String currentBackground = "mainvideo.mp4"; // 기본값
    private String logoImage = "homelogo.png"; // 로고 이미지 기본값

    @GetMapping("/logo")
    public Map<String, String> getLogoImage() {
        // 로고 이미지 URL 반환
        String url = "http://localhost:8080/images/" + logoImage;
        return Map.of("url", url);
    }

    @PostMapping("/api/logo")
    public Map<String, String> setLogoImage(@RequestParam("filename") String filename) {
        // 로고 이미지 파일명 설정
        this.logoImage = filename;
        String url = "http://localhost:8080/images/" + filename;
        return Map.of("url", url);
    }

    @GetMapping("/background")
    public Map<String, String> getBackgroundImage() {
        // 실제로는 DB나 파일에서 최신 파일명을 읽어오도록 구현 가능
        String url = "http://localhost:8080/images/" + currentBackground;
        return Map.of("url", url);
    }

    @PostMapping("/api/background")
    public Map<String, String> setBackgroundImage(@RequestParam("filename") String filename) {
        // 실제로는 DB에 저장하거나 파일에 기록하는 것이 더 안전함
        this.currentBackground = filename;
        String url = "http://localhost:8080/images/" + filename;
        return Map.of("url", url);
    }

    @GetMapping("/images/{filename}")
public ResponseEntity<Resource> getImage(@PathVariable("filename") String filename) throws MalformedURLException {
    Path imagePath = Paths.get("/Users/kimchanho/Desktop/project/capshopimage").resolve(filename);
    Resource resource = new UrlResource(imagePath.toUri());

    if (!resource.exists()) {
        return ResponseEntity.notFound().build();
    }

    // 파일 확장자에 따라 Content-Type 결정
    String contentType = "application/octet-stream"; // 기본값
    String fileName = filename.toLowerCase();
    
    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
        contentType = "image/jpeg";
    } else if (fileName.endsWith(".png")) {
        contentType = "image/png";
    } else if (fileName.endsWith(".gif")) {
        contentType = "image/gif";
    } else if (fileName.endsWith(".webp")) {
        contentType = "image/webp";
    }

    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, contentType)
            .body(resource);
}

    @PostMapping("/api/upload")
    public Map<String, String> upload(@RequestParam("file") MultipartFile file) throws IOException {
        String savePath = "/Users/kimchanho/Desktop/project/capshopimage/" + file.getOriginalFilename();
        file.transferTo(new File(savePath));

        String ext = "";
        int idx = file.getOriginalFilename().lastIndexOf('.');
        if (idx > 0) ext = file.getOriginalFilename().substring(idx + 1).toLowerCase();

        String url;
        if (ext.equals("mp4") || ext.equals("mov") || ext.equals("avi")) {
            url = "http://localhost:8080/videos/" + file.getOriginalFilename();
        } else {
            url = "http://localhost:8080/images/" + file.getOriginalFilename();
        }
        return Map.of("url", url);
    }

    @PostMapping("/api/cap/upload")
    public Map<String, Object> uploadCapImages(
            @RequestParam("mainImage") MultipartFile mainImage,
            @RequestParam("images") List<MultipartFile> images
    ) throws IOException {
        System.out.println("[uploadCapImages] mainImage = " + mainImage.getOriginalFilename());
        System.out.println("[uploadCapImages] images count = " + images.size());
        for (MultipartFile file : images) {
            System.out.println("[uploadCapImages] image file = " + file.getOriginalFilename());
        }

        String mainExt = "";
        int mainIdx = mainImage.getOriginalFilename().lastIndexOf('.');
        if (mainIdx > 0) mainExt = mainImage.getOriginalFilename().substring(mainIdx + 1).toLowerCase();

        String mainFilename = System.currentTimeMillis() + "_" + mainImage.getOriginalFilename();
        String mainSavePath = "/Users/kimchanho/Desktop/project/capshopimage/" + mainFilename;
        mainImage.transferTo(new File(mainSavePath));

        String mainUrl;
        if (mainExt.equals("mp4") || mainExt.equals("mov") || mainExt.equals("avi")) {
            mainUrl = "http://localhost:8080/videos/" + mainFilename;
        } else {
            mainUrl = "http://localhost:8080/images/" + mainFilename;
        }

        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile file : images) {
            String ext = "";
            int idx = file.getOriginalFilename().lastIndexOf('.');
            if (idx > 0) ext = file.getOriginalFilename().substring(idx + 1).toLowerCase();

            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            String savePath = "/Users/kimchanho/Desktop/project/capshopimage/" + filename;
            file.transferTo(new File(savePath));

            String url;
            if (ext.equals("mp4") || ext.equals("mov") || ext.equals("avi")) {
                url = "http://localhost:8080/videos/" + filename;
            } else {
                url = "http://localhost:8080/images/" + filename;
            }
            imageUrls.add(url);
        }

        System.out.println("[uploadCapImages] mainImageUrl = " + mainUrl);
        System.out.println("[uploadCapImages] imageUrls = " + imageUrls);

        return Map.of(
                "mainImageUrl", mainUrl,
                "imageUrls", imageUrls
        );
    }

    @GetMapping("/videos/{filename}")
    public ResponseEntity<Resource> getVideo(@PathVariable("filename") String filename) throws MalformedURLException {
        Path videoPath = Paths.get("/Users/kimchanho/Desktop/project/capshopimage").resolve(filename);
        Resource resource = new UrlResource(videoPath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, "video/mp4") // 필요시 확장자별로 변경
                .body(resource);
    }

    @PostMapping("/image/delete")
    public Map<String, Object> deleteImages(@RequestBody List<String> filenames) {
        List<String> success = new ArrayList<>();
        List<String> fail = new ArrayList<>();

        for (String filename : filenames) {
            String filePath = "/Users/kimchanho/Desktop/project/capshopimage/" + filename;
            File file = new File(filePath);

            if (file.exists() && file.delete()) {
                success.add(filename);
            } else {
                fail.add(filename);
            }
        }

        return Map.of(
                "success", success,
                "fail", fail
        );
    }
}
