package com.discoverindia.backend.controller;

import com.discoverindia.backend.dto.request.ReviewRequest;
import com.discoverindia.backend.dto.response.ReviewResponse;
import com.discoverindia.backend.security.UserDetailsImpl;
import com.discoverindia.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/destinations/{destinationId}/reviews")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @PathVariable Long destinationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviewsByDestination(
                destinationId, PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @PostMapping("/destinations/{destinationId}/reviews")
    @PreAuthorize("hasRole('USER') or hasRole('CONTENT_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ReviewResponse> createReview(
            @PathVariable Long destinationId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(destinationId, request, currentUser));
    }

    @PutMapping("/reviews/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ReviewResponse> updateReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, request, currentUser));
    }

    @DeleteMapping("/reviews/{reviewId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteReview(
            @PathVariable Long reviewId,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        reviewService.deleteReview(reviewId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
