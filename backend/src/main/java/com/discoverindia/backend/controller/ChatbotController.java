package com.discoverindia.backend.controller;

import com.discoverindia.backend.dto.request.ChatRequest;
import com.discoverindia.backend.dto.request.ItineraryRequest;
import com.discoverindia.backend.dto.request.MultiItineraryRequest;
import com.discoverindia.backend.dto.response.ChatResponse;
import com.discoverindia.backend.dto.response.MultiItineraryResponse;
import com.discoverindia.backend.service.AiChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatbotController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiChatService.chat(request));
    }

    @PostMapping("/itinerary")
    public ResponseEntity<ChatResponse> generateItinerary(@Valid @RequestBody ItineraryRequest request) {
        return ResponseEntity.ok(aiChatService.generateItinerary(request));
    }

    @PostMapping("/multi-itinerary")
    public ResponseEntity<MultiItineraryResponse> generateMultiItinerary(
            @Valid @RequestBody MultiItineraryRequest request) {
        return ResponseEntity.ok(aiChatService.generateMultiPointItinerary(request));
    }
}
