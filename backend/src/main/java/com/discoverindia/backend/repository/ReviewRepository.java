package com.discoverindia.backend.repository;

import com.discoverindia.backend.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Page<Review> findByDestinationId(Long destinationId, Pageable pageable);

    Optional<Review> findByUserIdAndDestinationId(Long userId, Long destinationId);

    boolean existsByUserIdAndDestinationId(Long userId, Long destinationId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.destination.id = :destinationId")
    Double findAverageRatingByDestinationId(@Param("destinationId") Long destinationId);

    @Query("SELECT COUNT(r) FROM Review r WHERE r.destination.id = :destinationId")
    Long countByDestinationId(@Param("destinationId") Long destinationId);
}
