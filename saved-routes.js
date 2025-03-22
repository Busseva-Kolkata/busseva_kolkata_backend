// DOM Elements
const savedRoutesGrid = document.getElementById('savedRoutesGrid');
const noSavedRoutes = document.getElementById('noSavedRoutes');
const busModal = document.getElementById('busModal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

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
    if (e.key === 'Escape' && busModal.classList.contains('active')) {
        hideModal();
    }
});

// Fetch bus data
async function fetchBusData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        return data.routes;
    } catch (error) {
        console.error('Error fetching bus data:', error);
        return [];
    }
}

// Get saved routes from localStorage
function getSavedRoutes() {
    return JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
}

// Show bus details in modal
async function showBusDetails(busNumber) {
    try {
        const allBuses = await fetchBusData();
        const bus = allBuses.find(b => b.number === busNumber);
        
        if (!bus) {
            console.error('Bus not found:', busNumber);
            return;
        }

        modalBody.innerHTML = `
            <div class="bus-details">
                <div class="bus-header">
                    <div class="bus-profile-pic large" style="background-image: url('${bus.image || `https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=500`}')">
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
                    <button class="feature-btn save-route" onclick="removeRoute('${bus.number}')">
                        <i class="fas fa-trash"></i> Remove from Saved Routes
                    </button>
                    <button class="feature-btn share-btn" onclick="shareRoute('${bus.number}')">
                        <i class="fas fa-share"></i> Share Route
                    </button>
                </div>
            </div>
        `;
        
        showModal();
    } catch (error) {
        console.error('Error showing bus details:', error);
        alert('Unable to load bus details. Please try again later.');
    }
}

// Create saved route card
function createSavedRouteCard(bus) {
    return `
        <div class="bus-card">
            <div class="bus-profile-pic" style="background-image: url('${bus.image || `https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=500`}')">
                <span>${bus.number}</span>
            </div>
            <div class="bus-info">
                <h3>Bus ${bus.number}</h3>
                <p>${bus.name}</p>
                <div class="bus-meta">
                    <span><i class="fas fa-clock"></i> ${bus.frequency}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${bus.stops.length} stops</span>
                </div>
                <div class="bus-actions">
                    <button class="feature-btn view-route" onclick="showBusDetails('${bus.number}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="feature-btn remove-btn" onclick="removeRoute('${bus.number}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                    <button class="feature-btn share-btn" onclick="shareRoute('${bus.number}')">
                        <i class="fas fa-share"></i> Share
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Display saved routes
async function displaySavedRoutes() {
 const savedRoutes = getSavedRoutes();
 const allBuses = await fetchBusData();

 if (savedRoutes.length === 0) {
  savedRoutesGrid.classList.add('hidden');
  noSavedRoutes.classList.remove('hidden');
  return;
 }

 const savedBuses = allBuses.filter(bus => savedRoutes.includes(bus.number));

 if (savedBuses.length === 0) {
  savedRoutesGrid.classList.add('hidden');
  noSavedRoutes.classList.remove('hidden');
  return;
 }

 savedRoutesGrid.classList.remove('hidden');
 noSavedRoutes.classList.add('hidden');
 savedRoutesGrid.innerHTML = savedBuses.map(createSavedRouteCard).join('');
}

// Remove route from favorites
async function removeRoute(busNumber) {
    let favorites = getSavedRoutes();
    favorites = favorites.filter(route => route !== busNumber);
    localStorage.setItem('favoriteRoutes', JSON.stringify(favorites));
    
    // Hide modal if it's open
    if (busModal.classList.contains('active')) {
        hideModal();
    }
    
    // Clear the grid first
    savedRoutesGrid.innerHTML = '';
    
    // If no routes left, show the no routes message
    if (favorites.length === 0) {
        savedRoutesGrid.classList.add('hidden');
        noSavedRoutes.classList.remove('hidden');
        return;
    }
    
    // Update the UI with remaining routes
    const allBuses = await fetchBusData();
    const savedBuses = allBuses.filter(bus => favorites.includes(bus.number));
    savedRoutesGrid.classList.remove('hidden');
    noSavedRoutes.classList.add('hidden');
    savedRoutesGrid.innerHTML = savedBuses.map(createSavedRouteCard).join('');
}

// Share route
async function shareRoute(busNumber) {
    try {
        // Fetch bus data
        const allBuses = await fetchBusData();
        const bus = allBuses.find(b => b.number === busNumber);
        
        if (!bus) {
            console.error('Bus not found:', busNumber);
            alert('Unable to find bus information. Please try again later.');
            return;
        }

        // Create share text
        const shareText = `Bus ${bus.number}: ${bus.name}\n\n` +
            `Route: ${bus.stops.join(' → ')}\n` +
            `Frequency: ${bus.frequency}\n` +
            `First Bus: ${bus.firstBus}\n` +
            `Last Bus: ${bus.lastBus}\n\n` +
            `View more details at: ${window.location.origin}/bus-list.html?bus=${bus.number}`;

        // Check if Web Share API is available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Bus ${bus.number} Route`,
                    text: shareText,
                    url: `${window.location.origin}/bus-list.html?bus=${bus.number}`
                });
            } catch (error) {
                if (error.name !== 'AbortError') {
                    fallbackShare(shareText);
                }
            }
        } else {
            fallbackShare(shareText);
        }
    } catch (error) {
        console.error('Error sharing route:', error);
        alert('Unable to share route. Please try again later.');
    }
}

// Fallback share method
function fallbackShare(shareText) {
    try {
        // Create a temporary textarea element
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        
        // Select and copy the text
        textarea.select();
        document.execCommand('copy');
        
        // Remove the temporary textarea
        document.body.removeChild(textarea);
        
        // Show success message
        alert('Route details copied to clipboard! You can now paste and share it.');
    } catch (error) {
        console.error('Error in fallback share:', error);
        alert('Unable to copy route details. Please try again later.');
    }
}

// Initial display
displaySavedRoutes(); 