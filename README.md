# Havenstay frontend

Angular frontend for the homestay marketplace. It includes guest discovery and booking, the host studio, and an admin console.

## Run locally

1. Start PostgreSQL and the matching `homestay-backend` first. Set the backend database and Razorpay test credentials as described in the backend README.
2. Open PowerShell in this folder and run:

```powershell
npm install
npm start
```

3. Visit `http://localhost:4200`. The API URL is configured in `src/app/core/config.ts` and defaults to `http://localhost:8080/api`.

## Accounts and workflows

- Create a **Guest** account to search stays, see nearby suggestions, make a booking, pay in Razorpay Checkout, track/cancel trips, and contact support.
- Create a **Host** account to add a stay, upload images, set available dates, and view guest bookings. New or edited listings wait for host verification and admin approval before going live.
- Sign in with an **Admin** account created by the backend seeder or another admin. The admin workspace reviews listings and photos, manages users/hosts/bookings/support, controls commissions, and edits destinations/amenities.

Razorpay Checkout needs valid test keys in the backend. For browser-based payment testing, run both applications locally with the backend configured for those keys.
