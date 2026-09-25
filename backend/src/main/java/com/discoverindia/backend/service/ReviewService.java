package com.discoverindia.backend.service;

import com.discoverindia.backend.dto.request.ReviewRequest;
import com.discoverindia.backend.dto.response.ReviewResponse;
import com.discoverindia.backend.entity.Destination;
import com.discoverindia.backend.entity.Review;
import com.discoverindia.backend.entity.User;
import com.discoverindia.backend.exception.BadRequestException;
import com.discoverindia.backend.exception.ResourceNotFoundException;
import com.discoverindia.backend.exception.UnauthorizedException;
import com.discoverindia.backend.repository.DestinationRepository;
import com.discoverindia.backend.repository.ReviewRepository;
import com.discoverindia.backend.repository.UserRepository;
import com.discoverindia.backend.security.UserDetailsImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final DestinationRepository destinationRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviewsByDestination(Long destinationId, Pageable pageable) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new ResourceNotFoundException("Destination", "id", destinationId);
        }
        return reviewRepository.findByDestinationId(destinationId, pageable).map(this::toResponse);
    }

    @Transactional
    public ReviewResponse createReview(Long destinationId, ReviewRequest request, UserDetailsImpl currentUser) {
        if (reviewRepository.existsByUserIdAndDestinationId(currentUser.getId(), destinationId)) {
            throw new BadRequestException("You have already reviewed this destination.");
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", "id", destinationId));

        Review review = Review.builder()
                .user(user)
                .destination(destination)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        reviewRepository.save(review);
        recalculateRating(destination);
        return toResponse(review);
    }

    @Transactional
    public ReviewResponse updateReview(Long reviewId, ReviewRequest request, UserDetailsImpl currentUser) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        if (!review.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only edit your own reviews.");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());
        reviewRepository.save(review);
        recalculateRating(review.getDestination());
        return toResponse(review);
    }

    @Transactional
    public void deleteReview(Long reviewId, UserDetailsImpl currentUser) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", reviewId));

        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!review.getUser().getId().equals(currentUser.getId()) && !isAdmin) {
            throw new UnauthorizedException("You can only delete your own reviews.");
        }

        Destination destination = review.getDestination();
        reviewRepository.delete(review);
        recalculateRating(destination);
    }

    private void recalculateRating(Destination destination) {
        Double avg = reviewRepository.findAverageRatingByDestinationId(destination.getId());
        Long count = reviewRepository.countByDestinationId(destination.getId());
        destination.setAverageRating(avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        destination.setReviewCount(count != null ? count.intValue() : 0);
        destinationRepository.save(destination);
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .userId(review.getUser().getId())
                .userName(review.getUser().getName())
                .destinationId(review.getDestination().getId())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
