const express = require("express");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET || "change-this-secret-before-production";
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: isProduction ? { rejectUnauthorized: false } : false })
  : null;

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const prices = { "Standard Room": 4500, "Deluxe Room": 5500, "Executive Room": 6500 };
const reference = () => `HPH-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

async function initialiseDatabase() {
  if (!pool) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS bookings (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(160),
    checkin DATE NOT NULL,
    checkout DATE NOT NULL,
    room VARCHAR(40) NOT NULL,
    rooms INTEGER NOT NULL DEFAULT 1,
    guests INTEGER NOT NULL DEFAULT 2,
    message TEXT,
    nights INTEGER NOT NULL,
    estimated_total INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.adminToken;
  try {
    req.admin = jwt.verify(token, jwtSecret);
    next();
  } catch {
    res.status(401).json({ error: "Admin authentication required." });
  }
}

async function notify(booking) {
  const recipients = process.env.BOOKING_ALERT_EMAIL;
  if (recipients && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients,
      subject: `New booking enquiry ${booking.reference}`,
      text: `${booking.name} requested ${booking.room} from ${booking.checkin} to ${booking.checkout}. Phone: ${booking.phone}`
    });
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true, database: Boolean(pool) }));

app.post("/api/bookings", async (req, res) => {
  try {
    const { name, phone, email = "", checkin, checkout, room, rooms = 1, guests = 2, message = "" } = req.body;
    if (!name || !phone || !checkin || !checkout || !room) return res.status(400).json({ error: "Name, phone, dates, and room type are required." });
    const arrival = new Date(checkin);
    const departure = new Date(checkout);
    if (Number.isNaN(arrival.getTime()) || Number.isNaN(departure.getTime()) || departure <= arrival) return res.status(400).json({ error: "Check-out must be after check-in." });
    const nights = Math.ceil((departure - arrival) / 86400000);
    const safeRooms = Math.max(1, Number(rooms));
    const booking = { reference: reference(), name: String(name).trim(), phone: String(phone).trim(), email: String(email).trim(), checkin, checkout, room, rooms: safeRooms, guests: Number(guests) || 2, message: String(message).trim(), nights, estimatedTotal: nights * (prices[room] || 5500) * safeRooms, status: "pending" };

    if (!pool) return res.status(503).json({ error: "Booking service is not configured. Set DATABASE_URL on the server." });
    await pool.query(`INSERT INTO bookings (reference,name,phone,email,checkin,checkout,room,rooms,guests,message,nights,estimated_total,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [booking.reference, booking.name, booking.phone, booking.email, booking.checkin, booking.checkout, booking.room, booking.rooms, booking.guests, booking.message, booking.nights, booking.estimatedTotal, booking.status]);
    notify(booking).catch((error) => console.error("Notification failed:", error.message));
    res.status(201).json({ message: "Booking enquiry received.", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to save booking." });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const hash = process.env.ADMIN_PASSWORD_HASH;
  const valid = username === expectedUser && hash && await bcrypt.compare(password || "", hash);
  if (!valid) return res.status(401).json({ error: "Invalid admin credentials." });
  res.json({ token: jwt.sign({ username, role: "admin" }, jwtSecret, { expiresIn: "8h" }) });
});

app.get("/api/admin/bookings", requireAdmin, async (_req, res) => {
  if (!pool) return res.status(503).json({ error: "DATABASE_URL is not configured." });
  const { rows } = await pool.query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 500");
  res.json({ bookings: rows });
});

app.patch("/api/admin/bookings/:reference", requireAdmin, async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DATABASE_URL is not configured." });
  const allowed = ["pending", "confirmed", "cancelled", "completed"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid booking status." });
  const { rows } = await pool.query("UPDATE bookings SET status=$1 WHERE reference=$2 RETURNING *", [req.body.status, req.params.reference]);
  if (!rows[0]) return res.status(404).json({ error: "Booking not found." });
  res.json({ booking: rows[0] });
});

app.get("/api/bookings/:bookingReference", async (req, res) => {
  if (!pool) return res.status(503).json({ error: "DATABASE_URL is not configured." });
  const { rows } = await pool.query("SELECT * FROM bookings WHERE reference=$1", [req.params.bookingReference]);
  if (!rows[0]) return res.status(404).json({ error: "Booking not found." });
  res.json({ booking: rows[0] });
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "index.html")));

if (require.main === module) {
  initialiseDatabase().then(() => app.listen(PORT, () => console.log(`Hayat Palace Hotel running on port ${PORT}`))).catch((error) => { console.error(error); process.exit(1); });
}

module.exports = app;
