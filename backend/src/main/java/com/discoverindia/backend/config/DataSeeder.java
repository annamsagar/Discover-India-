package com.discoverindia.backend.config;

import com.discoverindia.backend.entity.Destination;
import com.discoverindia.backend.entity.Role;
import com.discoverindia.backend.entity.User;
import com.discoverindia.backend.repository.DestinationRepository;
import com.discoverindia.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final DestinationRepository destinationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
        seedDestinations();
    }

    private void seedAdminUser() {
        if (userRepository.existsByEmail("admin@discoverindia.com")) return;

        User admin = User.builder()
                .name("Admin")
                .email("admin@discoverindia.com")
                .password(passwordEncoder.encode("Admin@1234"))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);

        User contentManager = User.builder()
                .name("Content Manager")
                .email("manager@discoverindia.com")
                .password(passwordEncoder.encode("Manager@1234"))
                .role(Role.CONTENT_MANAGER)
                .build();
        userRepository.save(contentManager);

        log.info("✅ Seeded admin and content manager users.");
    }

    private void seedDestinations() {
        if (destinationRepository.count() > 0) return;

        List<Destination> destinations = List.of(
            Destination.builder()
                .name("Taj Mahal")
                .description("One of the Seven Wonders of the World, the Taj Mahal is a magnificent white marble mausoleum built by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal. Its symmetrical design, intricate carvings, and serene reflecting pools make it an unparalleled masterpiece.")
                .state("Uttar Pradesh").city("Agra")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg")
                .categories(List.of("Heritage", "Monument", "UNESCO World Heritage"))
                .latitude(27.1751).longitude(78.0421)
                .entryFee(1100.0).bestTimeToVisit("October to March")
                .averageRating(4.9).reviewCount(0).build(),

            Destination.builder()
                .name("Jaipur – Pink City")
                .description("Known as the 'Pink City', Jaipur is the vibrant capital of Rajasthan. Famous for its stunning palaces, forts, and bazaars, it offers a rich blend of Rajputana culture, colourful textiles, and Mughal architecture. Highlights include Amber Fort, Hawa Mahal, and City Palace.")
                .state("Rajasthan").city("Jaipur")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Hawa_Mahal_Jaipur.jpg/1280px-Hawa_Mahal_Jaipur.jpg")
                .categories(List.of("Heritage", "Culture", "Architecture"))
                .latitude(26.9124).longitude(75.7873)
                .entryFee(200.0).bestTimeToVisit("October to March")
                .averageRating(4.7).reviewCount(0).build(),

            Destination.builder()
                .name("Goa Beaches")
                .description("India's smallest state is a tropical paradise known for its stunning coastline, vibrant nightlife, Portuguese heritage, and delicious seafood. From the busy sands of Baga and Calangute to the serene Palolem beach, Goa has something for every traveller.")
                .state("Goa").city("Panaji")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Baga_Beach.jpg/1280px-Baga_Beach.jpg")
                .categories(List.of("Beach", "Nightlife", "Adventure", "Relaxation"))
                .latitude(15.2993).longitude(74.1240)
                .entryFee(0.0).bestTimeToVisit("November to February")
                .averageRating(4.6).reviewCount(0).build(),

            Destination.builder()
                .name("Kerala Backwaters")
                .description("A network of interconnected canals, rivers, lakes, and inlets, the Kerala Backwaters form a unique ecosystem. A houseboat cruise through these waterways, lined with coconut palms and paddy fields, is one of India's most unforgettable experiences.")
                .state("Kerala").city("Alleppey")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Kerala_backwaters.jpg/1280px-Kerala_backwaters.jpg")
                .categories(List.of("Nature", "Houseboat", "Relaxation", "Wildlife"))
                .latitude(9.4981).longitude(76.3388)
                .entryFee(0.0).bestTimeToVisit("September to March")
                .averageRating(4.8).reviewCount(0).build(),

            Destination.builder()
                .name("Varanasi – City of Light")
                .description("One of the oldest continuously inhabited cities in the world, Varanasi on the banks of the Ganges is deeply sacred to Hindus. The famous Ganga Aarti ceremony, ancient ghats, and the spiritual atmosphere make it a profound and moving destination.")
                .state("Uttar Pradesh").city("Varanasi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Varanasi_Ghats.jpg/1280px-Varanasi_Ghats.jpg")
                .categories(List.of("Spiritual", "Culture", "Heritage", "Pilgrimage"))
                .latitude(25.3176).longitude(82.9739)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.6).reviewCount(0).build(),

            Destination.builder()
                .name("Ladakh")
                .description("Perched in the Himalayas, Ladakh is a high-altitude desert known for its stark, breathtaking landscapes, Buddhist monasteries, crystal-clear lakes, and adventure sports. Pangong Lake, Leh Palace, and Nubra Valley are among its iconic attractions.")
                .state("Ladakh").city("Leh")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Pangong_Lake_Ladakh.jpg/1280px-Pangong_Lake_Ladakh.jpg")
                .categories(List.of("Adventure", "Nature", "Trekking", "Buddhist Culture"))
                .latitude(34.1526).longitude(77.5771)
                .entryFee(0.0).bestTimeToVisit("June to September")
                .averageRating(4.9).reviewCount(0).build(),

            Destination.builder()
                .name("Hampi")
                .description("A UNESCO World Heritage Site, Hampi was once the majestic capital of the Vijayanagara Empire. Today its boulder-strewn landscape is dotted with awe-inspiring ruins of temples, palaces, and market streets that transport visitors back in time.")
                .state("Karnataka").city("Hampi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Virupaksha_Temple_Hampi.jpg/1280px-Virupaksha_Temple_Hampi.jpg")
                .categories(List.of("Heritage", "Ruins", "UNESCO World Heritage", "History"))
                .latitude(15.3350).longitude(76.4600)
                .entryFee(600.0).bestTimeToVisit("October to February")
                .averageRating(4.7).reviewCount(0).build(),

            Destination.builder()
                .name("Darjeeling")
                .description("Nestled in the Eastern Himalayas, Darjeeling is famous worldwide for its tea plantations, the UNESCO-listed Darjeeling Himalayan Railway, and stunning views of Kangchenjunga—the world's third highest peak. A charming hill station with a colonial character.")
                .state("West Bengal").city("Darjeeling")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Darjeeling_Tea_Garden.jpg/1280px-Darjeeling_Tea_Garden.jpg")
                .categories(List.of("Hill Station", "Nature", "Tea", "UNESCO World Heritage"))
                .latitude(27.0410).longitude(88.2663)
                .entryFee(0.0).bestTimeToVisit("March to May, September to November")
                .averageRating(4.5).reviewCount(0).build(),

            Destination.builder()
                .name("Ranthambore National Park")
                .description("One of India's most famous tiger reserves, Ranthambore offers thrilling jeep safaris through a landscape dotted with ancient ruins, lakes, and of course, the majestic Bengal tiger. A top destination for wildlife enthusiasts and nature photographers.")
                .state("Rajasthan").city("Sawai Madhopur")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Tiger_in_Ranthambore.jpg/1280px-Tiger_in_Ranthambore.jpg")
                .categories(List.of("Wildlife", "Safari", "Nature", "Tiger Reserve"))
                .latitude(26.0173).longitude(76.5026)
                .entryFee(1500.0).bestTimeToVisit("October to June")
                .averageRating(4.6).reviewCount(0).build(),

            Destination.builder()
                .name("Mysore Palace")
                .description("One of India's most visited monuments, the Mysore Palace is a stunning Indo-Saracenic structure that was the residence of the Wadiyar dynasty. The palace is spectacularly illuminated on Sundays and during the Dasara festival, drawing millions of visitors.")
                .state("Karnataka").city("Mysore")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Mysore_Palace_illuminated.jpg/1280px-Mysore_Palace_illuminated.jpg")
                .categories(List.of("Heritage", "Palace", "Architecture", "Culture"))
                .latitude(12.3052).longitude(76.6552)
                .entryFee(200.0).bestTimeToVisit("October to February")
                .averageRating(4.7).reviewCount(0).build(),

            Destination.builder()
                .name("Andaman Islands")
                .description("A pristine archipelago in the Bay of Bengal, the Andaman Islands boast turquoise waters, white-sand beaches, and some of the world's most spectacular coral reefs. Ideal for snorkelling, scuba diving, and sea kayaking in an unspoiled natural paradise.")
                .state("Andaman and Nicobar Islands").city("Port Blair")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Radhanagar_Beach_Havelock.jpg/1280px-Radhanagar_Beach_Havelock.jpg")
                .categories(List.of("Beach", "Island", "Diving", "Adventure"))
                .latitude(11.7401).longitude(92.6586)
                .entryFee(0.0).bestTimeToVisit("October to May")
                .averageRating(4.8).reviewCount(0).build(),

            Destination.builder()
                .name("Golden Temple (Harmandir Sahib)")
                .description("The holiest shrine in Sikhism, the Golden Temple in Amritsar is a place of immense spiritual peace and beauty. Its shimmering gold-covered sanctum is reflected in the sacred Amrit Sarovar (Pool of Nectar), creating a mesmerising sight day and night.")
                .state("Punjab").city("Amritsar")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Golden_Temple_Amritsar.jpg/1280px-Golden_Temple_Amritsar.jpg")
                .categories(List.of("Spiritual", "Sikh Heritage", "Pilgrimage", "Architecture"))
                .latitude(31.6200).longitude(74.8765)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.9).reviewCount(0).build()
        );

        destinationRepository.saveAll(destinations);
        log.info("✅ Seeded {} Indian tourist destinations.", destinations.size());
    }
}
