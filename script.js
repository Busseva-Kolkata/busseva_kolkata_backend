// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const voiceBtn = document.getElementById('voiceBtn');
const resultsSection = document.getElementById('results');
const busResults = document.getElementById('busResults');
const closeResults = document.getElementById('closeResults');

// Show results popup
function showResults() {
    document.body.classList.add('results-open');
    resultsSection.classList.remove('hidden');
    setTimeout(() => {
        resultsSection.classList.add('active');
    }, 10);
}

// Hide results popup
function hideResults() {
    resultsSection.classList.remove('active');
    setTimeout(() => {
        resultsSection.classList.add('hidden');
        document.body.classList.remove('results-open');
    }, 300); // Match the CSS transition duration
}

// Search for buses
async function searchBuses() {
    const destination = searchInput.value.trim().toLowerCase();
    if (!destination) return;

    try {
        const response = await fetch('data.json');
        const data = await response.json();
        
        const matchingBuses = data.routes.filter(bus => 
            bus.stops.some(stop => stop.toLowerCase().includes(destination))
        );

        displayResults(matchingBuses, destination);
    } catch (error) {
        console.error('Error fetching bus data:', error);
        busResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading bus data. Please try again later.</p>
            </div>
        `;
        showResults();
    }
}

// Display search results
function displayResults(buses, searchTerm) {
    if (buses.length === 0) {
        busResults.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No buses found for "${searchTerm}"</p>
            </div>
        `;
    } else {
        const busCardsHTML = buses.map(bus => `
            <div class="bus-card">
                <div class="bus-header">
                    <div class="bus-profile-pic" style="background-image: url('${bus.image || `https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=500`}')">
                        <span>${bus.number}</span>
                    </div>
                    <div class="bus-title">
                        <h3>Bus ${bus.number}</h3>
                        <p>${bus.name}</p>
                    </div>
                </div>
                <div class="bus-details">
                    <p><i class="fas fa-clock"></i> Frequency: ${bus.frequency}</p>
                    <p><i class="fas fa-route"></i> Route: ${bus.stops[0]} to ${bus.stops[bus.stops.length - 1]}</p>
                </div>
                <div class="bus-actions">
                    <button class="feature-btn view-route" onclick="viewBusDetails('${bus.number}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="feature-btn save-route" onclick="saveRoute('${bus.number}')">
                        <i class="fas fa-star"></i> Save Route
                    </button>
                </div>
            </div>
        `).join('');

        busResults.innerHTML = `
            <div class="results-header">
                <h2>${buses.length} Bus${buses.length > 1 ? 'es' : ''} Found</h2>
                <p>Buses that stop at "${searchTerm}"</p>
            </div>
            <div class="search-results">
                ${busCardsHTML}
            </div>
        `;
    }
    showResults();
}

// Generate random color for bus profile pictures
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Save route to favorites
function saveRoute(busNumber) {
    let favorites = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
    if (!favorites.includes(busNumber)) {
        favorites.push(busNumber);
        localStorage.setItem('favoriteRoutes', JSON.stringify(favorites));
        alert('Route saved to favorites!');
    } else {
        alert('This route is already in your favorites!');
    }
}

// View bus details
async function viewBusDetails(busNumber) {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const bus = data.routes.find(b => b.number === busNumber);
        
        if (!bus) {
            console.error('Bus not found:', busNumber);
            return;
        }

        window.location.href = `bus-list.html?bus=${busNumber}&showModal=true`;
    } catch (error) {
        console.error('Error loading bus details:', error);
        alert('Unable to load bus details. Please try again later.');
    }
}

// Voice search functionality
let recognition = null;
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        voiceBtn.classList.remove('listening');
        searchBuses();
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('listening');
    };
}

// Event Listeners
searchBtn.addEventListener('click', searchBuses);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBuses();
    }
});

voiceBtn.addEventListener('click', () => {
    if (recognition) {
        voiceBtn.classList.add('listening');
        recognition.start();
    }
});

closeResults.addEventListener('click', hideResults);

// Close results when clicking outside
resultsSection.addEventListener('click', (e) => {
    if (e.target === resultsSection) {
        hideResults();
    }
});

// Close results when pressing Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resultsSection.classList.contains('active')) {
        hideResults();
    }
});

// Handle touch events for the results container
const resultsContainer = document.querySelector('.results-container');
let startY = 0;
let currentY = 0;

resultsContainer.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    currentY = startY;
});

resultsContainer.addEventListener('touchmove', (e) => {
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    // If scrolled to top and trying to pull down
    if (resultsContainer.scrollTop === 0 && deltaY > 0) {
        e.preventDefault();
    }
    
    // If scrolled to bottom and trying to pull up
    if ((resultsContainer.scrollHeight - resultsContainer.scrollTop === resultsContainer.clientHeight) && deltaY < 0) {
        e.preventDefault();
    }
}, { passive: false });

resultsContainer.addEventListener('touchend', (e) => {
    const deltaY = currentY - startY;
    
    // If pulled down more than 100px when at top, close the popup
    if (resultsContainer.scrollTop === 0 && deltaY > 100) {
        hideResults();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a search parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        searchInput.value = searchQuery;
        searchBuses();
    }
}); 