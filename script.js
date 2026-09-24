const today = new Date();
const iso = (d) => d.toISOString().split("T")[0];

const setDefaultDates = () => {
  const checkin = document.getElementById("checkin");
  const checkout = document.getElementById("checkout");
  const enqCheckin = document.getElementById("enqCheckin");
  const enqCheckout = document.getElementById("enqCheckout");

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (checkin) checkin.min = iso(today);
  if (checkout) checkout.min = iso(tomorrow);
  if (enqCheckin) enqCheckin.min = iso(today);
  if (enqCheckout) enqCheckout.min = iso(tomorrow);

  if (checkin) checkin.value = iso(today);
  if (checkout) checkout.value = iso(tomorrow);
  if (enqCheckin) enqCheckin.value = iso(today);
  if (enqCheckout) enqCheckout.value = iso(tomorrow);
};

const updateEstimate = () => {
  const roomType = document.getElementById("roomType");
  const roomCount = document.getElementById("roomCount");
  const checkin = document.getElementById("checkin");
  const checkout = document.getElementById("checkout");
  const estimate = document.getElementById("estimate");

  if (!roomType || !roomCount || !checkin || !checkout || !estimate) return;

  const rate = Number(roomType.value);
  const count = Number(roomCount.value);

  if (!checkin.value || !checkout.value) {
    estimate.textContent = `PKR ${rate.toLocaleString()}`;
    return;
  }

  const start = new Date(checkin.value);
  const end = new Date(checkout.value);

  if (end <= start) {
    estimate.textContent = `PKR ${rate.toLocaleString()}`;
    return;
  }

  const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  const total = diffDays * rate * count;
  estimate.textContent = `PKR ${total.toLocaleString()}`;
};

const handleBookingSubmit = (event) => {
  event.preventDefault();

  const roomType = document.getElementById("roomType");
  const estimate = document.getElementById("estimate");
  const selectedRoom = roomType ? roomType.options[roomType.selectedIndex].text : "Selected room";

  alert(`${selectedRoom} selected. Estimated total: ${estimate ? estimate.textContent : "PKR 0"}. We will contact you shortly to confirm your reservation.`);
};

const handleEnquirySubmit = (event) => {
  event.preventDefault();
  alert("Your enquiry has been sent successfully. Our reservation team will contact you shortly.");
  event.target.reset();
  setDefaultDates();
};

const setupMenuToggle = () => {
  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  const navActions = document.querySelector(".nav-actions");

  if (!menuButton || !nav || !navActions) return;

  menuButton.addEventListener("click", () => {
    nav.classList.toggle("mobile-open");
    navActions.classList.toggle("mobile-open");
  });
};

const setupResponsiveNav = () => {
  const nav = document.querySelector(".main-nav");
  const navActions = document.querySelector(".nav-actions");

  if (!nav || !navActions) return;

  if (window.innerWidth <= 980) {
    nav.style.display = "flex";
    nav.style.flexDirection = "column";
    nav.style.position = "absolute";
    nav.style.top = "86px";
    nav.style.left = "16px";
    nav.style.right = "16px";
    nav.style.background = "rgba(17, 24, 39, 0.96)";
    nav.style.border = "1px solid rgba(255,255,255,0.08)";
    nav.style.borderRadius = "16px";
    nav.style.padding = "16px";
    nav.style.opacity = "0";
    nav.style.pointerEvents = "none";
    navActions.style.display = "flex";
    navActions.style.position = "absolute";
    navActions.style.top = "calc(86px + 260px)";
    navActions.style.left = "16px";
    navActions.style.right = "16px";
    navActions.style.opacity = "0";
    navActions.style.pointerEvents = "none";
  } else {
    nav.style = "";
    navActions.style = "";
  }
};

window.addEventListener("DOMContentLoaded", () => {
  setDefaultDates();
  updateEstimate();
  setupMenuToggle();
  setupResponsiveNav();

  const roomType = document.getElementById("roomType");
  const roomCount = document.getElementById("roomCount");
  const checkin = document.getElementById("checkin");
  const checkout = document.getElementById("checkout");

  [roomType, roomCount, checkin, checkout].forEach((el) => {
    if (el) el.addEventListener("input", updateEstimate);
    if (el) el.addEventListener("change", updateEstimate);
  });

  const bookingForm = document.getElementById("bookingForm");
  const enquiryForm = document.getElementById("enquiryForm");

  if (bookingForm) bookingForm.addEventListener("submit", handleBookingSubmit);
  if (enquiryForm) enquiryForm.addEventListener("submit", handleEnquirySubmit);

  window.addEventListener("resize", setupResponsiveNav);
});

const nav = document.querySelector(".main-nav");
const navActions = document.querySelector(".nav-actions");
const menuButton = document.querySelector(".menu-toggle");

if (nav && navActions && menuButton) {
  menuButton.addEventListener("click", () => {
    const isOpen = nav.style.opacity === "1";
    nav.style.opacity = isOpen ? "0" : "1";
    nav.style.pointerEvents = isOpen ? "none" : "auto";
    navActions.style.opacity = isOpen ? "0" : "1";
    navActions.style.pointerEvents = isOpen ? "none" : "auto";
  });
}
