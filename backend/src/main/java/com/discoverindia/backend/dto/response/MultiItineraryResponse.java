package com.discoverindia.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MultiItineraryResponse {

    private TripSummary tripSummary;
    private List<DayPlan> days;
    private BudgetBreakdown budgetBreakdown;
    private List<MapLocation> mapLocations;
    private List<String> warnings;
    private String shareToken;
    private AiReasoning aiReasoning;

    // ── AI Reasoning (explainability) ─────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiReasoning {
        /** One-line summary of why this particular route was chosen */
        private String routeChoiceSummary;
        /** Per-leg reasoning: why leg A→B is ordered this way */
        private List<RouteDecision> routeDecisions;
        /** Overall budget strategy explanation */
        private String budgetStrategy;
        /** Per-category budget explanation */
        private List<BudgetExplanation> budgetExplanations;
        /** Top picks the AI rejected and why */
        private List<AlternativeOption> alternativesConsidered;
        /** Season/timing advice for this specific trip */
        private String timingAdvice;
        /** Key optimisation insight surfaced by AI */
        private String optimisationInsight;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RouteDecision {
        private String from;
        private String to;
        private double distanceKm;
        private String transportMode;
        /** Plain-English reason this leg comes before the next */
        private String reasoning;
        private String timeSaved; // e.g. "saves ~2 hours vs reverse order"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetExplanation {
        private String category;   // accommodation | transport | food | activities | misc
        private long estimatedCost;
        private String basis;      // e.g. "Standard hotel midpoint ₹2,250/night × 5 nights"
        private String whyThisAmount; // plain-English justification
        private long cheaperOption;   // what it would cost if user downgraded
        private String cheaperLabel;  // e.g. "Switch to budget hotel"
        private long premiumOption;
        private String premiumLabel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AlternativeOption {
        private String description; // what was considered
        private String rejectedBecause; // why it was dropped
    }

    // ── Trip Summary ──────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TripSummary {
        private String title;
        private List<String> route;
        private int totalDays;
        private double totalDistanceKm;
        private long totalEstimatedCost;
        private long budgetPerPerson;
        private int travelers;
        private String startDate;
        private String transport;
        private String pace;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DayPlan {
        private int day;
        private String date;
        private String location;
        private String theme;
        private List<Activity> morning;
        private List<Activity> afternoon;
        private List<Activity> evening;
        private Travel travel;
        private Accommodation accommodation;
        private long estimatedCost;
        /** Why these specific activities were chosen for this day */
        private String dayReasoning;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Activity {
        private String time;
        private String name;
        private String description;
        private String duration;
        private long estimatedCost;
        private String type; // activity | meal | transport | rest
        /** Why this cost — e.g. "Entry fee per Indian national" */
        private String costReason;
        /** Best practice tip for this activity */
        private String tip;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Travel {
        private String from;
        private String to;
        private double distanceKm;
        private String estimatedTime;
        private String mode;
        private long estimatedCost;
        /** Why this transport mode was chosen for this leg */
        private String modeReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Accommodation {
        private String area;
        private String type;
        private String checkIn;
        private String checkOut;
        private long estimatedCostPerNight;
        /** Why this area / hotel type is recommended */
        private String locationReason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BudgetBreakdown {
        private long accommodation;
        private long transport;
        private long food;
        private long activities;
        private long miscellaneous;
        private long total;
        private long budget;
        private long remaining;
        private boolean overBudget;
        private List<String> suggestions;
        /** Percentage of budget used (0–100+) */
        private int budgetUtilizationPct;
        /** Cheapest possible cost if all categories downgraded */
        private long minPossibleCost;
        /** Premium cost if all categories upgraded */
        private long maxPossibleCost;
        /** Per-category explanations — populated by BudgetService */
        private List<BudgetExplanation> explanations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MapLocation {
        private String name;
        private double lat;
        private double lng;
        private String description;
        private String type; // start | destination | attraction
        private int dayNumber;
    }
}
