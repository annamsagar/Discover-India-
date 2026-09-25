package com.discoverindia.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationResponse {
    private Long id;
    private String name;
    private String description;
    private String state;
    private String city;
    private String imageUrl;
    private List<String> categories;
    private Double latitude;
    private Double longitude;
    private Double entryFee;
    private Double averageRating;
    private Integer reviewCount;
    private String bestTimeToVisit;
    private LocalDateTime createdAt;
}
