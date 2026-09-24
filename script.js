const today = new Date();
const iso = (date) => date.toISOString().split("T")[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const setDefaultDates = () => {
  document.querySelectorAll('input[type="date"]').forEach((input) => {
    input.min = iso(today);
    if (!input.value) input.value = input.id.toLowerCase().includes("checkout") ? iso(tomorrow) : iso(today);
  });
};

const updateEstimate = () => {
  const room = document.getElementById("roomType");
  const rooms = document.getElementById("roomCount");
  const checkin = document.getElementById("checkin");
  const checkout = document.getElementById("checkout");
  const estimate = document.getElementById("estimate");
  if (!room || !rooms || !checkin || !checkout || !estimate) return;

  const start = new Date(checkin.value);
  const end = new Date(checkout.value);
  const nights = end > start ? Math.ceil((end - start) / 86400000) : 1;
  estimate.textContent = `PKR ${(Number(room.value) * Number(rooms.value) * nights).toLocaleString()}`;
};

const submitBooking = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button[type=submit]");
  const payload = {
    name: form.querySelector("#guestName, #name")?.value,
    phone: form.querySelector("#guestPhone, #phone")?.value,
    email: form.querySelector("#guestEmail, #email")?.value || "",
    checkin: form.querySelector("#checkin, #enqCheckin")?.value,
    checkout: form.querySelector("#checkout, #enqCheckout")?.value,
    room: form.querySelector("#roomType")?.selectedOptions[0]?.text.split(" —")[0] || form.querySelector("#enqRoom")?.value,
    rooms: form.querySelector("#roomCount")?.value || 1,
    guests: form.querySelector("#guests")?.value || 2,
    message: form.querySelector("#guestMessage, #message")?.value || ""
  };

  button.disabled = true;
  button.textContent = "Sending...";
  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Unable to submit booking.");
    alert(`Thank you, ${result.booking.name}. Your reservation reference is ${result.booking.reference}. Our team will contact you shortly.`);
    form.reset();
    setDefaultDates();
    updateEstimate();
  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Send Enquiry";
  }
};

const setupMobileMenu = () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("is-open"));
};

document.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  updateEstimate();
  setupMobileMenu();
  ["roomType", "roomCount", "checkin", "checkout"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", updateEstimate);
  });
  document.querySelectorAll("#bookingForm, #enquiryForm, .booking-page-form").forEach((form) => {
    form.addEventListener("submit", submitBooking);
  });
});
