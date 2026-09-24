const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const dataDirectory = path.join(__dirname, "data");
const bookingsFile = path.join(dataDirectory, "bookings.json");

if (!fs.existsSync(dataDirectory)) fs.mkdirSync(dataDirectory, { recursive: true });
if (!fs.existsSync(bookingsFile)) fs.writeFileSync(bookingsFile, "[]");

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const readBookings = () => JSON.parse(fs.readFileSync(bookingsFile, "utf8"));
const writeBookings = (bookings) => fs.writeFileSync(bookingsFile, JSON.stringify(bookings, null, 2));
const reference = () => `HPH-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "hayat-palace-bookings" });
});

app.post("/api/bookings", (req, res) => {
  const { name, phone, email = "", checkin, checkout, room, rooms = 1, guests = 2, message = "" } = req.body;

  if (!name || !phone || !checkin || !checkout || !room) {
    return res.status(400).json({ error: "Name, phone, dates, and room type are required." });
  }

  const arrival = new Date(checkin);
  const departure = new Date(checkout);
  if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime()) || departure <= arrival) {
    return res.status(400).json({ error: "Check-out must be after check-in." });
  }

  const nights = Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24));
  const prices = { "Standard Room": 4500, "Deluxe Room": 5500, "Executive Room": 6500 };
  const rate = prices[room] || 5500;
  const total = nights * rate * Number(rooms || 1);
  const booking = {
    reference: reference(),
    name: String(name).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    checkin,
    checkout,
    room,
    rooms: Number(rooms),
    guests: Number(guests),
    message: String(message).trim(),
    nights,
    estimatedTotal: total,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  const bookings = readBookings();
  bookings.push(booking);
  writeBookings(bookings);
  return res.status(201).json({ message: "Booking enquiry received.", booking });
});

app.get("/api/bookings/:bookingReference", (req, res) => {
  const booking = readBookings().find((item) => item.reference === req.params.bookingReference);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  return res.json({ booking });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Hayat Palace Hotel is running at http://localhost:${PORT}`);
});
