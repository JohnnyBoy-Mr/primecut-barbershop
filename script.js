const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuToggle?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', () => nav.classList.remove('open'));
});

const dateInput = document.getElementById('dateInput');
const barberSelect = document.getElementById('barberSelect');
const timeSelect = document.getElementById('timeSelect');
const serviceSelect = document.getElementById('serviceSelect');
const form = document.getElementById('bookingForm');
const success = document.getElementById('successMessage');
const confirmation = document.getElementById('bookingConfirmation');
const calendarActions = document.getElementById('calendarActions');
const googleCalendarBtn = document.getElementById('googleCalendarBtn');
const icsCalendarBtn = document.getElementById('icsCalendarBtn');

const barbers = {
  Alex: { role: 'Senior Barber' },
  Marcus: { role: 'Fade Specialist' },
  Liam: { role: 'Grooming Specialist' }
};

const services = {
  'Skin Fade': { duration: 45, price: 250 },
  'Classic Cut': { duration: 35, price: 220 },
  'Beard Trim': { duration: 20, price: 120 },
  'Kids Cut': { duration: 30, price: 150 },
  'Hot Towel Shave': { duration: 30, price: 180 },
  'The Full Package': { duration: 70, price: 390 }
};

// The shop is open Monday-Friday 08:00-18:00, Saturday 08:00-16:00 and Sunday 09:00-14:00.
const weekdayTimes = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const saturdayTimes = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'];
const sundayTimes = ['09:00','10:00','11:00','12:00','13:00'];
const shopLocation = '123 Main Road, Claremont, Cape Town, South Africa';
const shopName = 'Prime Cut Barber Studio';
const timezone = 'Africa/Johannesburg';

const getBookings = () => JSON.parse(localStorage.getItem('primeCutBookings') || '[]');
const saveBookings = bookings => localStorage.setItem('primeCutBookings', JSON.stringify(bookings));

function getShopNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}:${values.second}`
  };
}

const localDateString = () => getShopNow().date;
const bookingCutoffTime = '10:00:00';

function isSameDay(date) {
  return date === getShopNow().date;
}

function isTodayBookingClosed() {
  return getShopNow().time >= bookingCutoffTime;
}

function getMinimumBookingDate() {
  // Today remains selectable all day. For today's date, individual
  // appointment times are filtered using the customer's current time.
  return getShopNow().date;
}

if (dateInput) dateInput.min = getMinimumBookingDate();
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

function timesForDate(date) {
  if (!date) return [];
  const day = new Date(`${date}T12:00:00`).getDay();
  if (day === 0) return sundayTimes;
  if (day === 6) return saturdayTimes;
  return weekdayTimes;
}

function getBookingEndMinutes(booking) {
  const duration = Number(booking.duration) || services[booking.service]?.duration || 30;
  const [hours, minutes] = booking.time.split(':').map(Number);
  return (hours * 60) + minutes + duration;
}

function getTimeMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours * 60) + minutes;
}

function bookingConflicts(booking, date, time, service, barber) {
  if (booking.date !== date || booking.barber !== barber) return false;

  const requestedStart = getTimeMinutes(time);
  const requestedEnd = requestedStart + (services[service]?.duration || 30);
  const existingStart = getTimeMinutes(booking.time);
  const existingEnd = getBookingEndMinutes(booking);

  return requestedStart < existingEnd && requestedEnd > existingStart;
}

function isTimeInThePast(date, time) {
  if (!isSameDay(date)) return false;
  const now = getShopNow();
  return getTimeMinutes(time) <= getTimeMinutes(now.time.slice(0, 5));
}

function refreshTimes() {
  const date = dateInput?.value;
  const barber = barberSelect?.value;
  const service = serviceSelect?.value;
  const bookings = getBookings();
  const times = timesForDate(date);

  timeSelect.innerHTML = '';
  timeSelect.disabled = !date || !barber || !service;

  if (!date || !barber || !service) {
    timeSelect.innerHTML = '<option value="">Select barber, service & date first</option>';
    return;
  }


  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = times.length ? 'Choose an available time' : 'Closed on this date';
  timeSelect.appendChild(placeholder);

  times.forEach(time => {
    const option = document.createElement('option');
    const taken = bookings.some(b => bookingConflicts(b, date, time, service, barber));
    const past = isTimeInThePast(date, time);
    option.value = time;

    if (taken) {
      option.textContent = `${time} — Booked for ${barber}`;
      option.disabled = true;
    } else if (past) {
      option.textContent = `${time} — Past`;
      option.disabled = true;
    } else {
      option.textContent = time;
    }

    timeSelect.appendChild(option);
  });

  const available = Array.from(timeSelect.options).some(option => option.value && !option.disabled);
  timeSelect.disabled = !available;
}

[dateInput, barberSelect, serviceSelect].forEach(input => input?.addEventListener('change', refreshTimes));

function addDurationToBooking(date, time, durationMinutes) {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  utc.setUTCMinutes(utc.getUTCMinutes() + durationMinutes);

  return {
    date: `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`,
    time: `${pad(utc.getUTCHours())}:${pad(utc.getUTCMinutes())}`
  };
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function googleDateTime(date, time) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
}

function escapeIcs(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatDateForDisplay(date) {
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(`${date}T12:00:00`));
}

function createCalendarDetails(booking) {
  const service = services[booking.service] || { duration: 30, price: 0 };
  const end = addDurationToBooking(booking.date, booking.time, service.duration);
  const title = `${booking.service} at ${shopName}`;
  const details = [
    `Service: ${booking.service}`,
    `Barber: ${booking.barber} (${booking.barberRole})`,
    `Duration: ${service.duration} minutes`,
    `Booking reference: ${booking.reference}`,
    booking.notes ? `Notes: ${booking.notes}` : ''
  ].filter(Boolean).join('\n');

  return {
    service,
    startDate: booking.date,
    startTime: booking.time,
    endDate: end.date,
    endTime: end.time,
    title,
    details
  };
}

function openGoogleCalendar(booking) {
  const { startDate, startTime, endDate, endTime, title, details } = createCalendarDetails(booking);
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', `${googleDateTime(startDate, startTime)}/${googleDateTime(endDate, endTime)}`);
  url.searchParams.set('ctz', timezone);
  url.searchParams.set('details', details);
  url.searchParams.set('location', shopLocation);
  window.open(url.toString(), '_blank', 'noopener,noreferrer');
}

function downloadAppleCompatibleCalendarEvent(booking) {
  const { startDate, startTime, endDate, endTime, title, details } = createCalendarDetails(booking);
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const uid = `${booking.reference.toLowerCase()}@primecut.co.za`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Prime Cut Barber Studio//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=${timezone}:${formatIcsLocal(startDate, startTime)}`,
    `DTEND;TZID=${timezone}:${formatIcsLocal(endDate, endTime)}`,
    `SUMMARY:${escapeIcs(title)}`,
    `LOCATION:${escapeIcs(shopLocation)}`,
    `DESCRIPTION:${escapeIcs(details)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = `${booking.reference}-prime-cut-appointment.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}

function formatIcsLocal(date, time) {
  return `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
}

let latestBooking = null;
let bookingClearTimer = null;
let bookingClearCountdownTimer = null;

function clearBookingUI() {
  if (bookingClearTimer) clearTimeout(bookingClearTimer);
  if (bookingClearCountdownTimer) clearInterval(bookingClearCountdownTimer);
  bookingClearTimer = null;
  bookingClearCountdownTimer = null;
  latestBooking = null;

  form?.reset();
  confirmation.hidden = true;
  calendarActions.hidden = true;
  success.textContent = '';
  timeSelect.innerHTML = '<option value="">Select barber, service & date first</option>';
  timeSelect.disabled = true;
  dateInput.min = getMinimumBookingDate();

  const clearNotice = document.getElementById('bookingClearNotice');
  if (clearNotice) clearNotice.textContent = '';
}

function startBookingClearCountdown() {
  if (bookingClearTimer) clearTimeout(bookingClearTimer);
  if (bookingClearCountdownTimer) clearInterval(bookingClearCountdownTimer);

  const notice = document.getElementById('bookingClearNotice');
  let seconds = 60;

  if (notice) notice.textContent = `Booking details will clear in ${seconds} seconds so you can create a new booking.`;

  bookingClearCountdownTimer = setInterval(() => {
    seconds -= 1;
    if (notice) {
      notice.textContent = seconds > 0
        ? `Booking details will clear in ${seconds} seconds so you can create a new booking.`
        : '';
    }
  }, 1000);

  bookingClearTimer = setTimeout(clearBookingUI, 60000);
}

googleCalendarBtn?.addEventListener('click', () => {
  if (!latestBooking) return;
  openGoogleCalendar(latestBooking);
  startBookingClearCountdown();
});

icsCalendarBtn?.addEventListener('click', () => {
  if (!latestBooking) return;
  downloadAppleCompatibleCalendarEvent(latestBooking);
  startBookingClearCountdown();
});

form?.addEventListener('submit', event => {
  event.preventDefault();
  success.textContent = '';
  confirmation.hidden = true;
  calendarActions.hidden = true;
  latestBooking = null;

  const data = Object.fromEntries(new FormData(form).entries());
  const bookings = getBookings();

  if (!barbers[data.barber]) {
    success.textContent = 'Please choose a barber.';
    return;
  }

  if (!services[data.service]) {
    success.textContent = 'Please choose a valid service.';
    return;
  }

  const selectedDate = new Date(`${data.date}T12:00:00`);
  const minimumDate = getMinimumBookingDate();
  if (Number.isNaN(selectedDate.getTime()) || data.date < minimumDate) {
    success.textContent = 'Please choose a valid available date.';
    dateInput.min = minimumDate;
    refreshTimes();
    return;
  }

  if (!timesForDate(data.date).includes(data.time) || isTimeInThePast(data.date, data.time)) {
    success.textContent = isSameDay(data.date) && getShopNow().time >= bookingCutoffTime
      ? 'That appointment time has already passed. You can still book later today if the slot is available.'
      : 'Please choose an available future time within our opening hours.';
    refreshTimes();
    return;
  }


  const conflict = bookings.some(b => bookingConflicts(b, data.date, data.time, data.service, data.barber));
  if (conflict) {
    success.textContent = `That ${data.barber} slot is already booked or overlaps another appointment. Please choose another time.`;
    refreshTimes();
    return;
  }

  const reference = `PC-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const booking = {
    ...data,
    reference,
    barberRole: barbers[data.barber].role,
    duration: services[data.service].duration,
    price: services[data.service].price,
    discountCode: activeDiscount?.code || null,
    discountPercent: activeDiscount?.percent || 0,
    finalPrice: Math.round(services[data.service].price * (1 - (activeDiscount?.percent || 0) / 100)),
    createdAt: new Date().toISOString(),
    status: 'Confirmed'
  };

  bookings.push(booking);
  saveBookings(bookings);
  latestBooking = booking;

  confirmation.innerHTML = `
    <div class="confirmation-icon">✓</div>
    <div>
      <strong>Booking confirmed</strong>
      <p><b>${booking.service}</b> with <b>${booking.barber}</b> on <b>${formatDateForDisplay(booking.date)}</b> at <b>${booking.time}</b>.</p>
      <small>${booking.duration} min · ${shopLocation}<br>${booking.discountCode ? `Discount: ${booking.discountCode} (${booking.discountPercent}% off) · Total: R${booking.finalPrice}<br>` : ''}Reference: ${booking.reference}</small>
    </div>`;
  confirmation.hidden = false;
  calendarActions.hidden = false;
  success.textContent = `Thanks ${data.name.split(' ')[0]} — your appointment is confirmed.`;
  activeDiscount = null;
  if (discountCodeInput) discountCodeInput.value = '';
  form.reset();
  timeSelect.innerHTML = '<option value="">Select barber, service & date first</option>';
  timeSelect.disabled = true;
  dateInput.min = getMinimumBookingDate();
});


// Booking-entry discount modal
const offerModal = document.getElementById('offerModal');
const offerClose = document.getElementById('offerClose');
const discountCodeInput = document.getElementById('discountCode');
const discountMessage = document.getElementById('discountMessage');
const applyDiscountBtn = document.getElementById('applyDiscountBtn');
const continueBookingBtn = document.getElementById('continueBookingBtn');
const noDiscountBtn = document.getElementById('noDiscountBtn');
let activeDiscount = null;

const discountCodes = {
  FIRSTCUT10: { percent: 10, label: '10% first-visit discount' }
};

function closeOfferModal() {
  if (!offerModal) return;
  offerModal.hidden = true;
  document.body.classList.remove('modal-open');
}

function openOfferModal() {
  if (!offerModal) return;
  offerModal.hidden = false;
  document.body.classList.add('modal-open');
  discountCodeInput?.focus();
}

function goToBooking() {
  closeOfferModal();
  document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function applyDiscount() {
  const code = (discountCodeInput?.value || '').trim().toUpperCase();
  activeDiscount = discountCodes[code] ? { code, ...discountCodes[code] } : null;
  if (!discountMessage) return activeDiscount;
  discountMessage.className = `discount-message ${activeDiscount ? 'valid' : 'invalid'}`;
  discountMessage.textContent = activeDiscount
    ? `${code} applied — ${activeDiscount.label}.`
    : code ? 'That discount code is not valid.' : 'Enter a discount code or continue without one.';
  return activeDiscount;
}

// Every booking CTA opens the discount modal first.
document.querySelectorAll('[data-booking-trigger]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    openOfferModal();
  });
});

offerClose?.addEventListener('click', closeOfferModal);
offerModal?.querySelector('[data-close-offer]')?.addEventListener('click', closeOfferModal);
applyDiscountBtn?.addEventListener('click', () => {
  if (applyDiscount()) {
    if (discountCodeInput) discountCodeInput.value = '';
    goToBooking();
  }
});
discountCodeInput?.addEventListener('input', () => {
  activeDiscount = null;
  if (discountMessage) { discountMessage.textContent = ''; discountMessage.className = 'discount-message'; }
});
discountCodeInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    if (applyDiscount()) {
      if (discountCodeInput) discountCodeInput.value = '';
      goToBooking();
    }
  }
});
continueBookingBtn?.addEventListener('click', () => {
  const typedCode = (discountCodeInput?.value || '').trim();
  if (typedCode && !applyDiscount()) return;
  goToBooking();
});
noDiscountBtn?.addEventListener('click', () => {
  activeDiscount = null;
  if (discountCodeInput) discountCodeInput.value = '';
  goToBooking();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && offerModal && !offerModal.hidden) closeOfferModal();
});

