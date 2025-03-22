// DOM Elements
const busGrid = document.getElementById('busGrid');
const busModal = document.getElementById('busModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');
const busSearch = document.getElementById('busSearch');

let allBuses = []; // Store all buses for filtering

// Generate random color for bus profile pictures
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
        '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Create bus card
function createBusCard(bus) {
    const card = document.createElement('div');
    card.className = 'bus-card';
    
    // Create profile picture with bus image
    const profilePic = document.createElement('div');
    profilePic.className = 'bus-profile-pic';
    profilePic.style.backgroundImage = `url('${bus.image}')`;
    profilePic.innerHTML = `<span>${bus.number}</span>`;
    
    // Create bus info
    const busInfo = document.createElement('div');
    busInfo.className = 'bus-info';
    busInfo.innerHTML = `
        <h3>Bus ${bus.number}</h3>
        <p>${bus.name}</p>
        <div class="bus-meta">
            <span><i class="fas fa-clock"></i> ${bus.frequency}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${bus.stops.length} stops</span>
        </div>
    `;
    
    // Add click event to the entire card
    card.addEventListener('click', () => showBusDetails(bus));
    
    card.appendChild(profilePic);
    card.appendChild(busInfo);
    return card;
}

// Show bus details in modal
function showBusDetails(bus) {
    modalBody.innerHTML = `
        <div class="bus-details">
            <div class="bus-header">
                <div class="bus-profile-pic large" style="background-image: url('${bus.image}')">
                    <span>${bus.number}</span>
                </div>
                <div class="bus-title">
                    <h3>Bus ${bus.number}</h3>
                    <p>${bus.name}</p>
                </div>
            </div>
            
            <div class="bus-schedule">
                <h4><i class="fas fa-clock"></i> Schedule</h4>
                <div class="schedule-grid">
                    <div class="schedule-item">
                        <span class="label">First Bus</span>
                        <span class="value">${bus.firstBus}</span>
                    </div>
                    <div class="schedule-item">
                        <span class="label">Last Bus</span>
                        <span class="value">${bus.lastBus}</span>
                    </div>
                    <div class="schedule-item">
                        <span class="label">Frequency</span>
                        <span class="value">${bus.frequency}</span>
                    </div>
                </div>
            </div>
            
            <div class="bus-stops">
                <h4><i class="fas fa-map-marker-alt"></i> Bus Stops</h4>
                <div class="stops-list">
                    ${bus.stops.map((stop, index) => `
                        <div class="stop-item">
                            <div class="stop-number">${index + 1}</div>
                            <div class="stop-name">${stop}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="bus-actions">
                <button class="feature-btn save-route" onclick="saveRoute('${bus.number}')">
                    <i class="fas fa-star"></i> Save Route
                </button>
            </div>
        </div>
    `;
    
    showModal();
}

// Save route to favorites
function saveRoute(busNumber) {
    let favorites = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
    
    if (favorites.includes(busNumber)) {
        favorites = favorites.filter(route => route !== busNumber);
        localStorage.setItem('favoriteRoutes', JSON.stringify(favorites));
    } else {
        favorites.push(busNumber);
        localStorage.setItem('favoriteRoutes', JSON.stringify(favorites));
    }
}

// Filter buses based on search term
function filterBuses(searchTerm) {
    const filteredBuses = allBuses.filter(bus => {
        const searchLower = searchTerm.toLowerCase();
        return (
            bus.name.toLowerCase().includes(searchLower) ||
            bus.number.toLowerCase().includes(searchLower) ||
            bus.stops.some(stop => stop.toLowerCase().includes(searchLower))
        );
    });

    // Clear existing content
    busGrid.innerHTML = '';

    if (filteredBuses.length === 0) {
        busGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No buses found matching "${searchTerm}"</p>
            </div>
        `;
        return;
    }

    // Add filtered bus cards
    filteredBuses.forEach(bus => {
        const card = createBusCard(bus);
        busGrid.appendChild(card);
    });
}

// Show modal
function showModal() {
    busModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Hide modal
function hideModal() {
    busModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Event Listeners
closeModal.addEventListener('click', hideModal);

busModal.addEventListener('click', (e) => {
    if (e.target === busModal) {
        hideModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (busModal.classList.contains('active')) {
            hideModal();
        }
    }
});

// Search input event listener
busSearch.addEventListener('input', (e) => {
    filterBuses(e.target.value);
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        
        // Store all buses for filtering
        allBuses = data.routes;
        
        // Clear existing content
        busGrid.innerHTML = '';
        
        // Add bus cards
        allBuses.forEach(bus => {
            const card = createBusCard(bus);
            busGrid.appendChild(card);
        });

        // Check URL parameters for bus details
        const urlParams = new URLSearchParams(window.location.search);
        const busNumber = urlParams.get('bus');
        const showModal = urlParams.get('showModal') === 'true';

        if (busNumber && showModal) {
            const bus = allBuses.find(b => b.number === busNumber);
            if (bus) {
                showBusDetails(bus);
            }
        }
    } catch (error) {
        console.error('Error loading bus data:', error);
        busGrid.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading bus data. Please try again later.</p>
            </div>
        `;
    }
}); 