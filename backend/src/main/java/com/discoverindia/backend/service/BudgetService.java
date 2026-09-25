package com.discoverindia.backend.service;

import com.discoverindia.backend.dto.request.MultiItineraryRequest;
import com.discoverindia.backend.dto.response.MultiItineraryResponse.BudgetBreakdown;
import com.discoverindia.backend.dto.response.MultiItineraryResponse.BudgetExplanation;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Deterministic budget estimation based on user preferences.
 * All costs are in Indian Rupees (₹) per person.
 * Each category now produces a BudgetExplanation so the UI can show
 * "why this amount" alongside cheaper / premium alternatives.
 */
@Service
public class BudgetService {

    // ── Daily cost ranges by hotel preference ─────────────────────────────────
    private static final Map<String, long[]> HOTEL_COST = Map.of(
            "budget",   new long[]{500,  1200},
            "standard", new long[]{1500, 3000},
            "luxury",   new long[]{4000, 10000}
    );

    // ── Daily food cost by preference ─────────────────────────────────────────
    private static final Map<String, long[]> FOOD_COST = Map.of(
            "vegetarian",    new long[]{400, 700},
            "nonvegetarian", new long[]{600, 1000},
            "both",          new long[]{500, 900}
    );

    // ── Transport cost per km by mode ─────────────────────────────────────────
    private static final Map<String, double[]> TRANSPORT_COST_PER_KM = Map.of(
            "car",    new double[]{3.5, 5.0},
            "bike",   new double[]{1.5, 2.5},
            "bus",    new double[]{0.5, 1.0},
            "train",  new double[]{0.3, 0.8},
            "flight", new double[]{4.0, 8.0},
            "mixed",  new double[]{1.5, 3.0}
    );

    // ── Activity cost per day by travel type ──────────────────────────────────
    private static final Map<String, long[]> ACTIVITY_COST = Map.of(
            "solo",     new long[]{300, 600},
            "couple",   new long[]{400, 800},
            "family",   new long[]{500, 1000},
            "friends",  new long[]{400, 900},
            "business", new long[]{800, 2000}
    );

    // ── Human-readable labels ─────────────────────────────────────────────────
    private static final Map<String, String> HOTEL_LABEL = Map.of(
            "budget",   "Budget (hostel / guesthouse, ₹500–1,200/night)",
            "standard", "Standard hotel (3-star equivalent, ₹1,500–3,000/night)",
            "luxury",   "Luxury resort / 5-star hotel (₹4,000–10,000/night)"
    );
    private static final Map<String, String> FOOD_LABEL = Map.of(
            "vegetarian",    "Vegetarian thali + snacks (₹400–700/day)",
            "nonvegetarian", "Non-veg meals at local restaurants (₹600–1,000/day)",
            "both",          "Mixed diet — veg + non-veg options (₹500–900/day)"
    );
    private static final Map<String, String> TRANSPORT_LABEL = Map.of(
            "car",    "Private car hire (₹3.5–5/km)",
            "bike",   "Bike rental (₹1.5–2.5/km)",
            "bus",    "State bus / sleeper bus (₹0.5–1/km)",
            "train",  "Indian Railways (₹0.3–0.8/km — cheapest long-distance)",
            "flight", "Domestic flights (₹4–8/km — fastest but priciest)",
            "mixed",  "Mix of road + rail (₹1.5–3/km average)"
    );

    public BudgetBreakdown estimate(
            MultiItineraryRequest req,
            double totalDistanceKm,
            int totalDays
    ) {
        String hotel      = defaulted(req.getHotelPreference(), "standard");
        String food       = defaulted(req.getFoodPreference(), "both");
        String transport  = defaulted(req.getTransport(), "mixed");
        String travelType = defaulted(req.getTravelType(), "friends");

        // ── Midpoint costs ──────────────────────────────────────────────────
        long hotelMid      = midpoint(HOTEL_COST.getOrDefault(hotel,     HOTEL_COST.get("standard")));
        long foodMid       = midpoint(FOOD_COST.getOrDefault(food,       FOOD_COST.get("both")));
        double transMid    = midpointDouble(TRANSPORT_COST_PER_KM.getOrDefault(transport, TRANSPORT_COST_PER_KM.get("mixed")));
        long activityMid   = midpoint(ACTIVITY_COST.getOrDefault(travelType, ACTIVITY_COST.get("friends")));

        long accommodation = hotelMid   * totalDays;
        long foodCost      = foodMid    * totalDays;
        long transportCost = (long)(transMid * totalDistanceKm);
        long activityCost  = activityMid * totalDays;
        long misc          = (long)((accommodation + foodCost + transportCost + activityCost) * 0.08);
        long total         = accommodation + foodCost + transportCost + activityCost + misc;
        long budget        = req.getBudgetPerPerson();
        long remaining     = budget - total;

        // ── Min / Max possible costs ────────────────────────────────────────
        long minAccom  = HOTEL_COST.get("budget")[0]   * totalDays;
        long minFood   = FOOD_COST.get("vegetarian")[0] * totalDays;
        long minTrans  = (long)(TRANSPORT_COST_PER_KM.get("train")[0] * totalDistanceKm);
        long minAct    = ACTIVITY_COST.get("solo")[0]  * totalDays;
        long minTotal  = (long)((minAccom + minFood + minTrans + minAct) * 1.08);

        long maxAccom  = HOTEL_COST.get("luxury")[1]         * totalDays;
        long maxFood   = FOOD_COST.get("nonvegetarian")[1]   * totalDays;
        long maxTrans  = (long)(TRANSPORT_COST_PER_KM.get("flight")[1] * totalDistanceKm);
        long maxAct    = ACTIVITY_COST.get("business")[1]    * totalDays;
        long maxTotal  = (long)((maxAccom + maxFood + maxTrans + maxAct) * 1.08);

        int utilizationPct = budget > 0 ? (int)Math.round((total * 100.0) / budget) : 0;

        // ── Suggestions ─────────────────────────────────────────────────────
        List<String> suggestions = buildSuggestions(
                total, budget, hotel, transport, accommodation, totalDays, transportCost, totalDistanceKm
        );

        // ── Per-category explanations ────────────────────────────────────────
        List<BudgetExplanation> explanations = buildExplanations(
                hotel, food, transport, travelType,
                accommodation, foodCost, transportCost, activityCost, misc,
                hotelMid, foodMid, transMid, activityMid,
                totalDays, totalDistanceKm
        );

        return BudgetBreakdown.builder()
                .accommodation(accommodation)
                .transport(transportCost)
                .food(foodCost)
                .activities(activityCost)
                .miscellaneous(misc)
                .total(total)
                .budget(budget)
                .remaining(remaining)
                .overBudget(total > budget)
                .suggestions(suggestions)
                .budgetUtilizationPct(utilizationPct)
                .minPossibleCost(minTotal)
                .maxPossibleCost(maxTotal)
                .explanations(explanations)
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Per-category explanations
    // ─────────────────────────────────────────────────────────────────────────

    private List<BudgetExplanation> buildExplanations(
            String hotel, String food, String transport, String travelType,
            long accommodation, long foodCost, long transportCost, long activityCost, long misc,
            long hotelMid, long foodMid, double transMid, long activityMid,
            int totalDays, double totalDistanceKm
    ) {
        List<BudgetExplanation> list = new ArrayList<>();

        // — Accommodation —
        long cheaperHotel  = midpoint(HOTEL_COST.get("budget"))   * totalDays;
        long premiumHotel  = midpoint(HOTEL_COST.get("luxury"))   * totalDays;
        list.add(BudgetExplanation.builder()
                .category("Accommodation")
                .estimatedCost(accommodation)
                .basis(HOTEL_LABEL.getOrDefault(hotel, hotel) + " × " + totalDays + " nights")
                .whyThisAmount("Midpoint of " + HOTEL_LABEL.getOrDefault(hotel, hotel)
                        + ". We use the midpoint (₹" + hotelMid + "/night) as a realistic estimate — "
                        + "actual price depends on city, season, and advance booking. "
                        + (hotel.equals("standard") ? "Standard hotels offer the best comfort-to-cost ratio in Indian tourist cities."
                         : hotel.equals("budget")   ? "Budget stays maximize spending money for experiences."
                                                    : "Luxury hotels provide premium amenities and iconic stays."))
                .cheaperOption(cheaperHotel)
                .cheaperLabel("Switch to budget accommodation (hostels / guesthouses)")
                .premiumOption(premiumHotel)
                .premiumLabel("Upgrade to luxury resorts / 5-star hotels")
                .build());

        // — Food —
        long cheaperFood  = FOOD_COST.get("vegetarian")[0]    * totalDays;
        long premiumFood  = FOOD_COST.get("nonvegetarian")[1] * totalDays;
        list.add(BudgetExplanation.builder()
                .category("Food & Dining")
                .estimatedCost(foodCost)
                .basis(FOOD_LABEL.getOrDefault(food, food) + " × " + totalDays + " days")
                .whyThisAmount("Covers 3 meals/day: breakfast at hotel/café (~₹100–200), "
                        + "lunch at local restaurant (~₹150–300), dinner (~₹200–500). "
                        + "Street food and dhabas are significantly cheaper; fine dining adds cost. "
                        + "We budget ₹" + foodMid + "/day as a realistic midpoint for India.")
                .cheaperOption(cheaperFood)
                .cheaperLabel("Eat at street stalls and local dhabas only (vegetarian, ultra-budget)")
                .premiumOption(premiumFood)
                .premiumLabel("Fine dining + hotel breakfasts + restaurant meals every meal")
                .build());

        // — Transport —
        long cheaperTrans = (long)(TRANSPORT_COST_PER_KM.get("train")[0] * totalDistanceKm);
        long premiumTrans = (long)(TRANSPORT_COST_PER_KM.get("flight")[1] * totalDistanceKm);
        list.add(BudgetExplanation.builder()
                .category("Transportation")
                .estimatedCost(transportCost)
                .basis(TRANSPORT_LABEL.getOrDefault(transport, transport)
                        + " × " + Math.round(totalDistanceKm) + " km total distance")
                .whyThisAmount("Based on ₹" + String.format("%.1f", transMid) + "/km for your chosen mode ("
                        + transport + "). Total optimized route distance is ~" + Math.round(totalDistanceKm)
                        + " km. The Nearest-Neighbour route algorithm already minimized backtracking — "
                        + "an unoptimized route could add 20–40% more km.")
                .cheaperOption(cheaperTrans)
                .cheaperLabel("Switch to Indian Railways (Sleeper/3AC class) — slowest but cheapest")
                .premiumOption(premiumTrans)
                .premiumLabel("Take domestic flights for all inter-city legs")
                .build());

        // — Activities —
        long cheaperAct = ACTIVITY_COST.get("solo")[0] * totalDays;
        long premiumAct = ACTIVITY_COST.get("business")[1] * totalDays;
        list.add(BudgetExplanation.builder()
                .category("Activities & Sightseeing")
                .estimatedCost(activityCost)
                .basis("₹" + activityMid + "/person/day × " + totalDays + " days (" + travelType + " travel type)")
                .whyThisAmount("Covers entry tickets, guided tours, water sports, safaris, or cultural shows. "
                        + "Many famous Indian monuments (ASI sites) cost ₹30–500 for Indians. "
                        + travelType + " groups tend to do "
                        + (travelType.equals("family") ? "more paid activities (theme parks, safaris, guided tours)."
                         : travelType.equals("solo")   ? "fewer group activities, reducing per-person cost."
                                                        : "a mix of paid and free experiences."))
                .cheaperOption(cheaperAct)
                .cheaperLabel("Focus on free attractions (temples, beaches, markets, hiking)")
                .premiumOption(premiumAct)
                .premiumLabel("Premium experiences: private tours, adventure sports, helicopter rides")
                .build());

        // — Miscellaneous —
        list.add(BudgetExplanation.builder()
                .category("Miscellaneous")
                .estimatedCost(misc)
                .basis("8% contingency buffer on all above categories")
                .whyThisAmount("Covers unforeseen expenses: travel insurance (~₹200–500/trip), "
                        + "SIM card or data plans (~₹200), tips & gratuities, "
                        + "local auto-rickshaw / cab hops within cities, "
                        + "shopping and souvenirs. 8% is a conservative buffer; "
                        + "budget travelers often keep this under 5%.")
                .cheaperOption((long)(misc * 0.5))
                .cheaperLabel("Skip tips, use free Wi-Fi, carry snacks")
                .premiumOption((long)(misc * 2.0))
                .premiumLabel("Include shopping, premium souvenirs, and spa treatments")
                .build());

        return list;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Suggestions when over budget
    // ─────────────────────────────────────────────────────────────────────────

    private List<String> buildSuggestions(
            long total, long budget,
            String hotel, String transport,
            long accommodation, int totalDays,
            long transportCost, double totalDistanceKm
    ) {
        List<String> suggestions = new ArrayList<>();
        if (total > budget) {
            double overBy = ((double)(total - budget) / budget) * 100;
            if (overBy > 5) {
                if (!hotel.equals("budget")) {
                    long saving = accommodation - midpoint(HOTEL_COST.get("budget")) * totalDays;
                    suggestions.add("🏨 Switch to budget accommodation → saves ₹" + String.format("%,d", saving)
                            + " (hostels & guesthouses are safe and social in Indian tourist cities).");
                }
                if (!transport.equals("bus") && !transport.equals("train")) {
                    long trainCost = (long)(TRANSPORT_COST_PER_KM.get("train")[0] * totalDistanceKm);
                    suggestions.add("🚂 Switch to train (3AC) instead of " + transport
                            + " → saves ₹" + String.format("%,d", transportCost - trainCost)
                            + " (Indian Railways is reliable and comfortable for distances > 200 km).");
                }
                suggestions.add("🎭 Focus on free attractions — India has thousands of temples, beaches, "
                        + "markets, and heritage streets accessible at no cost.");
                if (totalDays > 5) {
                    suggestions.add("📅 Trim by 1–2 days to stay within budget while keeping the best highlights.");
                }
            }
        }
        return suggestions;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private long midpoint(long[] range) {
        if (range == null) return 1000;
        return (range[0] + range[1]) / 2;
    }

    private double midpointDouble(double[] range) {
        if (range == null) return 2.0;
        return (range[0] + range[1]) / 2;
    }

    private String defaulted(String val, String def) {
        return (val != null && !val.isBlank()) ? val.toLowerCase() : def;
    }
}
