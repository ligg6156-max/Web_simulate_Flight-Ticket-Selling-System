const flightSummary = document.getElementById('flightSummary');
const selectedFlight = sessionStorage.getItem('selectedFlight');

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
    const storageKey = `occupiedSeats_${flight._id || flight.flights_No}`;
    let occupiedSeats = JSON.parse(localStorage.getItem(storageKey)) || [];
    let selectedSeat = null;

    if (occupiedSeats.length === 0) {
        const allSeats = rows.flatMap(row => columns.map(column => `${row}${column}`));
        const seatCount = allSeats.length;
        const availableCount = Math.max(0, Math.min(seatCount, Number(flight.seats_ava) || 0));
        const occupiedCount = seatCount - availableCount;
        const seed = String(flight._id || flight.flights_No || 'flight');
        const startIndex = [...seed].reduce((total, character) =>
            total + character.charCodeAt(0), 0) % seatCount;

        occupiedSeats = Array.from(
            { length: occupiedCount },
            (_, index) => allSeats[(startIndex + index) % seatCount]
        );
        localStorage.setItem(storageKey, JSON.stringify(occupiedSeats));
    }

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
                if (seat.classList.contains('occupied')) {
                    return;
                }

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

    confirmButton.addEventListener('click', () => {
        if (!selectedSeat) {
            return;
        }

        occupiedSeats.push(selectedSeat);
        localStorage.setItem(storageKey, JSON.stringify(occupiedSeats));

        const seat = seatMap.querySelector(`[data-seat="${selectedSeat}"]`);
        seat.classList.remove('selected');
        seat.classList.add('occupied');
        seat.disabled = true;

        selectedSeatText.textContent = `Seat ${selectedSeat} booked successfully`;
        selectedSeat = null;
        confirmButton.disabled = true;
        dismissButton.disabled = true;
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

function createSeatLabel(label) {
    const element = document.createElement('span');
    element.className = 'seat-row-label';
    element.textContent = label;
    return element;
}
