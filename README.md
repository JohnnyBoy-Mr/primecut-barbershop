# Prime Cut Barber Studio — Website

A responsive, single-page barber shop website built with plain HTML, CSS and JavaScript. No npm or framework is required.

## Included

- Strong hero section with prominent booking CTA
- Services and pricing cards
- About/story section
- Professional barber imagery
- Gallery/vibe section
- Booking form with validation and localStorage confirmation
- Contact details and click-to-call/email links
- Mobile navigation
- Responsive layout

## Run locally

Open `index.html` directly in a browser, or use VS Code Live Server.

## Make bookings real

The current booking form is a front-end demo: submissions are saved to the visitor's browser using `localStorage`.

For production, replace the submit handler in `script.js` with a POST request to your backend, or connect the form to a service such as Formspree/Netlify Forms/your preferred booking platform.

## Replace business details

Search in `index.html` for:

- Prime Cut Barber Studio
- 123 Main Road
- +27 72 123 4567
- hello@primecut.co.za
- Service names and prices

## Images

The demo uses remote Pexels images so the package stays lightweight. Replace the image URLs with your own licensed/local images for the final business website.

## Suggested production improvements

1. Connect the booking form to a real booking/calendar system.
2. Add the real shop address and Google Maps embed.
3. Replace stock imagery with the shop's own photography.
4. Add the real Instagram/TikTok links.
5. Add a backend/database if the shop needs appointment management.


## Calendar integration

Confirmed bookings now include two calendar actions:

- **Google Calendar** opens a pre-filled Google Calendar event using the customer's selected service, barber, date, time, service duration, booking reference, notes and shop location.
- **Apple / Calendar** downloads a standards-based `.ics` event that can be opened by Apple Calendar and other calendar applications.

The calendar event is generated from the actual booking submitted by the customer; there is no hard-coded appointment date or time. The shop timezone is `Africa/Johannesburg`.

## Terms & Conditions
A complete `terms.html` legal page is included and linked from the website footer. It covers appointments and availability, cancellations/rescheduling, pricing, discounts, barber selection, customer information, calendar links, the browser-local demo booking limitation, website use, liability, updates and contact information.
