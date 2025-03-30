// Declare markers and map globally
let markers = [];
let map;
let infoWindow;

// Function to filter data by selected year
async function filterByYear() {
    const selectedYear = document.getElementById("year-filter").value;

    // Check if a year is selected, if not, fetch the current year's data
    const url = selectedYear ? `/api/crashes?year=${selectedYear}` : '/api/crashes';

    // Log the URL to see if it's being generated correctly
    console.log('Fetching data from URL:', url);

    const response = await fetch(url);
    const data = await response.json();
    console.log('Filtered crash data:', data);

    // Handle the data and update the markers on the map as needed
    updateMapWithCrashData(data);
}

// Function to trigger the filterByYear function for the current year on page load
async function defaultLoadData() {
    const currentYear = new Date().getFullYear();

    // Set the dropdown to the current year
    const yearSelect = document.getElementById("year-filter");
    yearSelect.value = currentYear; // Set the value to current year

    // Manually call the function to fetch the data for the current year
    await filterByYear();
}

// Run the defaultLoadData when the page is loaded
document.addEventListener('DOMContentLoaded', defaultLoadData);

// Function to update the map with the crash data (add markers)
function updateMapWithCrashData(crashData) {
    // Ensure the map exists
    if (!map) {
        console.error('Map is not initialized');
        return;
    }

    // Clear existing markers (if any)
    clearMarkers();

    // Add new markers based on crashData
    crashData.forEach(({ coords, street1, street2, date_occ, time_occ, area_name, mocodes }) => {
        if (!coords || !coords.latitude || !coords.longitude) return;

        const position = { lat: parseFloat(coords.latitude), lng: parseFloat(coords.longitude) };

        // Format the date and time
        const formattedDate = formatDate(date_occ);
        const formattedTime = formatTime(time_occ);

        // Create the marker
        const marker = new google.maps.Marker({
            position,
            map,
            title: `${formattedDate} <br> ${formattedTime} <br> ${area_name} <br> ${street1} & ${street2} <br> Mocode: ${mocodes}`,
        });

        // Add click event to open infoWindow
        marker.addListener("click", () => {
            infoWindow.setContent(marker.title);
            infoWindow.open(map, marker);
        });

        // Store marker in the markers array to keep track of it
        markers.push(marker);
    });

    console.log(`${crashData.length} markers added.`);
}

// Function to clear existing markers from the map
function clearMarkers() {
    if (markers) {
        markers.forEach(marker => marker.setMap(null));
        markers = []; // Reset the markers array
    }
}

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

    map = new Map(document.getElementById("map"), {
        zoom: 12,
        center: centerOfCulverCity,
        mapId: "Culver_City",
    });

    infoWindow = new InfoWindow();

    // Fetch and update map data for the current year
    await filterByYear();
}

// Ensure the map is initialized after the DOM is fully loaded
window.initMap = initMap;
