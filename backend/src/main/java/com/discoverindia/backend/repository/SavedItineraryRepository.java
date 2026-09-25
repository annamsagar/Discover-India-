package com.discoverindia.backend.repository;

import com.discoverindia.backend.entity.SavedItinerary;
import com.discoverindia.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedItineraryRepository extends JpaRepository<SavedItinerary, Long> {

    List<SavedItinerary> findByUserOrderByCreatedAtDesc(User user);

    Optional<SavedItinerary> findByShareToken(String shareToken);

    Optional<SavedItinerary> findByIdAndUser(Long id, User user);
}
