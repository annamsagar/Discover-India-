package com.discoverindia.backend.service;

import com.discoverindia.backend.dto.request.ChatRequest;
import com.discoverindia.backend.dto.request.ItineraryRequest;
import com.discoverindia.backend.dto.request.MultiItineraryRequest;
import com.discoverindia.backend.dto.response.ChatResponse;
import com.discoverindia.backend.dto.response.MultiItineraryResponse;
import com.discoverindia.backend.dto.response.MultiItineraryResponse.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class AiChatService {

    private final RouteOptimizationService routeOptimizationService;
    private final BudgetService budgetService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final WebClient webClient;
    private final String apiKey;
    private final String provider;

    private static final String SYSTEM_PROMPT = """
        You are "India Guide", an expert AI tourism assistant for the "Discover India" platform.
        Your role is to help travellers explore India. You provide:
        - Destination recommendations across India's 28 states and 8 union territories
        - Travel tips, best times to visit, local cuisine suggestions
        - Cultural and historical context about Indian monuments and heritage sites
        - Safety and practical travel advice
        - Budget planning guidance
        
        Always be warm, enthusiastic, and knowledgeable. Keep responses concise (2–4 paragraphs max).
        Format recommendations as clear bullet points when listing multiple items.
        Always mention if an activity requires a permit or advance booking.
        """;

    public AiChatService(
            @Value("${ai.api-key:}") String apiKey,
            @Value("${ai.provider:gemini}") String provider,
            RouteOptimizationService routeOptimizationService,
            BudgetService budgetService) {
        this.apiKey = apiKey;
        this.provider = provider;
        this.webClient = WebClient.builder().build();
        this.routeOptimizationService = routeOptimizationService;
        this.budgetService = budgetService;
    }

    public ChatResponse chat(ChatRequest request) {
        String responseText;
        try {
            if (apiKey == null || apiKey.isBlank()) {
                responseText = getFallbackResponse(request.getMessage());
            } else if ("gemini".equalsIgnoreCase(provider)) {
                responseText = callGemini(request.getMessage(), request.getHistory());
            } else if ("groq".equalsIgnoreCase(provider)) {
                responseText = callGroq(request.getMessage(), request.getHistory());
            } else {
                responseText = getFallbackResponse(request.getMessage());
            }
        } catch (Exception e) {
            log.error("AI chat error: {}", e.getMessage());
            responseText = getFallbackResponse(request.getMessage());
        }

        return ChatResponse.builder()
                .message(responseText)
                .conversationId(request.getConversationId() != null
                        ? request.getConversationId()
                        : UUID.randomUUID().toString())
                .timestamp(Instant.now().toEpochMilli())
                .build();
    }

    public ChatResponse generateItinerary(ItineraryRequest request) {
        String prompt = buildItineraryPrompt(request);
        ChatRequest chatRequest = new ChatRequest();
        chatRequest.setMessage(prompt);
        chatRequest.setConversationId(UUID.randomUUID().toString());
        return chat(chatRequest);
    }

    // ── Multi-Point Itinerary ─────────────────────────────────────────────────

    public MultiItineraryResponse generateMultiPointItinerary(MultiItineraryRequest request) {
        try {
            // 1. Route optimization
            RouteOptimizationService.OptimizedRoute route = routeOptimizationService.optimize(
                    request.getStartLocation(),
                    request.getDestinations(),
                    request.getDays(),
                    request.getPace()
            );

            // 2. Budget estimation (includes per-category explanations)
            BudgetBreakdown budget = budgetService.estimate(request, route.totalDistanceKm(), request.getDays());

            // 3. Build AI prompt with pre-computed route data
            String prompt = buildMultiPointPrompt(request, route);

            // 4. Call AI
            String aiJson = callAiRaw(prompt);

            // 5. Parse AI response
            MultiItineraryResponse response = parseMultiItineraryResponse(aiJson, request, route, budget);

            // 6. Inject server-side budget explanations into aiReasoning
            //    (BudgetService produces richer, deterministic explanations than AI)
            if (response.getAiReasoning() != null && budget.getExplanations() != null) {
                response.getAiReasoning().setBudgetExplanations(budget.getExplanations());
            }
            return response;

        } catch (Exception e) {
            log.error("Multi-point itinerary generation error: {}", e.getMessage(), e);
            return buildFallbackMultiItinerary(request);
        }
    }

    private String callAiRaw(String prompt) {
        try {
            if (apiKey == null || apiKey.isBlank()) return "{}";
            if ("gemini".equalsIgnoreCase(provider)) return callGemini(prompt, null);
            if ("groq".equalsIgnoreCase(provider))   return callGroqLarge(prompt);
        } catch (Exception e) {
            log.error("AI call failed: {}", e.getMessage());
        }
        return "{}";
    }

    /** Uses llama3-70b-8192 for larger context window needed by detailed itineraries */
    private String callGroqLarge(String userMessage) {
        String url = "https://api.groq.com/openai/v1/chat/completions";
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = Map.of(
                "model", "llama3-70b-8192",
                "messages", messages,
                "temperature", 0.7,
                "max_tokens", 4096
        );

        Map<?, ?> response = webClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("choices")) {
            List<?> choices = (List<?>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                Map<?, ?> message = (Map<?, ?>) choice.get("message");
                if (message != null) return (String) message.get("content");
            }
        }
        return "{}";
    }

    private String buildMultiPointPrompt(MultiItineraryRequest req, RouteOptimizationService.OptimizedRoute route) {
        List<String> routeNames = route.orderedPoints().stream()
                .map(RouteOptimizationService.GeoPoint::name)
                .toList();
        String routeStr = String.join(" → ", routeNames);

        StringBuilder dayAlloc = new StringBuilder();
        route.dayAllocation().forEach((dest, days) ->
                dayAlloc.append("  - ").append(dest).append(": ").append(days).append(" day(s)\n")
        );

        StringBuilder coordsHint = new StringBuilder();
        route.orderedPoints().forEach(pt ->
                coordsHint.append(String.format("  %s: lat=%.4f, lng=%.4f%n", pt.name(), pt.lat(), pt.lng()))
        );

        String startDate = req.getStartDate() != null ? req.getStartDate() : LocalDate.now().plusDays(7).toString();
        String interests = req.getInterests() != null ? String.join(", ", req.getInterests()) : "general sightseeing";

        return String.format("""
                You are an expert India travel planner with deep knowledge of routes, costs, and experiences.
                Your task has TWO parts:
                  PART A — THINK: Reason through every decision (route order, activity selection, budget allocation).
                  PART B — ACT:  Output the final itinerary JSON embedding your reasoning.

                TRIP DETAILS:
                - Starting point: %s
                - Pre-optimized route: %s (ordered by Nearest-Neighbour TSP on Haversine distances)
                - Total route distance: ~%.0f km
                - Start date: %s
                - Duration: %d days
                - Travelers: %d (%s)
                - Budget: \u20b9%,d per person
                - Interests: %s
                - Transport: %s
                - Pace: %s
                - Hotel preference: %s
                - Food preference: %s
                %s

                PRE-COMPUTED DAY ALLOCATION:
                %s

                COORDINATES (use these exact values in mapLocations):
                %s

                SCHEDULING RULES:
                1. Follow the optimized route order exactly.
                2. Respect the day allocation per destination.
                3. Include realistic timing (morning 7-12, afternoon 12-17, evening 17-22).
                4. Include meal breaks with local restaurant suggestions.
                5. Include travel time between cities on transit days.
                6. Group geographically close attractions on the same day.
                7. Do not schedule more than 4 major sightseeing spots per day.
                8. Include accommodation check-in/check-out on travel days.
                9. Estimate realistic per-day costs in \u20b9.
                10. If interests include beaches, prioritize beach activities. If history, prioritize monuments.

                REASONING RULES:
                - routeChoiceSummary: one sentence explaining why this route order saves time/distance.
                - routeDecisions: for each A→B leg explain WHY this order is better than reverse.
                - budgetStrategy: overall philosophy for budget allocation given user's preferences.
                - budgetExplanations: (just pass empty list [], budget service handles these server-side)
                - alternativesConsidered: 2–3 route or activity alternatives you rejected and why.
                - timingAdvice: best season/time tips specific to the destinations in this trip.
                - optimisationInsight: one key efficiency insight about this particular trip.
                - For each day include dayReasoning: why these specific activities on this day.
                - For each activity include costReason: why this cost (entry fee source, meal type).
                - For each activity include tip: one practical tip (booking, timing, discount).
                - For each travel block include modeReason: why this mode for this specific leg.
                - For each accommodation include locationReason: why this area is best to stay in.

                RETURN ONLY a valid JSON object with this EXACT structure (no markdown, no extra text):
                {
                  "tripTitle": "string",
                  "aiReasoning": {
                    "routeChoiceSummary": "string",
                    "routeDecisions": [
                      { "from": "City A", "to": "City B", "distanceKm": 250, "transportMode": "train", "reasoning": "string", "timeSaved": "string" }
                    ],
                    "budgetStrategy": "string",
                    "budgetExplanations": [],
                    "alternativesConsidered": [
                      { "description": "string", "rejectedBecause": "string" }
                    ],
                    "timingAdvice": "string",
                    "optimisationInsight": "string"
                  },
                  "days": [
                    {
                      "day": 1,
                      "date": "YYYY-MM-DD",
                      "location": "City Name",
                      "theme": "short theme string",
                      "dayReasoning": "Why these activities were chosen for today",
                      "morning": [
                        { "time": "07:00 AM", "name": "Activity Name", "description": "desc", "duration": "1.5 hours", "estimatedCost": 200, "type": "activity", "costReason": "ASI entry fee for Indian nationals", "tip": "Book tickets online to skip queues" }
                      ],
                      "afternoon": [
                        { "time": "12:30 PM", "name": "Lunch at XYZ", "description": "desc", "duration": "1 hour", "estimatedCost": 300, "type": "meal", "costReason": "Local thali restaurant, avg price", "tip": "Try the local specialty" }
                      ],
                      "evening": [
                        { "time": "07:00 PM", "name": "Dinner at ABC", "description": "desc", "duration": "1 hour", "estimatedCost": 400, "type": "meal", "costReason": "Mid-range restaurant", "tip": "Reserve a table on weekends" }
                      ],
                      "travel": { "from": "City A", "to": "City B", "distanceKm": 300, "estimatedTime": "5 hours", "mode": "train", "estimatedCost": 800, "modeReason": "Train is 3x cheaper than car for this 300 km leg and overnight journey saves a hotel night" },
                      "accommodation": { "area": "Area Name", "type": "Standard Hotel", "checkIn": "02:00 PM", "checkOut": "11:00 AM", "estimatedCostPerNight": 2000, "locationReason": "Central location within walking distance of main attractions" },
                      "estimatedCost": 4500
                    }
                  ],
                  "mapLocations": [
                    { "name": "Location", "lat": 15.3350, "lng": 76.4600, "description": "desc", "type": "destination", "dayNumber": 1 }
                  ]
                }
                """,
                req.getStartLocation(),
                routeStr,
                route.totalDistanceKm(),
                startDate,
                req.getDays(),
                req.getTravelers(),
                req.getTravelType(),
                req.getBudgetPerPerson(),
                interests,
                req.getTransport(),
                req.getPace(),
                req.getHotelPreference(),
                req.getFoodPreference(),
                req.getAdditionalRequirements() != null ? "Additional: " + req.getAdditionalRequirements() : "",
                dayAlloc,
                coordsHint
        );
    }

    @SuppressWarnings("unchecked")
    private MultiItineraryResponse parseMultiItineraryResponse(
            String aiJson,
            MultiItineraryRequest req,
            RouteOptimizationService.OptimizedRoute route,
            BudgetBreakdown budget
    ) {
        try {
            String cleaned = aiJson.replaceAll("```json|```", "").trim();
            Map<String, Object> parsed = objectMapper.readValue(cleaned, Map.class);

            // Parse days
            List<Map<String, Object>> rawDays = (List<Map<String, Object>>) parsed.getOrDefault("days", List.of());
            List<DayPlan> days = rawDays.stream().map(this::parseDayPlan).toList();

            // Parse map locations — merge AI locations with route optimization coords
            List<Map<String, Object>> rawLocs = (List<Map<String, Object>>) parsed.getOrDefault("mapLocations", List.of());
            List<MapLocation> mapLocations = new ArrayList<>();
            if (!route.orderedPoints().isEmpty()) {
                RouteOptimizationService.GeoPoint start = route.orderedPoints().get(0);
                mapLocations.add(MapLocation.builder()
                        .name(start.name()).lat(start.lat()).lng(start.lng())
                        .description("Starting point").type("start").dayNumber(0).build());
            }
            for (Map<String, Object> loc : rawLocs) {
                mapLocations.add(MapLocation.builder()
                        .name(str(loc, "name"))
                        .lat(num(loc, "lat"))
                        .lng(num(loc, "lng"))
                        .description(str(loc, "description"))
                        .type(str(loc, "type", "destination"))
                        .dayNumber(intVal(loc, "dayNumber"))
                        .build());
            }

            // ── Parse aiReasoning block ──────────────────────────────────────
            AiReasoning aiReasoning = parseAiReasoning(
                    (Map<String, Object>) parsed.get("aiReasoning"),
                    route,
                    budget,
                    req
            );

            // Build trip summary
            List<String> routeNames = route.orderedPoints().stream()
                    .map(RouteOptimizationService.GeoPoint::name).toList();
            String title = (String) parsed.getOrDefault("tripTitle",
                    req.getStartLocation() + " → " + String.join(" → ", req.getDestinations()));

            TripSummary summary = TripSummary.builder()
                    .title(title)
                    .route(routeNames)
                    .totalDays(req.getDays())
                    .totalDistanceKm(route.totalDistanceKm())
                    .totalEstimatedCost(budget.getTotal())
                    .budgetPerPerson(req.getBudgetPerPerson())
                    .travelers(req.getTravelers())
                    .startDate(req.getStartDate())
                    .transport(req.getTransport())
                    .pace(req.getPace())
                    .build();

            List<String> warnings = new ArrayList<>();
            if (budget.isOverBudget()) {
                warnings.add(String.format(
                        "Your estimated trip cost is \u20b9%,d, which exceeds your \u20b9%,d budget by \u20b9%,d.",
                        budget.getTotal(), budget.getBudget(), budget.getTotal() - budget.getBudget()));
            }

            return MultiItineraryResponse.builder()
                    .tripSummary(summary)
                    .days(days)
                    .budgetBreakdown(budget)
                    .mapLocations(mapLocations)
                    .warnings(warnings)
                    .aiReasoning(aiReasoning)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse multi-itinerary AI response: {}", e.getMessage());
            return buildFallbackMultiItinerary(req);
        }
    }

    /** Builds the AiReasoning object from the parsed JSON block,
     *  supplementing with server-side budget explanations from BudgetService. */
    @SuppressWarnings("unchecked")
    private AiReasoning parseAiReasoning(
            Map<String, Object> raw,
            RouteOptimizationService.OptimizedRoute route,
            BudgetBreakdown budget,
            MultiItineraryRequest req
    ) {
        if (raw == null) raw = new HashMap<>();

        // Route decisions — try to get from AI, fallback to server-generated
        List<RouteDecision> routeDecisions = new ArrayList<>();
        List<?> rawDecisions = (List<?>) raw.get("routeDecisions");
        if (rawDecisions != null) {
            for (Object o : rawDecisions) {
                if (o instanceof Map<?, ?> m) {
                    routeDecisions.add(RouteDecision.builder()
                            .from(str(m, "from"))
                            .to(str(m, "to"))
                            .distanceKm(num(m, "distanceKm"))
                            .transportMode(str(m, "transportMode", req.getTransport()))
                            .reasoning(str(m, "reasoning"))
                            .timeSaved(str(m, "timeSaved"))
                            .build());
                }
            }
        }
        // Supplement with computed route legs if AI didn't fill all
        if (routeDecisions.isEmpty()) {
            List<RouteOptimizationService.GeoPoint> pts = route.orderedPoints();
            for (int i = 0; i < pts.size() - 1; i++) {
                double dist = haversineKm(pts.get(i), pts.get(i + 1));
                routeDecisions.add(RouteDecision.builder()
                        .from(pts.get(i).name())
                        .to(pts.get(i + 1).name())
                        .distanceKm(Math.round(dist))
                        .transportMode(req.getTransport())
                        .reasoning("Nearest-Neighbour algorithm selected this leg as it minimises " +
                                "the total route distance — reverse order would add approximately " +
                                Math.round(dist * 0.15) + " km of backtracking.")
                        .timeSaved("~" + Math.round(dist * 0.15 / 60) + " hrs vs reverse order")
                        .build());
            }
        }

        // Alternatives considered
        List<AlternativeOption> alternatives = new ArrayList<>();
        List<?> rawAlts = (List<?>) raw.get("alternativesConsidered");
        if (rawAlts != null) {
            for (Object o : rawAlts) {
                if (o instanceof Map<?, ?> m) {
                    alternatives.add(AlternativeOption.builder()
                            .description(str(m, "description"))
                            .rejectedBecause(str(m, "rejectedBecause"))
                            .build());
                }
            }
        }

        String routeSummary = str(raw, "routeChoiceSummary",
                "Route optimized using Nearest-Neighbour TSP over Haversine distances — " +
                "minimizes total travel km across " + route.orderedPoints().size() + " stops.");
        String budgetStrategy = str(raw, "budgetStrategy",
                "Budget allocated using midpoint estimates for " + req.getHotelPreference() +
                " hotel, " + req.getFoodPreference() + " food, and " + req.getTransport() +
                " transport. 8% contingency buffer included.");
        String timingAdvice   = str(raw, "timingAdvice", "");
        String optimisation   = str(raw, "optimisationInsight",
                "Total optimized distance: ~" + Math.round(route.totalDistanceKm()) +
                " km. An unoptimized (input order) route could add 15–40% more travel distance.");

        return AiReasoning.builder()
                .routeChoiceSummary(routeSummary)
                .routeDecisions(routeDecisions)
                .budgetStrategy(budgetStrategy)
                .budgetExplanations(List.of()) // populated server-side in BudgetService
                .alternativesConsidered(alternatives)
                .timingAdvice(timingAdvice)
                .optimisationInsight(optimisation)
                .build();
    }

    private double haversineKm(RouteOptimizationService.GeoPoint a, RouteOptimizationService.GeoPoint b) {
        final double R = 6371.0;
        double dLat = Math.toRadians(b.lat() - a.lat());
        double dLon = Math.toRadians(b.lng() - a.lng());
        double sinLat = Math.sin(dLat / 2);
        double sinLon = Math.sin(dLon / 2);
        double c = 2 * Math.asin(Math.sqrt(sinLat * sinLat
                + Math.cos(Math.toRadians(a.lat()))
                * Math.cos(Math.toRadians(b.lat()))
                * sinLon * sinLon));
        return R * c;
    }

    @SuppressWarnings("unchecked")
    private DayPlan parseDayPlan(Map<String, Object> raw) {
        return DayPlan.builder()
                .day(intVal(raw, "day"))
                .date(str(raw, "date"))
                .location(str(raw, "location"))
                .theme(str(raw, "theme"))
                .morning(parseActivities((List<Map<String, Object>>) raw.getOrDefault("morning", List.of())))
                .afternoon(parseActivities((List<Map<String, Object>>) raw.getOrDefault("afternoon", List.of())))
                .evening(parseActivities((List<Map<String, Object>>) raw.getOrDefault("evening", List.of())))
                .travel(parseTravel((Map<String, Object>) raw.get("travel")))
                .accommodation(parseAccommodation((Map<String, Object>) raw.get("accommodation")))
                .estimatedCost(longVal(raw, "estimatedCost"))
                .dayReasoning(str(raw, "dayReasoning"))
                .build();
    }

    private List<Activity> parseActivities(List<Map<String, Object>> raw) {
        if (raw == null) return List.of();
        return raw.stream().map(a -> Activity.builder()
                .time(str(a, "time"))
                .name(str(a, "name"))
                .description(str(a, "description"))
                .duration(str(a, "duration"))
                .estimatedCost(longVal(a, "estimatedCost"))
                .type(str(a, "type", "activity"))
                .costReason(str(a, "costReason"))
                .tip(str(a, "tip"))
                .build()).toList();
    }

    private Travel parseTravel(Map<String, Object> raw) {
        if (raw == null) return null;
        return Travel.builder()
                .from(str(raw, "from"))
                .to(str(raw, "to"))
                .distanceKm(num(raw, "distanceKm"))
                .estimatedTime(str(raw, "estimatedTime"))
                .mode(str(raw, "mode"))
                .estimatedCost(longVal(raw, "estimatedCost"))
                .modeReason(str(raw, "modeReason"))
                .build();
    }

    private Accommodation parseAccommodation(Map<String, Object> raw) {
        if (raw == null) return null;
        return Accommodation.builder()
                .area(str(raw, "area"))
                .type(str(raw, "type"))
                .checkIn(str(raw, "checkIn"))
                .checkOut(str(raw, "checkOut"))
                .estimatedCostPerNight(longVal(raw, "estimatedCostPerNight"))
                .locationReason(str(raw, "locationReason"))
                .build();
    }

    private MultiItineraryResponse buildFallbackMultiItinerary(MultiItineraryRequest req) {
        TripSummary summary = TripSummary.builder()
                .title(req.getStartLocation() + " → " + String.join(" → ", req.getDestinations()))
                .route(req.getDestinations())
                .totalDays(req.getDays())
                .totalDistanceKm(0)
                .totalEstimatedCost(req.getBudgetPerPerson())
                .budgetPerPerson(req.getBudgetPerPerson())
                .travelers(req.getTravelers())
                .build();
        return MultiItineraryResponse.builder()
                .tripSummary(summary)
                .days(List.of())
                .budgetBreakdown(BudgetBreakdown.builder().budget(req.getBudgetPerPerson()).build())
                .mapLocations(List.of())
                .warnings(List.of("AI generation failed. Please try again."))
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String str(Map<?, ?> m, String k) { return str(m, k, ""); }
    private String str(Map<?, ?> m, String k, String def) {
        Object v = m.get(k); return v != null ? v.toString() : def;
    }
    private double num(Map<?, ?> m, String k) {
        Object v = m.get(k);
        if (v == null) return 0;
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0; }
    }
    private int intVal(Map<?, ?> m, String k) { return (int) Math.round(num(m, k)); }
    private long longVal(Map<?, ?> m, String k) { return Math.round(num(m, k)); }

    private String callGemini(String userMessage, List<Map<String, String>> history) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey;

        String fullPrompt = SYSTEM_PROMPT + "\n\nUser: " + userMessage;

        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", fullPrompt))
                ))
        );

        Map<?, ?> response = webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("candidates")) {
            List<?> candidates = (List<?>) response.get("candidates");
            if (!candidates.isEmpty()) {
                Map<?, ?> candidate = (Map<?, ?>) candidates.get(0);
                Map<?, ?> content = (Map<?, ?>) candidate.get("content");
                if (content != null) {
                    List<?> parts = (List<?>) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        Map<?, ?> part = (Map<?, ?>) parts.get(0);
                        return (String) part.get("text");
                    }
                }
            }
        }
        return getFallbackResponse(null);
    }

    private String callGroq(String userMessage, List<Map<String, String>> history) {
        String url = "https://api.groq.com/openai/v1/chat/completions";

        java.util.List<Map<String, Object>> messages = new java.util.ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        if (history != null) {
            for (Map<String, String> msg : history) {
                messages.add(Map.of("role", msg.get("role"), "content", msg.get("content")));
            }
        }
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> body = Map.of(
                "model", "llama3-8b-8192",
                "messages", messages
        ); // Note: multi-point itinerary uses callGroqLarge() with 70b model

        Map<?, ?> response = webClient.post()
                .uri(url)
                .header("Authorization", "Bearer " + apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("choices")) {
            List<?> choices = (List<?>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<?, ?> choice = (Map<?, ?>) choices.get(0);
                Map<?, ?> message = (Map<?, ?>) choice.get("message");
                if (message != null && message.containsKey("content")) {
                    return (String) message.get("content");
                }
            }
        }
        return getFallbackResponse(null);
    }

    private String buildItineraryPrompt(ItineraryRequest req) {
        return String.format("""
                Create a detailed %d-day travel itinerary for the following Indian destinations: %s.
                Travel style: %s.
                %s
                
                You MUST return the response strictly as a JSON object with this exact format:
                {
                  "itinerary": [
                    {
                      "day": 1,
                      "title": "...",
                      "activities": ["morning activity", "afternoon activity"],
                      "tips": "..."
                    }
                  ],
                  "mapLocations": [
                    {
                      "name": "Location Name",
                      "lat": 12.345,
                      "lng": 76.543,
                      "description": "Brief desc"
                    }
                  ]
                }
                
                Return ONLY the JSON. No markdown backticks, no extra text.
                """,
                req.getDays() != null ? req.getDays() : 5,
                String.join(", ", req.getDestinationNames()),
                req.getTravelStyle() != null ? req.getTravelStyle() : "cultural",
                req.getStartCity() != null ? "Starting from: " + req.getStartCity() + "." : ""
        );
    }

    private String getFallbackResponse(String message) {
        if (message == null) return "I'm having trouble connecting right now. Please try again shortly.";

        String lower = message.toLowerCase();
        if (lower.contains("taj mahal") || lower.contains("agra")) {
            return """
                    🕌 **The Taj Mahal, Agra (Uttar Pradesh)**
                    
                    One of the Seven Wonders of the World, the Taj Mahal is best visited at **sunrise** for the most magical experience with fewer crowds.
                    
                    **Key tips:**
                    - Entry: ₹1,100 for foreigners, ₹50 for Indians
                    - Best time to visit: October–March
                    - Book tickets online at asi.payumoney.com to skip queues
                    - Also visit Agra Fort and Mehtab Bagh nearby
                    
                    The full Agra "Golden Triangle" circuit (Delhi → Agra → Jaipur) can be done in 3–4 days by train.
                    """;
        } else if (lower.contains("goa") || lower.contains("beach")) {
            return """
                    🏖️ **Goa — India's Beach Paradise**
                    
                    Goa offers everything from lively party beaches (Baga, Calangute) to serene shores (Palolem, Agonda).
                    
                    **Best areas:**
                    - North Goa: nightlife, water sports, flea markets
                    - South Goa: peaceful, cleaner beaches, luxury resorts
                    
                    **Tips:**
                    - Best season: November–February
                    - Rent a scooter (₹300–400/day) for independence
                    - Don't miss the Portuguese heritage in Panjim's Latin Quarter
                    - Try seafood at beach shacks — fish thali from ₹200!
                    """;
        } else if (lower.contains("kerala") || lower.contains("backwater")) {
            return """
                    🌴 **Kerala — God's Own Country**
                    
                    Kerala is famous for its backwaters, Ayurveda retreats, hill stations, and wildlife.
                    
                    **Must-visit:**
                    - Alleppey (Alappuzha): Houseboat cruise through backwaters
                    - Munnar: Tea plantations and misty hills
                    - Thekkady: Periyar Wildlife Sanctuary tiger safaris
                    - Varkala: Cliff-top beaches with a bohemian vibe
                    
                    **Best time:** September to March
                    A 7-day itinerary can cover Kochi → Munnar → Thekkady → Alleppey → Varkala beautifully.
                    """;
        } else if (lower.contains("ladakh") || lower.contains("leh")) {
            return """
                    🏔️ **Ladakh — The Last Shangri-La**
                    
                    Ladakh is a high-altitude desert with stunning landscapes, Buddhist culture, and adventure sports.
                    
                    **Must-see:**
                    - Pangong Lake: The iconic blue lake at 4,350m
                    - Nubra Valley: Sand dunes and Bactrian camels
                    - Magnetic Hill, Leh Palace, Thiksey Monastery
                    
                    **Important tips:**
                    - Best time: June–September only (roads closed in winter)
                    - Acclimatize for 2 days in Leh before trekking
                    - Inner Line Permit required for Pangong, Nubra, Tso Moriri
                    - Altitude sickness is real — stay hydrated, ascend slowly
                    """;
        } else if (lower.contains("rajasthan") || lower.contains("jaipur") || lower.contains("jodhpur")) {
            return """
                    🏰 **Rajasthan — The Land of Kings**
                    
                    Rajasthan is India's most colourful state, famous for its magnificent forts, palaces, and desert landscapes.
                    
                    **Golden Triangle + Rajasthan circuit:**
                    - Jaipur (Pink City): Amber Fort, Hawa Mahal, City Palace
                    - Jodhpur (Blue City): Mehrangarh Fort, Jaswant Thada
                    - Jaisalmer (Golden City): Desert safari, Patwon ki Haveli
                    - Udaipur (City of Lakes): Lake Pichola, City Palace
                    
                    **Best time:** October–March (summers are extreme at 45°C+)
                    """;
        } else {
            return """
                    🇮🇳 **Welcome to Discover India!**
                    
                    I'm your personal India travel guide. Ask me about any destination in India!
                    
                    **Popular topics I can help with:**
                    - 🗺️ Destination recommendations by state, budget, or interest
                    - 🗓️ Best time to visit specific places
                    - 🏨 Accommodation suggestions (budget to luxury)
                    - 🍛 Local cuisine and must-try dishes
                    - 🎒 Packing tips and safety advice
                    - 🚂 Transport options (trains, flights, buses)
                    
                    Try asking: *"Plan a 5-day trip to Kerala"* or *"What are the best beaches in Goa?"*
                    """;
        }
    }
}
