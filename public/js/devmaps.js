//import { MarkerClusterer } from "@googlemaps/markerclusterer";

// Declare markers and map globally
let markers = [];
let map;
let infoWindow;


// Function to filter data by selected year
// Function to filter data by year and mocode


async function filterByYearAndMocode() {
    const selectedYear = document.getElementById("year-filter").value;
    const selectedMocode = document.getElementById("mocode-filter").value;
    console.log(document.getElementById("mocode-filter"))
    console.log(document.getElementById("mocode-filter").value)
    console.log('Selected Year:', selectedYear);
    console.log('Selected Mocode:', selectedMocode);
    let url = `/api/crashes?year=${selectedYear}`;
    if (selectedMocode) {
        url += `&mocodes=${selectedMocode}`;
    }

    // Log the URL to see if it's being generated correctly
    console.log('Fetching data from URL:', url);

    const response = await fetch(url);
    const data = await response.json();
    console.log('Filtered crash data:', data);

    // Handle the data and update the markers on the map as needed
    updateMapWithCrashData(data);
}

// Trigger the filtering when the dropdown values change
document.getElementById("year-filter").addEventListener("change", filterByYearAndMocode);
document.getElementById("mocode-filter").addEventListener("change", filterByYearAndMocode);



// Populate the dropdown with mocodes
async function populateMocodeDropdown() {
    const selectElement = document.getElementById("mocode-filter");
    
    // Fetch mocodes from the backend
    const response = await fetch('/api/mocodes');
    const mocodes = await response.json();

    // Create an option for each mocode
    for (let mocode in mocodes) {
        const option = document.createElement("option");
        option.value = mocode;
        option.textContent = `${mocode}: ${mocodes[mocode]}`;
        selectElement.appendChild(option);
    }
}
// Call the function to populate the dropdown when the page loads
window.onload = function () {
    populateMocodeDropdown();
};

// Function to trigger the filterByYear function for the current year on page load
async function defaultLoadData() {
    const currentYear = new Date().getFullYear();

    // Set the dropdown to the current year
    const yearSelect = document.getElementById("year-filter");
    yearSelect.value = currentYear; // Set the value to current year

    // Manually call the function to fetch the data for the current year
    await filterByYearAndMocode();
}

// Run the defaultLoadData when the page is loaded
document.addEventListener('DOMContentLoaded', defaultLoadData);

// Function to update the map with the crash data (add markers)
async function updateMapWithCrashData(crashData) {

    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");
    
    // Ensure the map exists
    if (!map || typeof AdvancedMarkerElement === 'undefined') {
        console.error('Map or AdvancedMarkerElement is not initialized');
        return;
    }

    // Clear existing markers (if any)
    clearMarkers();

    // Add new markers based on crashData
    crashData.forEach(({ coords, street1, street2, date_occ, time_occ, area_name, mocodes }) => {
        if (!coords || !coords.latitude || !coords.longitude) return;

        let iconImg = document.createElement("img");
        iconImg.src = "../assets/bikeaccident.png"

        const pin = new PinElement({
            glyph: iconImg,
            scale: 1.5,
          });

        const position = { lat: parseFloat(coords.latitude), lng: parseFloat(coords.longitude) };

        // Format the date and time
        const formattedDate = formatDate(date_occ);
        const formattedTime = formatTime(time_occ);

        // Create the marker
        const marker = new AdvancedMarkerElement({
            position,
            map,
           // content: iconImg,
            title: `${formattedDate} <br> ${time_occ} <br> ${area_name} <br> ${street1} & ${street2} <br> Mocode: ${mocodes}`,
        });

        // Add click event to open infoWindow
        marker.addListener("gmp-click", () => {
            infoWindow.setContent(marker.title);
            infoWindow.open(map, marker);
        });

        // Store marker in the markers array to keep track of it
        markers.push(marker);
    });

   //  new MarkerClusterer({markers, map})
    console.log(`${crashData.length} markers added.`);

   const markerCluster =  new markerCluster.MarkerClusterer({ markers, map});
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

let selectedLat = null;
let selectedLng = null;
function initForm(){


    var input = document.getElementById("posl");
    var autocomplete = new google.maps.places.Autocomplete(input);


    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        console.log("Place object:", place); // Debugging log to see if place has geometry
        if (place.geometry) {
            map.setCenter(place.geometry.location);
            map.setZoom(15);
            
            //store lat and long values
            document.getElementById("lat").value = place.geometry.location.lat();
            document.getElementById("long").value = place.geometry.location.lng();

             // Log values to ensure they are being set
             console.log("Latitude in initform:", place.geometry.location.lat());
             console.log("Longitude in initform:", place.geometry.location.lng());


        } else {
            document.getElementById("posl").placeholder = "Enter a location";
        }
    });
}


function handleFormSubmission(event) {

  

    // Prevent the form from submitting normally
    event.preventDefault();

    // Get the values from the form
    const title = document.getElementById("report").value;
    //const position = document.getElementById("posl").value;
    const latitude = document.getElementById("lat").value; // Get value from hidden input
    const longitude = document.getElementById("long").value; // Get value from hidden input
    const date = document.getElementById("datel").value;
    const incidentType = document.getElementById("incident-type").value;
    const sex = document.getElementById("sex").value;
    const age = document.getElementById("age").value;

    // Get current timestamp for "date reported"
    const datetimerpt = new Date().toISOString();
    console.log(`this is latitude in handle form submission ${latitude}`);
    console.log(`this is longitude in handle form submission ${longitude}`);
    console.log(`this is incident type in handle form submission ${incidentType}`);
    // Convert "date occurred" to ISO format
    const isoDate = new Date(date).toISOString();

    // Create the data object
    const formData = {
      
        sex,
        age,
        latitude,
        longitude,
        title, // Report Title
        date: isoDate, // Date Occurred (ISO)
        incidentType,
        datetimerpt // Date Reported (current timestamp)
    };

    // Submit the form data to the backend
    fetch('/submit-crash', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        // Handle success (e.g., show confirmation message)
        console.log('Data submitted successfully:', data);
    })
    .catch(error => {
        // Handle error (e.g., show error message)
        console.error('Error submitting data:', error);
    });
}


let AdvancedMarkerElement;
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
    filterByYearAndMocode();
    initForm();
}

// Ensure the map is initialized after the DOM is fully loaded
window.initMap = initMap;
