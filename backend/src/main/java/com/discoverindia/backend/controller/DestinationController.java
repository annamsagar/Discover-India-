package com.discoverindia.backend.controller;

import com.discoverindia.backend.dto.request.DestinationRequest;
import com.discoverindia.backend.dto.response.DestinationResponse;
import com.discoverindia.backend.service.DestinationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    // ─── Public Endpoints ───────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<Page<DestinationResponse>> getAllDestinations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return ResponseEntity.ok(destinationService.getAllDestinations(PageRequest.of(page, size, sort)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DestinationResponse> getDestinationById(@PathVariable Long id) {
        return ResponseEntity.ok(destinationService.getDestinationById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<DestinationResponse>> searchDestinations(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(destinationService.searchDestinations(query, PageRequest.of(page, size)));
    }

    @GetMapping("/state/{state}")
    public ResponseEntity<Page<DestinationResponse>> getByState(
            @PathVariable String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(destinationService.getDestinationsByState(state, PageRequest.of(page, size)));
    }

    @GetMapping("/top-rated")
    public ResponseEntity<List<DestinationResponse>> getTopRated(
            @RequestParam(defaultValue = "6") int limit) {
        return ResponseEntity.ok(destinationService.getTopRatedDestinations(limit));
    }

    // ─── Admin-Only Endpoints ────────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_MANAGER')")
    public ResponseEntity<DestinationResponse> createDestination(
            @Valid @RequestBody DestinationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(destinationService.createDestination(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_MANAGER')")
    public ResponseEntity<DestinationResponse> updateDestination(
            @PathVariable Long id,
            @Valid @RequestBody DestinationRequest request) {
        return ResponseEntity.ok(destinationService.updateDestination(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteDestination(@PathVariable Long id) {
        destinationService.deleteDestination(id);
        return ResponseEntity.noContent().build();
    }
}
