package com.discoverindia.backend.controller;

import com.discoverindia.backend.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return ResponseEntity.ok(Map.of(
                "id", userDetails.getId(),
                "name", userDetails.getName(),
                "email", userDetails.getUsername(),
                "role", userDetails.getAuthorities().iterator().next().getAuthority()
        ));
    }
}
