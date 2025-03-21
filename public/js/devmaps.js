// Function to fetch crash data from your backend
async function fetchCrashData() {
    try {
        const response = await fetch("https://crashmaps-production.up.railway.app/api/crashes");
        const data = await response.json();
        console.log('Crash data received:', data);  // Log the data to check its structure
        return Array.isArray(data) ? data : [];  // Ensure it's an array before using it
    } catch (error) {
        console.error("Error loading crash data:", error);
        return [];
    }
}

let markerCount = 0;

// Function to format date in MM/DD/YYYY format
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString(undefined, options);  // Format to MM/DD/YYYY
}

// Function to format time in 12-hour format
function formatTime(timeString) {
    let hour = parseInt(timeString.slice(0, 2), 10);
    let minute = timeString.slice(2, 4);

    // Convert to 12-hour format
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // The hour '0' should be '12'

    return `${hour}:${minute} ${ampm}`;
}

// Function to initialize the map
async function initMap() {
    const { Map, InfoWindow } = await google.maps.importLibrary("maps");

    const centerOfCulverCity = { lat: 34.0211, lng: -118.3965 };

    const map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: centerOfCulverCity,
        mapId: "Culver_City",
    });

    const crashData = await fetchCrashData();

    if (crashData.length === 0) {
        console.log("No crash data available.");
        return;
    }

    const infoWindow = new InfoWindow();

    // 💥 Filter for crashes where `mocode` includes a specific numerical code
    const filterMocode = "3603";  // The numeric `mocode` you want to filter by
    const filteredCrashes = crashData.filter(entry =>
        entry.mocodes &&
        Array.isArray(entry.mocodes) &&
        entry.mocodes.includes(filterMocode)
    );

    filteredCrashes.forEach(({ coords, street1, street2, date_occ, time_occ, area_name, mocodes }) => {
        if (!coords || !coords.latitude || !coords.longitude) return;

        const position = { lat: parseFloat(coords.latitude), lng: parseFloat(coords.longitude) };

        // Format the date and time
        const formattedDate = formatDate(date_occ);
        const formattedTime = formatTime(time_occ);
        markerCount++;

        // Create the marker
        const marker = new google.maps.Marker({
            position,
            map,
            title: `${formattedDate} <br> ${formattedTime} <br> ${area_name} <br> ${street1} & ${street2} <br> Mocode: ${mocodes.join(', ')}`,
        });

        // Add click event to open infoWindow
        marker.addListener("click", () => {
            infoWindow.setContent(marker.title);
            infoWindow.open(map, marker);
        });
    });

    console.log(markerCount);  // Log the number of markers
}

// Ensure the map is initialized after the DOM is fully loaded
window.initMap = initMap;
