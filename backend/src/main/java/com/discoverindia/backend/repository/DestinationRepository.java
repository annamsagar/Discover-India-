package com.discoverindia.backend.repository;

import com.discoverindia.backend.entity.Destination;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {

    Page<Destination> findByStateIgnoreCase(String state, Pageable pageable);

    @Query("SELECT DISTINCT d FROM Destination d LEFT JOIN d.categories c WHERE " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :altQuery, '%')) OR " +
           "LOWER(d.state) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.city) LIKE LOWER(CONCAT('%', :altQuery, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :altQuery, '%')) OR " +
           "LOWER(c) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c) LIKE LOWER(CONCAT('%', :altQuery, '%'))")
    Page<Destination> searchDestinations(
            @Param("query") String query,
            @Param("altQuery") String altQuery,
            Pageable pageable);

    @Query("SELECT d FROM Destination d ORDER BY d.averageRating DESC")
    List<Destination> findTopRated(Pageable pageable);
}
