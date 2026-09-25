package com.discoverindia.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_itineraries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedItinerary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(name = "start_location", nullable = false)
    private String startLocation;

    /** JSON array of destination names */
    @Column(columnDefinition = "TEXT")
    private String destinationsJson;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(nullable = false)
    private int days;

    @Column(nullable = false)
    private int travelers;

    @Column(name = "budget_per_person")
    private long budgetPerPerson;

    /** Full JSON blob of the generated itinerary (MultiItineraryResponse) */
    @Column(name = "itinerary_json", columnDefinition = "TEXT", nullable = false)
    private String itineraryJson;

    /** Unique token for public sharing */
    @Column(name = "share_token", unique = true)
    private String shareToken;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean isPublic = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
