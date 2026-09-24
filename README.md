# Hayat Palace Hotel

Premium multi-page hotel website with a small Express reservation backend.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Reservations are saved in `data/bookings.json`. The `data/` directory is created automatically on first run.

## API

- `POST /api/bookings` creates a booking enquiry
- `GET /api/bookings/:reference` retrieves a booking by reference
- `GET /api/health` checks the server

For production, replace the JSON store with a managed database and add authentication before exposing the admin functionality.
