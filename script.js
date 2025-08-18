// Global Variables
let cart = [];
let currentTestimonial = 0;

// DOM Elements
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const discoverBtn = document.getElementById('discover-btn');
const beatsBtn = document.getElementById('beats-btn');
const cartBtn = document.getElementById('cart-btn');
const cartCount = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');
const closeCart = document.getElementById('close-cart');
const cartItems = document.getElementById('cart-items');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const beatsGrid = document.getElementById('beats-grid');
const testimonialsSlider = document.getElementById('testimonials-slider');
const contactForm = document.getElementById('contact-form');

// Sample Beats Data
const beatsData = [
    {
        id: 1,
        title: "Trap King",
        genre: "Trap",
        audioSrc: "#", // In production, this would be real audio files
        prices: {
            simple: 25,
            complete: 50,
            vip: 100
        }
    },
    {
        id: 2,
        title: "Afro Vibes",
        genre: "Afrobeat",
        audioSrc: "#",
        prices: {
            simple: 30,
            complete: 60,
            vip: 120
        }
    },
    {
        id: 3,
        title: "Drill Master",
        genre: "Drill",
        audioSrc: "#",
        prices: {
            simple: 35,
            complete: 70,
            vip: 140
        }
    },
    {
        id: 4,
        title: "Urban Flow",
        genre: "Hip-Hop",
        audioSrc: "#",
        prices: {
            simple: 25,
            complete: 50,
            vip: 100
        }
    },
    {
        id: 5,
        title: "Night Rider",
        genre: "Trap",
        audioSrc: "#",
        prices: {
            simple: 40,
            complete: 80,
            vip: 160
        }
    },
    {
        id: 6,
        title: "Afro Dreams",
        genre: "Afrobeat",
        audioSrc: "#",
        prices: {
            simple: 28,
            complete: 55,
            vip: 110
        }
    }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    generateBeats();
    startTestimonialSlider();
    setupScrollEffects();
    setupSmoothScrolling();
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    hamburger.addEventListener('click', toggleMobileMenu);
    discoverBtn.addEventListener('click', () => scrollToSection('about'));
    beatsBtn.addEventListener('click', () => scrollToSection('playlist'));
    
    // Cart functionality
    cartBtn.addEventListener('click', toggleCart);
    closeCart.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
    checkoutBtn.addEventListener('click', handleCheckout);
    
    // Contact form
    contactForm.addEventListener('submit', handleContactSubmit);
    
    // Scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
            
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        });
    });
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
}

// Smooth Scrolling
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 80; // Account for navbar height
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

function setupSmoothScrolling() {
    // Add scroll behavior for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

// Scroll Effects
function handleScroll() {
    const scrollTop = window.pageYOffset;
    
    // Navbar background change
    if (scrollTop > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Animate sections on scroll
    animateOnScroll();
}

function animateOnScroll() {
    const elements = document.querySelectorAll('.beat-card, .testimonial, .contact-item');
    const windowHeight = window.innerHeight;
    
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

function setupScrollEffects() {
    // Initially hide elements that will animate
    const animatedElements = document.querySelectorAll('.beat-card, .testimonial, .contact-item');
    animatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.6s ease-out';
    });
}

// Generate Beats
function generateBeats() {
    beatsGrid.innerHTML = '';
    
    beatsData.forEach((beat, index) => {
        const beatCard = createBeatCard(beat, index);
        beatsGrid.appendChild(beatCard);
    });
}

function createBeatCard(beat, index) {
    const card = document.createElement('div');
    card.className = 'beat-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="beat-header">
            <div class="beat-icon">
                <i class="fas fa-music"></i>
            </div>
            <div class="beat-info">
                <h3>${beat.title}</h3>
                <span class="beat-genre">${beat.genre}</span>
            </div>
        </div>
        
        <div class="beat-audio">
            <audio controls>
                <source src="${beat.audioSrc}" type="audio/mpeg">
                Votre navigateur ne supporte pas l'élément audio.
            </audio>
        </div>
        
        <div class="license-selector">
            <label for="license-${beat.id}">Type de licence:</label>
            <select id="license-${beat.id}" data-beat-id="${beat.id}">
                <option value="simple">Simple - ${beat.prices.simple}€</option>
                <option value="complete">Complète - ${beat.prices.complete}€</option>
                <option value="vip">VIP - ${beat.prices.vip}€</option>
            </select>
        </div>
        
        <div class="beat-footer">
            <div class="beat-price" id="price-${beat.id}">${beat.prices.simple}€</div>
            <button class="add-to-cart-btn" data-beat-id="${beat.id}">
                <i class="fas fa-cart-plus"></i>
                Ajouter au panier
            </button>
        </div>
    `;
    
    // Add event listeners
    const licenseSelect = card.querySelector(`#license-${beat.id}`);
    const priceDisplay = card.querySelector(`#price-${beat.id}`);
    const addToCartBtn = card.querySelector('.add-to-cart-btn');
    
    licenseSelect.addEventListener('change', (e) => {
        const selectedLicense = e.target.value;
        const newPrice = beat.prices[selectedLicense];
        priceDisplay.textContent = `${newPrice}€`;
    });
    
    addToCartBtn.addEventListener('click', () => {
        addToCart(beat.id);
    });
    
    return card;
}

// Cart Functionality
function toggleCart() {
    cartSidebar.classList.toggle('active');
    cartOverlay.classList.toggle('active');
}

function addToCart(beatId) {
    const beat = beatsData.find(b => b.id === beatId);
    const licenseSelect = document.querySelector(`#license-${beatId}`);
    const selectedLicense = licenseSelect.value;
    const price = beat.prices[selectedLicense];
    
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(item => 
        item.beatId === beatId && item.license === selectedLicense
    );
    
    if (existingItemIndex > -1) {
        // Item exists, show message
        showNotification('Ce beat avec cette licence est déjà dans votre panier!', 'warning');
        return;
    }
    
    const cartItem = {
        beatId: beatId,
        title: beat.title,
        genre: beat.genre,
        license: selectedLicense,
        price: price
    };
    
    cart.push(cartItem);
    updateCartUI();
    showNotification('Beat ajouté au panier!', 'success');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    showNotification('Beat retiré du panier!', 'info');
}

function updateCartUI() {
    cartCount.textContent = cart.length;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <p>Votre panier est vide</p>
            </div>
        `;
        cartTotal.textContent = '0€';
        return;
    }
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        total += item.price;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.title}</h4>
                <p>${item.genre} - ${item.license}</p>
            </div>
            <div class="cart-item-price">${item.price}€</div>
            <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = `${total}€`;
}

function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Votre panier est vide!', 'warning');
        return;
    }
    
    // Simulate checkout process
    showNotification('Redirection vers le paiement...', 'success');
    
    // In a real application, this would redirect to a payment processor
    setTimeout(() => {
        cart = [];
        updateCartUI();
        toggleCart();
        showNotification('Merci pour votre achat! (Simulation)', 'success');
    }, 2000);
}

// Testimonials Slider
function startTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial');
    
    if (testimonials.length === 0) return;
    
    setInterval(() => {
        testimonials[currentTestimonial].classList.remove('active');
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        testimonials[currentTestimonial].classList.add('active');
    }, 5000);
}

// Contact Form
function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');
    
    // Validate form
    if (!name || !email || !message) {
        showNotification('Veuillez remplir tous les champs!', 'error');
        return;
    }
    
    // Simulate form submission
    showNotification('Message envoyé avec succès!', 'success');
    contactForm.reset();
}

// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 4000);
    
    // Manual close
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
}

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0;
        font-size: 1rem;
    }
`;

document.head.appendChild(notificationStyles);

// Performance Optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounce scroll handler for better performance
window.addEventListener('scroll', debounce(handleScroll, 10));

// Initialize fade-in animations for sections
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
document.querySelectorAll('.about, .playlist, .testimonials, .contact').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'all 0.8s ease-out';
    observer.observe(section);
});

// Preload critical resources
function preloadResources() {
    // Preload fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);
}

// Call preload on page load
window.addEventListener('load', preloadResources);

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes cart
    if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
        toggleCart();
    }
    
    // Enter key on buttons
    if (e.key === 'Enter' && e.target.tagName === 'BUTTON') {
        e.target.click();
    }
});

// Focus management for accessibility
function setupAccessibility() {
    // Trap focus in cart sidebar when open
    const focusableElements = cartSidebar.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        cartSidebar.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }
}

// Initialize accessibility features
setupAccessibility();

console.log('🎵 BeatMaster Pro - Application initialized successfully!');
