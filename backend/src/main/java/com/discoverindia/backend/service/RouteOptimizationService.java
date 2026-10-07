package com.discoverindia.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * Handles destination geocoding (Nominatim) and route optimization
 * via a greedy Nearest Neighbour approach over OSRM distances.
 */
@Slf4j
@Service
public class RouteOptimizationService {

    private final WebClient webClient;

    public RouteOptimizationService() {
        this.webClient = WebClient.builder()
                .defaultHeader("User-Agent", "DiscoverIndia/1.0 (educational project)")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    public record GeoPoint(String name, double lat, double lng) {}

    public record OptimizedRoute(
            List<GeoPoint> orderedPoints,   // start + optimised destinations
            double totalDistanceKm,
            Map<String, Integer> dayAllocation  // destination name → days allocated
    ) {}

    /**
     * Given a starting location and a list of destination names, returns an
     * optimized travel route and per-destination day allocation.
     *
     * @param startLocation  e.g. "Hyderabad"
     * @param destinations   e.g. ["Hampi", "Goa", "Gokarna"]
     * @param totalDays      e.g. 7
     * @param pace           "relaxed" | "balanced" | "fast"
     */
    public OptimizedRoute optimize(String startLocation, List<String> destinations, int totalDays, String pace, Map<String, Map<String, Double>> selectedLocations) {
        // 1. Geocode all locations
        List<String> allLocations = new ArrayList<>();
        allLocations.add(startLocation);
        allLocations.addAll(destinations);

        List<GeoPoint> points = geocodeAll(allLocations, selectedLocations);

        if (points.isEmpty()) {
            return fallbackRoute(startLocation, destinations, totalDays, pace);
        }

        // 2. Build distance matrix using Haversine (reliable without rate limits)
        int n = points.size();
        double[][] distMatrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                distMatrix[i][j] = haversineKm(points.get(i), points.get(j));
            }
        }

        // 3. Nearest-Neighbour TSP starting from index 0 (start location)
        List<Integer> visitOrder = nearestNeighbour(distMatrix, 0, n);

        // 4. Build ordered GeoPoint list
        List<GeoPoint> orderedPoints = new ArrayList<>();
        for (int idx : visitOrder) {
            orderedPoints.add(points.get(idx));
        }

        // 5. Calculate total distance
        double totalDist = 0;
        for (int i = 0; i < orderedPoints.size() - 1; i++) {
            totalDist += haversineKm(orderedPoints.get(i), orderedPoints.get(i + 1));
        }

        // 6. Allocate days to each destination (skip start location at index 0)
        List<GeoPoint> destPoints = orderedPoints.subList(1, orderedPoints.size());
        Map<String, Integer> dayAllocation = allocateDays(destPoints, totalDays, pace);

        return new OptimizedRoute(orderedPoints, totalDist, dayAllocation);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Geocoding via Nominatim
    // ─────────────────────────────────────────────────────────────────────────

    private List<GeoPoint> geocodeAll(List<String> names, Map<String, Map<String, Double>> selectedLocations) {
        List<GeoPoint> result = new ArrayList<>();
        for (String name : names) {
            GeoPoint pt = null;
            if (selectedLocations != null && selectedLocations.containsKey(name)) {
                Map<String, Double> coords = selectedLocations.get(name);
                if (coords != null && coords.containsKey("lat") && coords.containsKey("lng")) {
                    pt = new GeoPoint(name, coords.get("lat"), coords.get("lng"));
                }
            }
            if (pt == null) {
                pt = geocode(name);
            }
            if (pt != null) {
                result.add(pt);
            } else {
                log.warn("Could not geocode: {}", name);
                // Add a null-island placeholder so indexing stays consistent
                result.add(new GeoPoint(name, 20.5937, 78.9629)); // centre of India as fallback
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private GeoPoint geocode(String name) {
        try {
            String url = "https://nominatim.openstreetmap.org/search?q="
                    + encodeUrl(name + ", India")
                    + "&format=json&limit=1&countrycodes=in";

            List<Map<String, Object>> response = webClient.get()
                    .uri(url)
                    .retrieve()
                    .bodyToMono(List.class)
                    .block();

            if (response != null && !response.isEmpty()) {
                Map<String, Object> first = response.get(0);
                double lat = Double.parseDouble(first.get("lat").toString());
                double lng = Double.parseDouble(first.get("lon").toString());
                return new GeoPoint(name, lat, lng);
            }
        } catch (Exception e) {
            log.warn("Geocode failed for '{}': {}", name, e.getMessage());
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Route algorithm
    // ─────────────────────────────────────────────────────────────────────────

    private List<Integer> nearestNeighbour(double[][] dist, int start, int n) {
        boolean[] visited = new boolean[n];
        List<Integer> path = new ArrayList<>();
        path.add(start);
        visited[start] = true;

        for (int step = 1; step < n; step++) {
            int last = path.get(path.size() - 1);
            int nearest = -1;
            double minDist = Double.MAX_VALUE;
            for (int j = 0; j < n; j++) {
                if (!visited[j] && dist[last][j] < minDist) {
                    minDist = dist[last][j];
                    nearest = j;
                }
            }
            if (nearest != -1) {
                path.add(nearest);
                visited[nearest] = true;
            }
        }
        return path;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Day allocation
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Allocates days proportionally. Travel days (between cities) cost 0.5 of a
     * "day unit" each, leaving the rest for sightseeing.
     */
    private Map<String, Integer> allocateDays(List<GeoPoint> destinations, int totalDays, String pace) {
        if (destinations.isEmpty()) return Collections.emptyMap();

        int n = destinations.size();
        // Reserve 1 travel day per leg (n legs: start→d1, d1→d2 ... dn-1→dn)
        int travelDays = Math.min(n, totalDays / 3);
        int sightseeingDays = Math.max(totalDays - travelDays, n);

        // Importance weights: first and last destination get slightly more days
        double[] weights = new double[n];
        for (int i = 0; i < n; i++) {
            weights[i] = 1.0;
            if (i == 0 || i == n - 1) weights[i] = 1.3;
        }

        double totalWeight = Arrays.stream(weights).sum();
        Map<String, Integer> allocation = new LinkedHashMap<>();
        int assigned = 0;

        for (int i = 0; i < n - 1; i++) {
            int days = Math.max(1, (int) Math.round(weights[i] / totalWeight * sightseeingDays));
            allocation.put(destinations.get(i).name(), days);
            assigned += days;
        }
        // Last destination gets remainder
        allocation.put(destinations.get(n - 1).name(), Math.max(1, totalDays - assigned));

        return allocation;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Haversine
    // ─────────────────────────────────────────────────────────────────────────

    private double haversineKm(GeoPoint a, GeoPoint b) {
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

    // ─────────────────────────────────────────────────────────────────────────
    // Fallback (no geocoding)
    // ─────────────────────────────────────────────────────────────────────────

    private OptimizedRoute fallbackRoute(String start, List<String> dests, int totalDays, String pace) {
        List<GeoPoint> pts = new ArrayList<>();
        pts.add(new GeoPoint(start, 20.5937, 78.9629));
        for (String d : dests) pts.add(new GeoPoint(d, 20.5937, 78.9629));
        Map<String, Integer> alloc = allocateDays(pts.subList(1, pts.size()), totalDays, pace);
        return new OptimizedRoute(pts, 0, alloc);
    }

    private String encodeUrl(String s) {
        return s.replace(" ", "+").replace(",", "%2C");
    }
}
