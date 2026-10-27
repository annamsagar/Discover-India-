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
        if (destinationRepository.count() >= 30) return;
        destinationRepository.deleteAll();

        List<Destination> destinations = List.of(
            // ── Iconic Heritage & Wonders ──
            Destination.builder()
                .name("Taj Mahal")
                .description("One of the Seven Wonders of the World, the Taj Mahal is a magnificent white marble mausoleum built by Mughal emperor Shah Jahan in memory of his wife Mumtaz Mahal. Symmetrical architecture and reflecting pools make it an iconic place.")
                .state("Uttar Pradesh").city("Agra")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Taj_Mahal_%28Edited%29.jpeg/1280px-Taj_Mahal_%28Edited%29.jpeg")
                .categories(List.of("Heritage", "Monument", "UNESCO World Heritage", "Wonder of the World"))
                .latitude(27.1751).longitude(78.0421)
                .entryFee(1100.0).bestTimeToVisit("October to March")
                .averageRating(4.9).reviewCount(142).build(),

            Destination.builder()
                .name("Jaipur – Pink City")
                .description("Known as the 'Pink City', Jaipur is the vibrant royal capital of Rajasthan. Famous for its palaces, forts, and bustling bazaars. Highlights include Amber Fort, Hawa Mahal, and City Palace.")
                .state("Rajasthan").city("Jaipur")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Hawa_Mahal_Jaipur.jpg/1280px-Hawa_Mahal_Jaipur.jpg")
                .categories(List.of("City", "Heritage", "Culture", "Architecture", "Palace"))
                .latitude(26.9124).longitude(75.7873)
                .entryFee(200.0).bestTimeToVisit("October to March")
                .averageRating(4.7).reviewCount(89).build(),

            Destination.builder()
                .name("Goa Beaches")
                .description("India's tropical coast known for golden sands, vibrant nightlife, Portuguese heritage, churches, and delicious seafood. Features Baga, Calangute, and Palolem beaches.")
                .state("Goa").city("Panaji")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Baga_Beach.jpg/1280px-Baga_Beach.jpg")
                .categories(List.of("Beach", "Nightlife", "Adventure", "Relaxation", "Coastal"))
                .latitude(15.2993).longitude(74.1240)
                .entryFee(0.0).bestTimeToVisit("November to February")
                .averageRating(4.6).reviewCount(115).build(),

            Destination.builder()
                .name("Kerala Backwaters")
                .description("A tranquil network of lagoons, canals, and lakes. Houseboat cruises through Alleppey and Kumarakom offer an enchanting view of rural Kerala and palm-fringed waters.")
                .state("Kerala").city("Alleppey")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Kerala_backwaters.jpg/1280px-Kerala_backwaters.jpg")
                .categories(List.of("Nature", "Houseboat", "Relaxation", "Scenic"))
                .latitude(9.4981).longitude(76.3388)
                .entryFee(0.0).bestTimeToVisit("September to March")
                .averageRating(4.8).reviewCount(96).build(),

            Destination.builder()
                .name("Varanasi – Ancient City of Light")
                .description("One of the world's oldest inhabited cities on the banks of the sacred Ganges. Famous for spiritual ghats, evening Ganga Aarti, and sacred temples.")
                .state("Uttar Pradesh").city("Varanasi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Varanasi_Ghats.jpg/1280px-Varanasi_Ghats.jpg")
                .categories(List.of("City", "Spiritual", "Culture", "Heritage", "Pilgrimage", "Temple"))
                .latitude(25.3176).longitude(82.9739)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(130).build(),

            Destination.builder()
                .name("Ladakh")
                .description("High-altitude Himalayan wonderland of stark mountain passes, crystal Pangong Lake, ancient Buddhist monasteries, and high-octane adventure.")
                .state("Ladakh").city("Leh")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Pangong_Lake_Ladakh.jpg/1280px-Pangong_Lake_Ladakh.jpg")
                .categories(List.of("Adventure", "Nature", "Himalayas", "Trekking", "Buddhist Culture"))
                .latitude(34.1526).longitude(77.5771)
                .entryFee(0.0).bestTimeToVisit("June to September")
                .averageRating(4.9).reviewCount(78).build(),

            Destination.builder()
                .name("Hampi – Vijayanagara Temples & Ruins")
                .description("UNESCO World Heritage site with boulder-strewn landscapes and magnificent 14th-century temples, royal enclosures, and the iconic stone chariot at Vijaya Vittala Temple.")
                .state("Karnataka").city("Hampi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Virupaksha_Temple_Hampi.jpg/1280px-Virupaksha_Temple_Hampi.jpg")
                .categories(List.of("Temple", "Temples", "UNESCO World Heritage", "Heritage", "History", "Ruins"))
                .latitude(15.3350).longitude(76.4600)
                .entryFee(600.0).bestTimeToVisit("October to February")
                .averageRating(4.8).reviewCount(64).build(),

            Destination.builder()
                .name("Darjeeling")
                .description("Himalayan hill station famed for world-renowned emerald tea gardens, the UNESCO Toy Train, and sweeping views of Mt. Kangchenjunga.")
                .state("West Bengal").city("Darjeeling")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Darjeeling_Tea_Garden.jpg/1280px-Darjeeling_Tea_Garden.jpg")
                .categories(List.of("Hill Station", "Nature", "Tea", "Mountains"))
                .latitude(27.0410).longitude(88.2663)
                .entryFee(0.0).bestTimeToVisit("March to May, September to November")
                .averageRating(4.6).reviewCount(52).build(),

            Destination.builder()
                .name("Ranthambore National Park")
                .description("Renowned tiger reserve in Rajasthan featuring jungle jeep safaris, ancient hill fort ruins, and abundant wildlife.")
                .state("Rajasthan").city("Sawai Madhopur")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Tiger_in_Ranthambore.jpg/1280px-Tiger_in_Ranthambore.jpg")
                .categories(List.of("Wildlife", "Safari", "Nature", "Tiger Reserve"))
                .latitude(26.0173).longitude(76.5026)
                .entryFee(1500.0).bestTimeToVisit("October to June")
                .averageRating(4.6).reviewCount(45).build(),

            Destination.builder()
                .name("Mysore Palace")
                .description("Royal residence of the Wadiyar dynasty featuring grand Indo-Saracenic halls, stained glass, and brilliant illumination of 100,000 bulbs.")
                .state("Karnataka").city("Mysore")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Mysore_Palace_illuminated.jpg/1280px-Mysore_Palace_illuminated.jpg")
                .categories(List.of("Heritage", "Palace", "Architecture", "City"))
                .latitude(12.3052).longitude(76.6552)
                .entryFee(200.0).bestTimeToVisit("October to February")
                .averageRating(4.7).reviewCount(88).build(),

            Destination.builder()
                .name("Andaman Islands")
                .description("Pristine tropical archipelago with turquoise waters, coral reefs, scuba diving at Havelock, and historic Cellular Jail in Port Blair.")
                .state("Andaman and Nicobar Islands").city("Port Blair")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/Radhanagar_Beach_Havelock.jpg/1280px-Radhanagar_Beach_Havelock.jpg")
                .categories(List.of("Beach", "Island", "Adventure", "Diving"))
                .latitude(11.7401).longitude(92.6586)
                .entryFee(0.0).bestTimeToVisit("October to May")
                .averageRating(4.8).reviewCount(71).build(),

            // ── Famous Temples of India ──
            Destination.builder()
                .name("Golden Temple (Harmandir Sahib)")
                .description("Holiest gurdwara of Sikhism located in Amritsar. The glistening gilded sanctum sits in the Amrit Sarovar, welcoming visitors of all faiths with profound peace and 24/7 langar.")
                .state("Punjab").city("Amritsar")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Golden_Temple_Amritsar.jpg/1280px-Golden_Temple_Amritsar.jpg")
                .categories(List.of("Temple", "Temples", "Spiritual", "Sikh Heritage", "Pilgrimage", "Architecture"))
                .latitude(31.6200).longitude(74.8765)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.9).reviewCount(175).build(),

            Destination.builder()
                .name("Tirupati Balaji (Sri Venkateswara Temple)")
                .description("World's most visited sacred Hindu temple located atop the Tirumala Seven Hills. Dedicated to Lord Venkateswara (Balaji), renowned for Dravidian gold gopurams and spiritual devotion.")
                .state("Andhra Pradesh").city("Tirupati")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tirumala_090615.jpg/1280px-Tirumala_090615.jpg")
                .categories(List.of("Temple", "Temples", "Spiritual", "Pilgrimage", "Hindu Temple", "Heritage"))
                .latitude(13.6833).longitude(79.3472)
                .entryFee(0.0).bestTimeToVisit("September to March")
                .averageRating(4.9).reviewCount(210).build(),

            Destination.builder()
                .name("Meenakshi Amman Temple")
                .description("Historic architectural wonder in Madurai dedicated to Goddess Meenakshi. Renowned for 14 towering multi-coloured gopurams, intricate mythological carvings, and Hall of Thousand Pillars.")
                .state("Tamil Nadu").city("Madurai")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Madurai_Meenakshi_Amman_Temple_Tower.jpg/1280px-Madurai_Meenakshi_Amman_Temple_Tower.jpg")
                .categories(List.of("Temple", "Temples", "Architecture", "Dravidian", "Heritage", "Spiritual"))
                .latitude(9.9195).longitude(78.1193)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(155).build(),

            Destination.builder()
                .name("Kashi Vishwanath Temple")
                .description("Legendary Jyotirlinga temple of Lord Shiva in Varanasi on the sacred Ganga. Features golden domes and the majestic new corridor leading directly from the river ghats.")
                .state("Uttar Pradesh").city("Varanasi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Kashi_Vishwanath_Temple_Varanasi.jpg/1280px-Kashi_Vishwanath_Temple_Varanasi.jpg")
                .categories(List.of("Temple", "Temples", "Jyotirlinga", "Spiritual", "Pilgrimage", "City"))
                .latitude(25.3109).longitude(83.0107)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.9).reviewCount(190).build(),

            Destination.builder()
                .name("Kedarnath Temple")
                .description("Perched at 3,583m in the Garhwal Himalayas near the Mandakini River. One of the twelve sacred Jyotirlingas and the premier shrine of the Char Dham pilgrimage.")
                .state("Uttarakhand").city("Rudraprayag")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Kedarnath_Temple_Uttarakhand.jpg/1280px-Kedarnath_Temple_Uttarakhand.jpg")
                .categories(List.of("Temple", "Temples", "Himalayas", "Jyotirlinga", "Pilgrimage", "Spiritual"))
                .latitude(30.7352).longitude(79.0669)
                .entryFee(0.0).bestTimeToVisit("May to October")
                .averageRating(4.9).reviewCount(160).build(),

            Destination.builder()
                .name("Badrinath Temple")
                .description("Preeminent holy shrine of Lord Vishnu in the Himalayas between the Nar and Narayana mountain ranges, part of the Char Dham circuit.")
                .state("Uttarakhand").city("Chamoli")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Badrinath_Temple_Uttarakhand.jpg/1280px-Badrinath_Temple_Uttarakhand.jpg")
                .categories(List.of("Temple", "Temples", "Char Dham", "Pilgrimage", "Himalayas", "Spiritual"))
                .latitude(30.7433).longitude(79.4938)
                .entryFee(0.0).bestTimeToVisit("May to October")
                .averageRating(4.8).reviewCount(120).build(),

            Destination.builder()
                .name("Jagannath Temple, Puri")
                .description("Famed 12th-century temple of Lord Jagannath on the Odisha coast, internationally celebrated for the monumental Ratha Yatra and sacred Mahaprasad.")
                .state("Odisha").city("Puri")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Puri_Jagannath_Temple.jpg/1280px-Puri_Jagannath_Temple.jpg")
                .categories(List.of("Temple", "Temples", "Pilgrimage", "Spiritual", "Coastal", "Heritage"))
                .latitude(19.8049).longitude(85.8179)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(145).build(),

            Destination.builder()
                .name("Konark Sun Temple")
                .description("UNESCO World Heritage masterpiece constructed as a 24-wheeled colossal chariot pulled by seven galloping stone horses, celebrating 13th-century Kalinga architecture.")
                .state("Odisha").city("Konark")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Konark_Sun_Temple_wheel.jpg/1280px-Konark_Sun_Temple_wheel.jpg")
                .categories(List.of("Temple", "Temples", "UNESCO World Heritage", "Architecture", "Monument"))
                .latitude(19.8876).longitude(86.0945)
                .entryFee(40.0).bestTimeToVisit("October to March")
                .averageRating(4.7).reviewCount(98).build(),

            Destination.builder()
                .name("Somnath Temple")
                .description("Standing on the western shores of the Arabian Sea, Somnath is the revered first of the twelve Jyotirlingas, known for Chalukya stonework and spiritual majesty.")
                .state("Gujarat").city("Veraval")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Somnath_temple.jpg/1280px-Somnath_temple.jpg")
                .categories(List.of("Temple", "Temples", "Jyotirlinga", "Coastal", "Spiritual", "Pilgrimage"))
                .latitude(20.8880).longitude(70.4010)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(110).build(),

            Destination.builder()
                .name("Brihadeeswara Temple")
                .description("UNESCO World Heritage site built by Chola Emperor Raja Raja I in Thanjavur, famous for its monolithic 66m granite vimana built without binding mortar.")
                .state("Tamil Nadu").city("Thanjavur")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brihadisvara_Temple%2C_Thanjavur.jpg/1280px-Brihadisvara_Temple%2C_Thanjavur.jpg")
                .categories(List.of("Temple", "Temples", "UNESCO World Heritage", "Architecture", "Heritage", "Chola"))
                .latitude(10.7828).longitude(79.1318)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.9).reviewCount(92).build(),

            Destination.builder()
                .name("Akshardham Temple, Delhi")
                .description("A breathtaking pink sandstone and white marble spiritual campus showcasing 10,000 years of Indian culture, boat rides, and the Sahaj Anand water show.")
                .state("Delhi").city("New Delhi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Akshardham_Temple_Delhi.jpg/1280px-Akshardham_Temple_Delhi.jpg")
                .categories(List.of("Temple", "Temples", "City", "Architecture", "Spiritual", "Monument"))
                .latitude(28.6127).longitude(77.2773)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(180).build(),

            Destination.builder()
                .name("Padmanabhaswamy Temple")
                .description("Ancient Dravidian and Chera style temple of Lord Vishnu in Thiruvananthapuram, renowned for its golden corridors, Gopuram, and immense history.")
                .state("Kerala").city("Thiruvananthapuram")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sree_Padmanabhaswamy_Temple.jpg/1280px-Sree_Padmanabhaswamy_Temple.jpg")
                .categories(List.of("Temple", "Temples", "Heritage", "Spiritual", "City", "Pilgrimage"))
                .latitude(8.4830).longitude(76.9436)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(85).build(),

            Destination.builder()
                .name("Khajuraho Temples")
                .description("UNESCO World Heritage collection of Nagara-style Hindu and Jain temples famed for exquisite stone craftsmanship, spirituality, and medieval art.")
                .state("Madhya Pradesh").city("Khajuraho")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Kandariya_Mahadeva_Temple.jpg/1280px-Kandariya_Mahadeva_Temple.jpg")
                .categories(List.of("Temple", "Temples", "UNESCO World Heritage", "Architecture", "Heritage"))
                .latitude(24.8318).longitude(79.9199)
                .entryFee(40.0).bestTimeToVisit("October to March")
                .averageRating(4.7).reviewCount(76).build(),

            // ── Iconic Indian Cities & Metros ──
            Destination.builder()
                .name("Delhi – Capital City & Heritage")
                .description("Historic national capital featuring UNESCO wonders Red Fort, Qutub Minar, Humayun's Tomb, alongside India Gate, vibrant Chandni Chowk food, and Rashtrapati Bhavan.")
                .state("Delhi").city("New Delhi")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/India_Gate_in_New_Delhi_03-2016.jpg/1280px-India_Gate_in_New_Delhi_03-2016.jpg")
                .categories(List.of("City", "Cities", "Heritage", "Capital", "Food", "Monuments"))
                .latitude(28.6139).longitude(77.2090)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.7).reviewCount(165).build(),

            Destination.builder()
                .name("Mumbai – City of Dreams")
                .description("India's dynamic financial and cinematic capital on the Arabian Sea. Iconic attractions include Gateway of India, Marine Drive, Elephanta Caves, and Chhatrapati Shivaji Terminus.")
                .state("Maharashtra").city("Mumbai")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Gateway_of_India_Mumbai.jpg/1280px-Gateway_of_India_Mumbai.jpg")
                .categories(List.of("City", "Cities", "Coastal", "Nightlife", "Architecture", "Heritage"))
                .latitude(18.9220).longitude(72.8347)
                .entryFee(0.0).bestTimeToVisit("November to February")
                .averageRating(4.7).reviewCount(190).build(),

            Destination.builder()
                .name("Bengaluru – Garden City & Tech Hub")
                .description("Vibrant cosmopolitan city with pleasant year-round weather, Lalbagh Botanical Gardens, Bangalore Palace, Bannerghatta National Park, and craft breweries.")
                .state("Karnataka").city("Bengaluru")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bangalore_Palace.jpg/1280px-Bangalore_Palace.jpg")
                .categories(List.of("City", "Cities", "Gardens", "Technology", "Modern", "Food"))
                .latitude(12.9716).longitude(77.5946)
                .entryFee(0.0).bestTimeToVisit("September to March")
                .averageRating(4.6).reviewCount(118).build(),

            Destination.builder()
                .name("Hyderabad – City of Pearls & Nizams")
                .description("Rich Nizam heritage city famed for the 400-year-old Charminar, Golconda Fort sound & light show, Chowmahalla Palace, and legendary authentic Biryani.")
                .state("Telangana").city("Hyderabad")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Charminar_Hyderabad.jpg/1280px-Charminar_Hyderabad.jpg")
                .categories(List.of("City", "Cities", "Heritage", "Food", "Monuments", "Culture"))
                .latitude(17.3850).longitude(78.4867)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.7).reviewCount(142).build(),

            Destination.builder()
                .name("Kolkata – Cultural City of Joy")
                .description("Intellectual capital along the Hooghly River. Home of the Victoria Memorial, Howrah Bridge, Dakshineswar Kali Temple, historic trams, and rich sweets.")
                .state("West Bengal").city("Kolkata")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Victoria_Memorial_situated_in_Kolkata.jpg/1280px-Victoria_Memorial_situated_in_Kolkata.jpg")
                .categories(List.of("City", "Cities", "Culture", "Heritage", "Colonial", "Temple"))
                .latitude(22.5726).longitude(88.3639)
                .entryFee(0.0).bestTimeToVisit("October to March")
                .averageRating(4.6).reviewCount(105).build(),

            Destination.builder()
                .name("Chennai – Coastal Cultural Capital")
                .description("Gateway to South India on the Coromandel Coast, featuring Marina Beach, 7th-century Kapaleeshwarar Temple, Carnatic classical arts, and South Indian filter coffee.")
                .state("Tamil Nadu").city("Chennai")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Kapaleeshwarar_Temple_Chennai.jpg/1280px-Kapaleeshwarar_Temple_Chennai.jpg")
                .categories(List.of("City", "Cities", "Coastal", "Temple", "Culture", "Beach"))
                .latitude(13.0827).longitude(80.2707)
                .entryFee(0.0).bestTimeToVisit("November to February")
                .averageRating(4.5).reviewCount(95).build(),

            Destination.builder()
                .name("Udaipur – City of Lakes")
                .description("The romantic 'Venice of the East' surrounded by azure lakes and Aravalli mountains, famous for Lake Pichola boat rides, City Palace, and Jag Mandir.")
                .state("Rajasthan").city("Udaipur")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/City_Palace_Udaipur.jpg/1280px-City_Palace_Udaipur.jpg")
                .categories(List.of("City", "Cities", "Lakes", "Heritage", "Palace", "Romantic"))
                .latitude(24.5854).longitude(73.7125)
                .entryFee(300.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(134).build(),

            // ── Places, Hill Stations & Natural Wonders ──
            Destination.builder()
                .name("Rishikesh & Haridwar – Yoga & Ganga")
                .description("Spiritual twin towns where the Holy Ganga leaves the Himalayas. World hub for yoga ashrams, Ganga Aarti ceremonies, suspension bridges, and river rafting.")
                .state("Uttarakhand").city("Rishikesh")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Lakshman_Jhula_Rishikesh.jpg/1280px-Lakshman_Jhula_Rishikesh.jpg")
                .categories(List.of("Place", "Places", "Spiritual", "Adventure", "Yoga", "River"))
                .latitude(30.0869).longitude(78.2676)
                .entryFee(0.0).bestTimeToVisit("September to April")
                .averageRating(4.7).reviewCount(120).build(),

            Destination.builder()
                .name("Manali – Himalayan Valley")
                .description("Picturesque Himalayan hill town in the Beas River valley. Gateway to Rohtang Pass, Solang Valley winter sports, Hadimba timber temple, and mountain views.")
                .state("Himachal Pradesh").city("Manali")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Manali_Himachal_Pradesh.jpg/1280px-Manali_Himachal_Pradesh.jpg")
                .categories(List.of("Place", "Places", "Hill Station", "Mountains", "Snow", "Adventure"))
                .latitude(32.2432).longitude(77.1892)
                .entryFee(0.0).bestTimeToVisit("October to June")
                .averageRating(4.7).reviewCount(148).build(),

            Destination.builder()
                .name("Munnar – Emerald Tea Hills")
                .description("Serene South Indian hill station in Kerala, blanketed by endless rolling tea estates, misty mountain peaks, Anamudi, and cascading waterfalls.")
                .state("Kerala").city("Munnar")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Munnar_tea_plantations.jpg/1280px-Munnar_tea_plantations.jpg")
                .categories(List.of("Place", "Places", "Hill Station", "Nature", "Tea", "Scenic"))
                .latitude(10.0889).longitude(77.0595)
                .entryFee(0.0).bestTimeToVisit("September to May")
                .averageRating(4.8).reviewCount(112).build(),

            Destination.builder()
                .name("Ajanta & Ellora Caves")
                .description("UNESCO World Heritage rock-cut cave temples and monasteries dating from 2nd century BCE. Ellora's monolithic Kailasa Temple is an architectural miracle.")
                .state("Maharashtra").city("Aurangabad")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Ellora_cave_16_Kailash_temple.jpg/1280px-Ellora_cave_16_Kailash_temple.jpg")
                .categories(List.of("Temple", "Temples", "UNESCO World Heritage", "Heritage", "Architecture", "Cave"))
                .latitude(20.5519).longitude(75.7033)
                .entryFee(40.0).bestTimeToVisit("October to March")
                .averageRating(4.8).reviewCount(87).build(),

            Destination.builder()
                .name("Ooty – Queen of Hill Stations")
                .description("Delightful colonial hill retreat in the Nilgiri Mountains, famed for the UNESCO Mountain Toy Train, Botanical Gardens, Doddabetta Peak, and tea estates.")
                .state("Tamil Nadu").city("Ooty")
                .imageUrl("https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Ooty_Botanical_Gardens.jpg/1280px-Ooty_Botanical_Gardens.jpg")
                .categories(List.of("Place", "Places", "Hill Station", "Nature", "Colonial", "Mountains"))
                .latitude(11.4102).longitude(76.6950)
                .entryFee(30.0).bestTimeToVisit("October to June")
                .averageRating(4.6).reviewCount(90).build()
        );

        destinationRepository.saveAll(destinations);
        log.info("✅ Seeded {} Indian tourist destinations across temples, cities, and places.", destinations.size());
    }
}
