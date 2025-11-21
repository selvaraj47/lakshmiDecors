// Search functionality
let allEventsData = null;
let currentCategory = 'all';

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Only run on events page
    if (!document.getElementById('searchInput')) return;

    // Load events data
    allEventsData = await window.loadEventsData();
    if (!allEventsData) return;

    // Get initial category from URL or filter button
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
    } else {
        const activeFilter = document.querySelector('.filter-btn.active');
        if (activeFilter) {
            currentCategory = activeFilter.dataset.category || 'all';
        }
    }

    // Setup search input
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');

    if (searchInput) {
        // Real-time search
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.trim().toLowerCase();
            
            if (searchTerm.length > 0) {
                clearSearchBtn.style.display = 'block';
                performSearch(searchTerm);
            } else {
                clearSearchBtn.style.display = 'none';
                // Reload events for current category
                if (window.loadAllEvents) {
                    window.loadAllEvents(allEventsData.events, currentCategory);
                }
            }
        });

        // Search on Enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const searchTerm = this.value.trim().toLowerCase();
                if (searchTerm.length > 0) {
                    performSearch(searchTerm);
                }
            }
        });
    }

    // Clear search button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            // Reload events for current category
            if (window.loadAllEvents) {
                window.loadAllEvents(allEventsData.events, currentCategory);
            }
        });
    }

    // Update current category when filter changes
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentCategory = this.dataset.category || 'all';
            // Clear search if active
            if (searchInput && searchInput.value.trim()) {
                searchInput.value = '';
                clearSearchBtn.style.display = 'none';
            }
        });
    });
});

// Perform search across all events
function performSearch(searchTerm) {
    if (!allEventsData || !allEventsData.events) return;

    const eventsGrid = document.getElementById('eventsGrid');
    const noResults = document.getElementById('noResults');
    
    if (!eventsGrid) return;

    // Get all events
    let allEvents = [];
    Object.keys(allEventsData.events).forEach(category => {
        allEventsData.events[category].forEach(event => {
            allEvents.push(event);
        });
    });

    // Filter events based on search term
    const searchResults = allEvents.filter(event => {
        const titleMatch = event.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = event.description.toLowerCase().includes(searchTerm);
        const categoryMatch = window.formatCategoryName(event.category).toLowerCase().includes(searchTerm);
        
        return titleMatch || descriptionMatch || categoryMatch;
    });

    // Display results
    displaySearchResults(searchResults, searchTerm);

    // Show/hide no results message
    if (noResults) {
        noResults.style.display = searchResults.length === 0 ? 'block' : 'none';
    }
}

// Display search results
function displaySearchResults(events, searchTerm) {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    if (events.length === 0) {
        return;
    }

    events.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.category = event.category;
        
        // Store event data for modal
        card.dataset.eventId = event.id;
        card.dataset.eventTitle = event.title;
        card.dataset.eventDescription = event.description;
        card.dataset.eventImages = JSON.stringify(event.images || [event.image]);
        
        // Highlight search term in title and description
        const highlightedTitle = highlightText(event.title, searchTerm);
        const highlightedDescription = highlightText(event.description, searchTerm);
        
        card.innerHTML = `
            <img src="${event.image}" alt="${event.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22250%22%3E%3Crect fill=%22%23d4af37%22 width=%22300%22 height=%22250%22/%3E%3Ctext fill=%22%23fff%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${encodeURIComponent(event.title)}%3C/text%3E%3C/svg%3E'">
            <div class="event-card-content">
                <h3>${highlightedTitle}</h3>
                <p>${highlightedDescription}</p>
                <span class="event-category-badge">${window.formatCategoryName(event.category)}</span>
            </div>
        `;
        
        // Add click handler to show modal
        card.addEventListener('click', function() {
            const images = JSON.parse(this.dataset.eventImages || '[]');
            if (window.showImageModal) {
                window.showImageModal(this.dataset.eventTitle, this.dataset.eventDescription, images);
            }
        });
        
        eventsGrid.appendChild(card);
    });
}

// Highlight search term in text
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark style="background-color: #ffeb3b; padding: 2px 4px; border-radius: 3px;">$1</mark>');
}

// Escape special regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

