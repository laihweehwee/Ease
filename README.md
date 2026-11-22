# Ease Babysitter

A modern, responsive web application for finding, vetting, and booking certified local babysitters.

## Features
- **Instant Caregiver Search**: Filter by care type (Date Night, After School, Infant & Toddler, Overnight).
- **Vetted Caregiver Profiles**: View ratings, badges (CPR certified, Early Childhood Education, clean driving record), and hourly rates.
- **Interactive Booking Request Flow**: Modal booking form with live validation and confirmation.
- **FAQ Accordion & Testimonials**: Built-in parent reviews and expandable Q&A.
- **Zero-Dependency Live Dev Server**: Built-in hot reload via Server-Sent Events (SSE).
-  **Responsive Landing Page**: Introduces Ease and provides separate entry points for parents looking for childcare and babysitters looking to join. Visitors can search by postcode without creating an account.
- **Login and Role-Based Sign-Up**: Returning users can log in. New users choose Parent or Babysitter to open the corresponding registration form. The prototype simulates the email verification step.
- **Parent Profile**: Parents can view and edit their personal details and number of children, and see their booking history.
  

## Quick Start (For Group Members)

1. Ensure [Node.js](https://nodejs.org) (v18+) is installed.
2. Start the local live-reloading dev server:
   ```bash
   node dev-server.mjs
   ```
   Or:
   ```bash
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Any changes to `index.html`, `styles.css`, or `main.js` will automatically reload the page in real-time!
