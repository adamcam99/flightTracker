
(function() {

    
    // Initialize map 
    let map = L.map('theMap').setView([56.1304, -106.3468], 5); // Centered on Canada

    // Add OpenStreetMap tiles 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Placeholder for markers to clear them when refreshing
    let markers = [];

    const planeIcon = L.icon({
        iconUrl: 'plane4-45.png', 
        iconSize: [38, 38], 
        iconAnchor: [19, 19] 
    });

    //fetch and update flight markers
    function fetchAndUpdateFlightMarkers() {
        fetch('https://opensky-network.org/api/states/all')
            .then(response => {
                if (!response.ok) {
                    if (response.status === 429) {
                        // API rate limit 
                        throw new Error('API rate limit has been reached. Please wait a while before trying again.');
                    }
                    throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Clear existing markers
                markers.forEach(marker => map.removeLayer(marker));
                markers = [];

                // Filter for Canadian flights and create markers
                const canadianFlights = data.states.filter(flight => flight[2] === "Canada");
                canadianFlights.forEach(flight => {
                    const [lon, lat] = [flight[5], flight[6]]; // Longitude and Latitude
                    if (typeof lat === "number" && typeof lon === "number" && !isNaN(lat) && !isNaN(lon)) {
                        const rotation = flight[10] || 0; // Default to 0 
                        // flight info
                        const flightInfo = `
                            <strong>Callsign:</strong> ${flight[1].trim()}<br>
                            <strong>Country:</strong> ${flight[2]}<br>
                            <strong>Altitude:</strong> ${flight[7] ? flight[7] + ' m' : 'Not available'}<br>
                            <strong>Velocity:</strong> ${flight[9] ? flight[9] + ' m/s' : 'Not available'}
                        `;
                
                        // Add marker to the map with plane icon
                        const marker = L.marker([lat, lon], {
                            icon: planeIcon,
                        }).addTo(map);
                
                        // Apply rotation
                        marker.setRotationAngle(rotation);
                
                        // Bind a popup to the marker
                        marker.bindPopup(flightInfo);
                
                        markers.push(marker);
                    } else {
                        console.warn('Invalid flight data skipped:', flight);
                    }
                });
                
                
            })
            .catch(error => {
                console.error('Error fetching or processing flight data:', error);
                
             
                showErrorOnMap(error.message);
            });
    }
    
    function showErrorOnMap(message) {
        // Remove any existing error message layer
        if (window.errorMessageLayer) {
            map.removeLayer(window.errorMessageLayer);
        }
    
        // popup with the error message
        window.errorMessageLayer = L.popup()
            .setLatLng(map.getCenter()) 
            .setContent(message) 
            .openOn(map); 
    
        
        setTimeout(() => {
            if (window.errorMessageLayer) {
                map.closePopup(window.errorMessageLayer);
                window.errorMessageLayer = null;
            }
        }, 5000); // Close after 5 seconds
    }
    

    //refresh map
    fetchAndUpdateFlightMarkers();
    setInterval(fetchAndUpdateFlightMarkers, 30000);
})();
