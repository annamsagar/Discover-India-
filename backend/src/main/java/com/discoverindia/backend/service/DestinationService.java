package com.discoverindia.backend.service;

import com.discoverindia.backend.dto.request.DestinationRequest;
import com.discoverindia.backend.dto.response.DestinationResponse;
import com.discoverindia.backend.entity.Destination;
import com.discoverindia.backend.exception.ResourceNotFoundException;
import com.discoverindia.backend.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DestinationService {

    private final DestinationRepository destinationRepository;

    public Page<DestinationResponse> getAllDestinations(Pageable pageable) {
        return destinationRepository.findAll(pageable).map(this::toResponse);
    }

    public DestinationResponse getDestinationById(Long id) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", id));
        return toResponse(destination);
    }

    public Page<DestinationResponse> searchDestinations(String query, Pageable pageable) {
        return destinationRepository.searchDestinations(query, pageable).map(this::toResponse);
    }

    public Page<DestinationResponse> getDestinationsByState(String state, Pageable pageable) {
        return destinationRepository.findByStateIgnoreCase(state, pageable).map(this::toResponse);
    }

    public List<DestinationResponse> getTopRatedDestinations(int limit) {
        return destinationRepository.findTopRated(Pageable.ofSize(limit))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public DestinationResponse createDestination(DestinationRequest request) {
        Destination destination = Destination.builder()
                .name(request.getName())
                .description(request.getDescription())
                .state(request.getState())
                .city(request.getCity())
                .imageUrl(request.getImageUrl())
                .categories(request.getCategories() != null ? request.getCategories() : List.of())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .entryFee(request.getEntryFee())
                .bestTimeToVisit(request.getBestTimeToVisit())
                .build();
        return toResponse(destinationRepository.save(destination));
    }

    @Transactional
    public DestinationResponse updateDestination(Long id, DestinationRequest request) {
        Destination destination = destinationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", id));

        destination.setName(request.getName());
        destination.setDescription(request.getDescription());
        destination.setState(request.getState());
        destination.setCity(request.getCity());
        destination.setImageUrl(request.getImageUrl());
        if (request.getCategories() != null) destination.setCategories(request.getCategories());
        destination.setLatitude(request.getLatitude());
        destination.setLongitude(request.getLongitude());
        destination.setEntryFee(request.getEntryFee());
        destination.setBestTimeToVisit(request.getBestTimeToVisit());

        return toResponse(destinationRepository.save(destination));
    }

    @Transactional
    public void deleteDestination(Long id) {
        if (!destinationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Destination", "id", id);
        }
        destinationRepository.deleteById(id);
    }

    public DestinationResponse toResponse(Destination destination) {
        return DestinationResponse.builder()
                .id(destination.getId())
                .name(destination.getName())
                .description(destination.getDescription())
                .state(destination.getState())
                .city(destination.getCity())
                .imageUrl(destination.getImageUrl())
                .categories(destination.getCategories())
                .latitude(destination.getLatitude())
                .longitude(destination.getLongitude())
                .entryFee(destination.getEntryFee())
                .averageRating(destination.getAverageRating())
                .reviewCount(destination.getReviewCount())
                .bestTimeToVisit(destination.getBestTimeToVisit())
                .createdAt(destination.getCreatedAt())
                .build();
    }
}
