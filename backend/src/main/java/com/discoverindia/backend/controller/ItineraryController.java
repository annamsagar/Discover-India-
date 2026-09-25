package com.discoverindia.backend.controller;

import com.discoverindia.backend.dto.response.MultiItineraryResponse;
import com.discoverindia.backend.entity.SavedItinerary;
import com.discoverindia.backend.service.ItineraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/itinerary")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    /** Save a generated itinerary (auth required) */
    @PostMapping
    public ResponseEntity<SavedItinerary> saveItinerary(
            @RequestBody MultiItineraryResponse response,
            @AuthenticationPrincipal UserDetails userDetails) {
        SavedItinerary saved = itineraryService.save(userDetails.getUsername(), response, Map.of());
        return ResponseEntity.ok(saved);
    }

    /** Get all saved trips for the authenticated user */
    @GetMapping("/my-trips")
    public ResponseEntity<List<SavedItinerary>> getMyTrips(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(itineraryService.getMyTrips(userDetails.getUsername()));
    }

    /** Get a single saved itinerary (owner only) */
    @GetMapping("/{id}")
    public ResponseEntity<SavedItinerary> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(itineraryService.getById(id, userDetails.getUsername()));
    }

    /** Update an existing itinerary */
    @PutMapping("/{id}")
    public ResponseEntity<SavedItinerary> update(
            @PathVariable Long id,
            @RequestBody MultiItineraryResponse updated,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(itineraryService.update(id, userDetails.getUsername(), updated));
    }

    /** Delete an itinerary */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        itineraryService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    /** Generate and return a public share token */
    @PostMapping("/{id}/share")
    public ResponseEntity<Map<String, String>> share(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String token = itineraryService.share(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("shareToken", token));
    }

    /** Public endpoint — view a shared itinerary by token (no auth needed) */
    @GetMapping("/share/{token}")
    public ResponseEntity<SavedItinerary> getShared(@PathVariable String token) {
        return ResponseEntity.ok(itineraryService.getByShareToken(token));
    }
}
