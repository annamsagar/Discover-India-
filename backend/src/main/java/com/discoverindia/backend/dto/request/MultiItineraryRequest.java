package com.discoverindia.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class MultiItineraryRequest {

    @NotBlank(message = "Starting location is required")
    private String startLocation;

    @NotEmpty(message = "Please add at least one destination")
    private List<String> destinations;

    private String startDate;           // ISO date string, optional

    @Positive
    private int days = 5;

    @Positive
    private int travelers = 2;

    private long budgetPerPerson = 15000; // ₹ per person

    /** solo | couple | family | friends | business */
    private String travelType = "friends";

    /** nature | beaches | adventure | history | temples | food | shopping | wildlife | photography | nightlife */
    private List<String> interests;

    /** car | bike | bus | train | flight | mixed */
    private String transport = "mixed";

    /** relaxed | balanced | fast */
    private String pace = "balanced";

    /** budget | standard | luxury */
    private String hotelPreference = "standard";

    /** vegetarian | nonVegetarian | both */
    private String foodPreference = "both";

    private String additionalRequirements;
}
