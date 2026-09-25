package com.discoverindia.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ItineraryRequest {

    @NotEmpty(message = "Please provide at least one destination")
    private List<String> destinationNames;

    private Integer days;
    private String travelStyle; // adventure, culture, relaxation, budget, luxury
    private String startCity;
}
