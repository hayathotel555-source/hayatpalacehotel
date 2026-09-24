# Hayat Palace Hotel

Premium multi-page hotel website with an Express reservation API, PostgreSQL persistence, admin dashboard, and optional email alerts.

## Deployment recommendation

Use **Vercel** for this project. GitHub Pages can host only the static HTML/CSS/JS and cannot run the Express API, database writes, admin login, or email service.

1. Create a PostgreSQL database on Neon, Supabase, or another managed provider.
2. Import this repository into Vercel.
3. Add the variables from `.env.example` in Vercel Project Settings.
4. Deploy. `vercel.json` routes requests to the Express API.
5. Open `/admin.html` for booking management.

Required variables:
- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`

Optional email alerts require `BOOKING_ALERT_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `SMTP_FROM`.

## Local development

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`. The database table is created automatically on startup when `DATABASE_URL` is available.

## Booking API

- `POST /api/bookings` creates a reservation enquiry
- `GET /api/bookings/:reference` retrieves a booking
- `POST /api/admin/login` returns an admin token
- `GET /api/admin/bookings` lists bookings for authenticated admins
- `PATCH /api/admin/bookings/:reference` changes a booking status
- `GET /api/health` checks API/database configuration

WhatsApp is provided as a direct customer contact link. Automated WhatsApp notifications require a Meta WhatsApp Cloud API or Twilio account and credentials; those are intentionally not hard-coded into the repository.
