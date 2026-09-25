package com.discoverindia.backend.service;

import com.discoverindia.backend.dto.response.MultiItineraryResponse;
import com.discoverindia.backend.entity.SavedItinerary;
import com.discoverindia.backend.entity.User;
import com.discoverindia.backend.repository.SavedItineraryRepository;
import com.discoverindia.backend.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ItineraryService {

    private final SavedItineraryRepository itineraryRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ── Save ─────────────────────────────────────────────────────────────────

    public SavedItinerary save(String userEmail, MultiItineraryResponse response, Map<String, Object> meta) {
        User user = findUser(userEmail);

        String title = response.getTripSummary() != null
                ? response.getTripSummary().getTitle()
                : "My Trip";

        String startLocation = response.getTripSummary() != null
                ? (response.getTripSummary().getRoute().isEmpty()
                    ? "Unknown"
                    : response.getTripSummary().getRoute().get(0))
                : "Unknown";

        String destJson = serializeList(
                response.getTripSummary() != null ? response.getTripSummary().getRoute() : List.of()
        );

        String itineraryJson = serialize(response);

        SavedItinerary entity = SavedItinerary.builder()
                .user(user)
                .title(title)
                .startLocation(startLocation)
                .destinationsJson(destJson)
                .days(response.getTripSummary() != null ? response.getTripSummary().getTotalDays() : 0)
                .travelers(response.getTripSummary() != null ? response.getTripSummary().getTravelers() : 1)
                .budgetPerPerson(response.getTripSummary() != null ? response.getTripSummary().getBudgetPerPerson() : 0)
                .itineraryJson(itineraryJson)
                .build();

        return itineraryRepository.save(entity);
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<SavedItinerary> getMyTrips(String userEmail) {
        User user = findUser(userEmail);
        return itineraryRepository.findByUserOrderByCreatedAtDesc(user);
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    public SavedItinerary getById(Long id, String userEmail) {
        User user = findUser(userEmail);
        return itineraryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new RuntimeException("Itinerary not found"));
    }

    // ── Get public (by share token) ───────────────────────────────────────────

    public SavedItinerary getByShareToken(String token) {
        return itineraryRepository.findByShareToken(token)
                .filter(SavedItinerary::isPublic)
                .orElseThrow(() -> new RuntimeException("Shared itinerary not found"));
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public SavedItinerary update(Long id, String userEmail, MultiItineraryResponse newData) {
        SavedItinerary existing = getById(id, userEmail);
        existing.setItineraryJson(serialize(newData));
        if (newData.getTripSummary() != null) {
            existing.setTitle(newData.getTripSummary().getTitle());
        }
        return itineraryRepository.save(existing);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public void delete(Long id, String userEmail) {
        SavedItinerary existing = getById(id, userEmail);
        itineraryRepository.delete(existing);
    }

    // ── Share ─────────────────────────────────────────────────────────────────

    public String share(Long id, String userEmail) {
        SavedItinerary existing = getById(id, userEmail);
        if (existing.getShareToken() == null) {
            existing.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        }
        existing.setPublic(true);
        itineraryRepository.save(existing);
        return existing.getShareToken();
    }

    // ── Parse stored JSON back to response object ─────────────────────────────

    public MultiItineraryResponse parseItinerary(String json) {
        try {
            return objectMapper.readValue(json, MultiItineraryResponse.class);
        } catch (Exception e) {
            log.error("Failed to parse stored itinerary JSON: {}", e.getMessage());
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private String serialize(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String serializeList(List<?> list) {
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception e) {
            return "[]";
        }
    }
}
