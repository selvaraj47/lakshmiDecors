// Load events data
let eventsData = null;

// Fetch events data
async function loadEventsData() {
    try {
        const response = await fetch('data/events.json');
        eventsData = await response.json();
        return eventsData;
    } catch (error) {
        console.error('Error loading events data:', error);
        return null;
    }
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
            // Prevent body scroll when menu is open
            if (navMenu.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });

        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-menu a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.style.overflow = '';
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Load content based on page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (currentPage === 'index.html' || currentPage === '' || currentPage === 'index.html') {
        loadHomePageContent();
    } else if (currentPage === 'events.html') {
        loadEventsPage();
    }
});

// Load home page content
async function loadHomePageContent() {
    const data = await loadEventsData();
    if (!data) return;

    // Load entertainment services
    loadEntertainmentServices(data.entertainment);

    // Load reviews
    loadReviews(data.reviews);
}

// Load entertainment services
function loadEntertainmentServices(entertainment) {
    const entertainmentGrid = document.getElementById('entertainmentGrid');
    if (!entertainmentGrid) return;

    entertainmentGrid.innerHTML = '';

    entertainment.forEach(item => {
        const card = document.createElement('div');
        card.className = 'entertainment-card';
        card.innerHTML = `
            <div class="entertainment-icon">${item.icon}</div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
        `;
        entertainmentGrid.appendChild(card);
    });
}

// Load reviews
function loadReviews(reviews) {
    const reviewsGrid = document.getElementById('reviewsGrid');
    if (!reviewsGrid) return;

    reviewsGrid.innerHTML = '';

    // Show first 6 reviews
    const displayReviews = reviews.slice(0, 6);

    displayReviews.forEach(review => {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        // Create star rating
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        card.innerHTML = `
            <div class="review-header">
                <div class="review-name">${review.name}</div>
                <div class="review-rating">${stars}</div>
            </div>
            <p class="review-comment">"${review.comment}"</p>
            <div class="review-event">Event: ${review.event}</div>
        `;
        reviewsGrid.appendChild(card);
    });
}

// Load events page
async function loadEventsPage() {
    const data = await loadEventsData();
    if (!data) return;

    // Check for category filter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    
    // Set active filter button
    if (categoryParam) {
        const filterBtn = document.querySelector(`[data-category="${categoryParam}"]`);
        if (filterBtn) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            filterBtn.classList.add('active');
        }
    }

    // Load all events
    loadAllEvents(data.events, categoryParam || 'all');

    // Setup filter buttons
    setupFilterButtons(data.events);

    // Setup search (handled by search.js)
}

// Load all events
function loadAllEvents(events, category = 'all') {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '';

    let allEvents = [];
    
    // Combine all events from all categories
    Object.keys(events).forEach(cat => {
        events[cat].forEach(event => {
            allEvents.push(event);
        });
    });

    // Filter by category if specified
    let filteredEvents = allEvents;
    if (category !== 'all') {
        filteredEvents = allEvents.filter(event => event.category === category);
    }

    if (filteredEvents.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        return;
    }

    document.getElementById('noResults').style.display = 'none';

    filteredEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.dataset.category = event.category;
        card.dataset.title = event.title.toLowerCase();
        card.dataset.description = event.description.toLowerCase();
        
        // Store event data for modal
        card.dataset.eventId = event.id;
        card.dataset.eventTitle = event.title;
        card.dataset.eventDescription = event.description;
        card.dataset.eventImages = JSON.stringify(event.images || [event.image]);
        
        card.innerHTML = `
            <img src="${event.image}" alt="${event.title}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22250%22%3E%3Crect fill=%22%23d4af37%22 width=%22300%22 height=%22250%22/%3E%3Ctext fill=%22%23fff%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${encodeURIComponent(event.title)}%3C/text%3E%3C/svg%3E'">
            <div class="event-card-content">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <span class="event-category-badge">${formatCategoryName(event.category)}</span>
            </div>
        `;
        
        // Add click handler to show modal
        card.addEventListener('click', function() {
            const images = JSON.parse(this.dataset.eventImages || '[]');
            showImageModal(this.dataset.eventTitle, this.dataset.eventDescription, images);
        });
        
        eventsGrid.appendChild(card);
    });
}

// Format category name
function formatCategoryName(category) {
    const names = {
        'birthday': 'Birthday',
        'marriage': 'Marriage',
        'baby-shower': 'Baby Shower',
        'festivals': 'Festivals',
        'outdoor': 'Outdoor'
    };
    return names[category] || category;
}

// Setup filter buttons
function setupFilterButtons(events) {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get category
            const category = this.dataset.category;
            
            // Load events for selected category
            loadAllEvents(events, category);
            
            // Clear search
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = '';
            }
            
            // Clear URL parameter
            if (category === 'all') {
                window.history.pushState({}, '', 'events.html');
            } else {
                window.history.pushState({}, '', `events.html?category=${category}`);
            }
        });
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#!') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Image Modal Functions
function showImageModal(title, description, images) {
    const modal = document.getElementById('imageModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalGallery = document.getElementById('modalGallery');
    
    if (!modal || !modalTitle || !modalDescription || !modalGallery) return;
    
    // Set title and description
    modalTitle.textContent = title;
    modalDescription.textContent = description;
    
    // Clear previous images
    modalGallery.innerHTML = '';
    
    // Add images to gallery
    if (images && images.length > 0) {
        images.forEach((imageUrl, index) => {
            const galleryItem = document.createElement('div');
            galleryItem.className = 'modal-gallery-item';
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = `${title} - Image ${index + 1}`;
            img.onerror = function() {
                // Fallback if image doesn't exist
                this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22187%22%3E%3Crect fill=%22%23d4af37%22 width=%22250%22 height=%22187%22/%3E%3Ctext fill=%22%23fff%22 font-family=%22Arial%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage%20Not%20Available%3C/text%3E%3C/svg%3E';
            };
            
            galleryItem.appendChild(img);
            modalGallery.appendChild(galleryItem);
        });
    } else {
        modalGallery.innerHTML = '<p style="text-align: center; color: var(--text-light);">No images available for this event.</p>';
    }
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Initialize modal close handlers
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const closeBtn = document.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeImageModal);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeImageModal();
            }
        });
    }
    
    // Close modal on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });
});

// Export functions for use in search.js
window.loadAllEvents = loadAllEvents;
window.loadEventsData = loadEventsData;
window.formatCategoryName = formatCategoryName;
window.showImageModal = showImageModal;

