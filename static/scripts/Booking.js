const flightSummary = document.getElementById('flightSummary');
const selectedFlight = sessionStorage.getItem('selectedFlight');

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

if (!selectedFlight) {
    flightSummary.innerHTML = `
        <p class="mb-3">No flight has been selected.</p>
        <a class="btn btn-primary" href="Dashboard.html">Choose a flight</a>
    `;
} else {
    const flight = JSON.parse(selectedFlight);
    flightSummary.innerHTML = `
        <div class="d-flex justify-content-between align-items-start mb-3">
            <div>
                <div class="small text-secondary">SkyBlue Airways</div>
                <h2 class="h4 mb-0">${flight.flights_No}</h2>
            </div>
            <span class="badge soft-blue">${flight.seats_type}</span>
        </div>
        <div class="row g-3">
            <div class="col-sm-6">
                <div class="small text-secondary">From</div>
                <strong>${flight.departure}</strong>
            </div>
            <div class="col-sm-6">
                <div class="small text-secondary">To</div>
                <strong>${flight.destination}</strong>
            </div>
            <div class="col-sm-6">
                <div class="small text-secondary">Departure</div>
                <strong>${flight.Time_departure}</strong>
            </div>
            <div class="col-sm-6">
                <div class="small text-secondary">Price</div>
                <strong>HK$${flight.price}</strong>
            </div>
        </div>
        <hr class="my-4">
        <h2 class="h5 fw-bold text-center">Choose a seat</h2>
        <div class="d-flex justify-content-center gap-4 my-3 small">
            <span><i class="seat-legend available"></i> Available</span>
            <span><i class="seat-legend selected"></i> Selected</span>
            <span><i class="seat-legend occupied"></i> Occupied</span>
        </div>
        <div id="seatMap" class="seat-map mx-auto"></div>
        <p id="selectedSeat" class="text-center fw-bold mt-3">Click an available seat</p>
        <div class="text-center">
            <button type="button" id="confirmSeat" class="btn btn-primary me-2" disabled>Confirm</button>
            <button type="button" id="dismissSeat" class="btn btn-secondary" disabled>Dismiss</button>
        </div>
    `;

    const seatMap = document.getElementById('seatMap');
    const selectedSeatText = document.getElementById('selectedSeat');
    const confirmButton = document.getElementById('confirmSeat');
    const dismissButton = document.getElementById('dismissSeat');
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const columns = [1, 2, 3, 4, 5, 6];
    let selectedSeat = null;

    loadSeatState();

    async function loadSeatState() {
        try {
            const flightsNo = String(flight.flights_No || '').replace(/\s+/g, '');
            const response = await fetch(`/api/seat?flights_No=${encodeURIComponent(flightsNo)}`);
            const seatState = await response.json();

            if (!response.ok) {
                throw new Error(seatState.error || 'Failed to fetch seat state.');
            }

            const occupiedSeats = getOccupiedSeats(seatState.seat);
            renderSeatMap(occupiedSeats);
        } catch (error) {
            console.error('Error loading seat state:', error);
            seatMap.innerHTML = '';
            selectedSeatText.textContent = 'Could not load seat availability.';
        }
    }

    function renderSeatMap(occupiedSeats) {
        rows.forEach(row => {
            seatMap.appendChild(createSeatLabel(row));
            columns.forEach(column => {
                const seatId = `${row}${column}`;
                if (column === 4) {
                    seatMap.insertAdjacentHTML('beforeend', '<span class="seat-row-label"></span>');
                }
                const seat = document.createElement('button');
                seat.type = 'button';
                seat.className = 'seat';
                seat.textContent = seatId;
                seat.dataset.seat = seatId;

                if (occupiedSeats.includes(seatId)) {
                    seat.classList.add('occupied');
                    seat.disabled = true;
                }

                seat.addEventListener('click', () => {
                    document.querySelectorAll('.seat.selected').forEach(item => {
                        item.classList.remove('selected');
                    });

                    seat.classList.add('selected');
                    selectedSeat = seatId;
                    selectedSeatText.textContent = `Selected seat: ${seatId}`;
                    confirmButton.disabled = false;
                    dismissButton.disabled = false;
                });

                seatMap.appendChild(seat);
            });
        });

        confirmButton.addEventListener('click', async () => {
            if (!selectedSeat) {
                return;
            }

            const seatToConfirm = selectedSeat;
            confirmButton.disabled = true;
            dismissButton.disabled = true;
            selectedSeatText.textContent = 'Saving seat...';

            try {
                const flightsNo = String(flight.flights_No || '').replace(/\s+/g, '');
                const response = await fetch('/api/seat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        flights_No: flightsNo,
                        seat: seatToConfirm
                    })
                });
                const seatState = await response.json();

                if (!response.ok) {
                    throw new Error(seatState.error || 'Failed to update seat state.');
                }

                const seat = seatMap.querySelector(`[data-seat="${seatToConfirm}"]`);
                seat.classList.remove('selected');
                seat.classList.add('occupied');
                seat.disabled = true;

                selectedSeatText.textContent = `Seat ${seatToConfirm} booked successfully`;
                selectedSeat = null;

                sessionStorage.setItem('selectedBooking', JSON.stringify({
                    flight,
                    seat: seatToConfirm
                }));

                setTimeout(() => {
                    window.location.href = 'Payment.html';
                }, 500);
            } catch (error) {
                console.error('Error updating seat state:', error);
                selectedSeatText.textContent = error.message;
                confirmButton.disabled = false;
                dismissButton.disabled = false;
            }
        });

        dismissButton.addEventListener('click', () => {
            document.querySelectorAll('.seat.selected').forEach(item => {
                item.classList.remove('selected');
            });
            selectedSeat = null;
            selectedSeatText.textContent = 'Click an available seat';
            confirmButton.disabled = true;
            dismissButton.disabled = true;
        });
    }
}

function getOccupiedSeats(seats) {
    if (!Array.isArray(seats)) {
        throw new Error('Seat state must be an array.');
    }

    return seats.flatMap(seat => {
        if (typeof seat === 'string') {
            return [seat];
        }

        if (seat && typeof seat === 'object' && typeof seat.seat === 'string') {
            return seat.occupied === false || seat.state === 'available' ? [] : [seat.seat];
        }

        return [];
    });
}

function createSeatLabel(label) {
    const element = document.createElement('span');
    element.className = 'seat-row-label';
    element.textContent = label;
    return element;
}
