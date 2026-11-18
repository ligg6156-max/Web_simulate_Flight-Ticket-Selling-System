const selectedBooking = sessionStorage.getItem('selectedBooking');
const bookingSummary = document.getElementById('bookingSummary');
const paymentForm = document.getElementById('paymentForm');
const paymentStatus = document.getElementById('paymentStatus');
const receipt = document.getElementById('receipt');

checkLogin();

async function checkLogin() {
    try {
        const response = await fetch('/api/session');
        const session = await response.json();
        if (!response.ok || !session.authenticated) {
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Login check failed:', error);
        window.location.href = 'login.html';
    }
}

if (!selectedBooking) {
    bookingSummary.innerHTML = `
        <p class="mb-3">No booking information is available.</p>
        <a class="btn btn-primary" href="Dashboard.html">Choose a flight</a>
    `;
    paymentForm.hidden = true;
} else {
    const booking = JSON.parse(selectedBooking);
    const flight = booking.flight;
    const price = Number(flight.price) || 0;

    bookingSummary.innerHTML = `
        <dl class="row mb-0">
            <dt class="col-5">Flight</dt>
            <dd class="col-7">${flight.flights_No}</dd>
            <dt class="col-5">Route</dt>
            <dd class="col-7">${flight.departure} to ${flight.destination}</dd>
            <dt class="col-5">Departure</dt>
            <dd class="col-7">${formatDeparture(flight.Time_departure)}</dd>
            <dt class="col-5">Seat</dt>
            <dd class="col-7">${booking.seat}</dd>
            <dt class="col-5">Class</dt>
            <dd class="col-7">${flight.seats_type}</dd>
            <dt class="col-5">Total</dt>
            <dd class="col-7 fw-bold">HK$${price.toLocaleString()}</dd>
        </dl>
    `;
}

document.getElementById('cardNumber').addEventListener('input', event => {
    event.target.value = event.target.value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
});

document.getElementById('expiry').addEventListener('input', event => {
    let value = event.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) {
        value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    event.target.value = value;
});

document.getElementById('cvv').addEventListener('input', event => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4);
});

paymentForm.addEventListener('submit', async event => {
    event.preventDefault();

    if (!paymentForm.reportValidity()) {
        return;
    }

    const booking = selectedBooking ? JSON.parse(selectedBooking) : null;
    if (!booking) {
        paymentStatus.textContent = 'No booking information is available.';
        paymentStatus.className = 'mt-3 mb-0 fw-bold text-danger';
        return;
    }

    const bookingReference = createBookingReference();
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerEmail = document.getElementById('buyerEmail').value.trim();
    const price = Number(booking.flight.price) || 0;
    const paidAt = new Date();

    paymentStatus.textContent = 'Processing payment...';
    paymentStatus.className = 'mt-3 mb-0 fw-bold text-secondary';

    try {
        const response = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingReference,
                flights_No: booking.flight.flights_No,
                seat: booking.seat,
                buyerName,
                buyerEmail,
                departure: booking.flight.departure,
                destination: booking.flight.destination,
                departureTime: booking.flight.Time_departure,
                seats_type: booking.flight.seats_type,
                price
            })
        });
        const order = await response.json();

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }
        if (!response.ok) {
            throw new Error(order.error || 'Failed to save the order.');
        }

        paymentStatus.textContent = 'Payment completed successfully.';
        paymentStatus.className = 'mt-3 mb-0 fw-bold text-success';
        paymentForm.hidden = true;
        receipt.hidden = false;
        receipt.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
                <div class="text-success fw-bold">Payment receipt</div>
                <h2 class="h5 mb-0">SkyBlue Airways</h2>
            </div>
            <span class="badge text-bg-success">Paid</span>
        </div>
        <dl class="row mb-3">
            <dt class="col-5">Booking reference</dt>
            <dd class="col-7 fw-bold">${bookingReference}</dd>
            <dt class="col-5">Passenger</dt>
            <dd class="col-7">${escapeHtml(buyerName)}</dd>
            <dt class="col-5">Email</dt>
            <dd class="col-7">${escapeHtml(buyerEmail)}</dd>
            <dt class="col-5">Flight</dt>
            <dd class="col-7">${booking.flight.flights_No}</dd>
            <dt class="col-5">Route</dt>
            <dd class="col-7">${booking.flight.departure} to ${booking.flight.destination}</dd>
            <dt class="col-5">Seat</dt>
            <dd class="col-7">${booking.seat}</dd>
            <dt class="col-5">Paid at</dt>
            <dd class="col-7">${paidAt.toLocaleString()}</dd>
            <dt class="col-5">Amount paid</dt>
            <dd class="col-7 fw-bold">HK$${price.toLocaleString()}</dd>
        </dl>
        <button type="button" class="btn btn-outline-primary" id="printReceipt">Print receipt</button>
        <a class="btn btn-primary ms-2" href="Dashboard.html">Book another flight</a>
    `;

    document.getElementById('printReceipt').addEventListener('click', () => {
        window.print();
    });
    } catch (error) {
        console.error('Payment processing failed:', error);
        paymentStatus.textContent = error.message;
        paymentStatus.className = 'mt-3 mb-0 fw-bold text-danger';
    }
});

function formatDeparture(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Unavailable';
    }

    return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function createBookingReference() {
    const booking = selectedBooking ? JSON.parse(selectedBooking) : null;
    const source = `${booking?.flight?.flights_No || 'FLIGHT'}-${booking?.seat || 'SEAT'}-${Date.now()}`;
    return [...source].reduce((total, character) =>
        ((total * 31) + character.charCodeAt(0)) >>> 0, 7
    ).toString(36).slice(-8).toUpperCase();
}

function escapeHtml(value) {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
}
