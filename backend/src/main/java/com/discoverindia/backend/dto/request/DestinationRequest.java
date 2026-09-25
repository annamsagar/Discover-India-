package com.discoverindia.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class DestinationRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "State is required")
    private String state;

    private String city;
    private String imageUrl;
    private List<String> categories;
    private Double latitude;
    private Double longitude;
    private Double entryFee;
    private String bestTimeToVisit;
}
