# BeatMaster Pro - Premium Beats & Production

## Overview

BeatMaster Pro is a music production website that serves as a platform for selling premium beats and music production services. The site features a modern, dark-themed design with a focus on showcasing beats across different genres like Trap, Afrobeat, and Drill. It includes an interactive shopping cart system, testimonials section, and contact functionality for potential clients to connect with the producer.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Pure HTML/CSS/JavaScript**: Static frontend built with vanilla web technologies without any frameworks
- **Responsive Design**: Mobile-first approach using CSS Grid and Flexbox for layout
- **Component-based Structure**: Modular sections including navigation, hero, beats showcase, testimonials, and contact
- **Interactive Elements**: Shopping cart functionality, audio players for beat previews, and testimonial sliders

### Design System
- **Color Palette**: Black primary background with crimson red (#DC143C) and peach (#FFDAB9) accents
- **Typography**: Google Fonts integration using Montserrat and Poppins font families
- **Icons**: Font Awesome integration for consistent iconography
- **Animations**: CSS transitions and transforms for smooth user interactions

### Data Management
- **Client-side Storage**: JavaScript arrays and local storage for cart management
- **Static Data Structure**: Hardcoded beats data with properties for ID, title, genre, audio source, and pricing tiers (simple, complete, VIP)

### User Interface Features
- **Navigation**: Responsive hamburger menu for mobile devices
- **Shopping Cart**: Sidebar cart with item management and total calculation
- **Audio Preview**: Beat player controls for sampling tracks
- **Contact Form**: Client inquiry form for custom work requests
- **Testimonials**: Rotating testimonial slider for social proof

## External Dependencies

### Content Delivery Networks
- **Google Fonts API**: Delivers Montserrat and Poppins font families
- **Font Awesome CDN**: Provides scalable vector icons (version 6.4.0)

### Media Assets
- **Audio Files**: External audio sources for beat previews (placeholders in current implementation)
- **Images**: Profile pictures and background images for testimonials and hero sections

### Browser APIs
- **Local Storage**: For persistent cart data across sessions
- **DOM Manipulation**: Native JavaScript for interactive functionality
- **CSS Custom Properties**: For consistent theming and color management

Note: The current implementation uses placeholder audio sources that would need to be replaced with actual beat files in a production environment.