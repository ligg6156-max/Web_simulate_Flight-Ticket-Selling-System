function getArrivalTime(departureTime, timeNeededMinutes) {
    const duration = Number(timeNeededMinutes);
    const timeMatch = String(departureTime).match(/T(\d{2}):(\d{2})/);

    if (!timeMatch || !Number.isFinite(duration)) {
        return 'Unavailable';
    }

    const departureDate = new Date(Date.UTC(2000, 0, 1, Number(timeMatch[1]), Number(timeMatch[2])));
    departureDate.setUTCMinutes(departureDate.getUTCMinutes() + duration);

    return departureDate.toISOString().slice(11, 16);
}

function getDepartureTime(departureTime) {
    const time = String(departureTime).split('T')[1];
    return time ? time.slice(0, 5) : 'Unavailable';
}

function getSelectedCode(selectId) {
    const value = document.getElementById(selectId).value;
    const codeMatch = value.match(/\(([A-Z]{3})\)/);
    return codeMatch ? codeMatch[1] : '';
}

const airportCodes = {
    'Hong Kong': 'HKG',
    'Tokyo Haneda': 'HND',
    'Singapore': 'SIN',
    'Seoul Incheon': 'ICN',
    'Bangkok': 'BKK'
};

function getAirportCode(airportName) {
    return airportCodes[String(airportName).trim()] || '';
}

function filterFlights() {
    const originCode = getSelectedCode('origin');
    const destinationCode = getSelectedCode('destination');
    const departureDate = document.getElementById('departureDate').value;
    const travellersType = document.getElementById('travellers').value;
    const flightCards = document.querySelectorAll('#ticket_info_list .flight-card');
    let visibleCount = 0;

    flightCards.forEach(flightCard => {
        const matchesOrigin = !originCode || flightCard.dataset.originCode === originCode;
        const matchesDestination =
            !destinationCode || flightCard.dataset.destinationCode === destinationCode;
        const matchesDate = !departureDate || flightCard.dataset.departureDate === departureDate;
        const matchesTravellers =
            !travellersType || flightCard.dataset.travellersType === travellersType;
        const isVisible = matchesOrigin && matchesDestination && matchesDate && matchesTravellers;

        flightCard.hidden = !isVisible;
        if (isVisible) {
            visibleCount += 1;
        }
    });

    const searchStatus = document.getElementById('searchStatus');
    searchStatus.textContent = visibleCount
        ? `${visibleCount} ${visibleCount === 1 ? 'flight' : 'flights'} found.`
        : 'No flights found for the selected route and date.';

    document.getElementById('flights').scrollIntoView({ behavior: 'smooth' });
}

async function fetchticket_info() {
    const ticketInfoElement = document.getElementById('ticket_info_list');

    if (!ticketInfoElement) {
        console.error('Element #ticket_info_list was not found.');
        return;
    }

    try {
        const response = await fetch('/api/ticket');
        
        if (!response.ok) {
            throw new Error('Failed to fetch data from server');
        }

        const ticket_info = await response.json();

        ticketInfoElement
            .querySelectorAll('[data-ticket-source="database"]')
            .forEach(ticketArticle => ticketArticle.remove());

        ticket_info.forEach(ticket => {
            const ticketArticle = document.createElement('article');
            ticketArticle.className = 'card flight-card mb-3';
            ticketArticle.setAttribute(
                'aria-label',
                `${ticket.departure} to ${ticket.destination} flight`
            );
            ticketArticle.dataset.ticketSource = 'database';
            ticketArticle.dataset.originCode = getAirportCode(ticket.departure);
            ticketArticle.dataset.destinationCode = getAirportCode(ticket.destination);
            ticketArticle.dataset.travellersType = String(ticket.seats_type).trim();
            ticketArticle.dataset.departureDate = String(ticket.Time_departure).slice(0, 10);
            ticketArticle.innerHTML = `
            <div class="row g-0">
               <div class="col-md-9 p-4" >
                <div class="d-flex flex-wrap align-items-center gap-2 mb-4">
                  <svg class="icon text-primary" aria-hidden="true">
                    <use href="#icon-plane"></use>
                  </svg>
                  <span class="small fw-bold">SkyBlue Airways</span>
                  <span class="flight-number">${ticket.flights_No} · Airbus A321neo</span>
                  <span class="badge soft-blue ms-sm-auto">${ticket.seats_type}</span>
                </div>

                <div class="row align-items-center text-center g-2">
                  <div class="col-4 text-start">
                    <div class="flight-time">${getDepartureTime(ticket.Time_departure)}</div>
                    <div class="airport-code text-primary">${ticketArticle.dataset.originCode}</div>
                    <div class="small text-secondary">${ticket.departure}</div>
                  </div>

                  <div class="col-4">
                    <div class="small text-secondary">${ticket.Time_need_minute} min</div>
                    <div class="route-line">
                      <svg class="icon" aria-hidden="true">
                        <use href="#icon-plane"></use>
                      </svg>
                    </div>
                    <div class="small text-success">${ticket.flight_type}</div>
                  </div>

                  <div class="col-4 text-end">
                    <div class="flight-time">${getArrivalTime(ticket.Time_departure, ticket.Time_need_minute)}</div>
                    <div class="airport-code text-primary">${ticketArticle.dataset.destinationCode}</div>
                    <div class="small text-secondary">${ticket.destination}</div>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-3 mt-4 small text-secondary">
                  <span>${ticket.Ticket_info}</span>
                </div>
              </div>

              <div class="col-md-3 fare-panel p-4 d-flex flex-column justify-content-center">
                <span class="small text-secondary">One way from</span>
                <div class="h3 fw-bold mb-1">${ticket.price}</div>
                <span class="small text-secondary mb-3">Taxes included</span>
                <span class="availability text-success mb-3">${ticket.seats_ava} seats available</span>
                <button type="button" class="btn btn-primary select-flight">
                  Select flight
                </button>
              </div>
            </div>
          `;
            ticketInfoElement.appendChild(ticketArticle);
            ticketArticle.querySelector('.select-flight').addEventListener('click', async () => {
                try {
                    const response = await fetch('/api/session');
                    const session = await response.json();
                    if (!response.ok || !session.authenticated) {
                        window.location.href = 'login.html';
                        return;
                    }

                    sessionStorage.setItem('selectedFlight', JSON.stringify(ticket));
                    window.location.href = 'Booking.html';
                } catch (error) {
                    console.error('Login check failed:', error);
                    window.location.href = 'login.html';
                }
            });
        });

        filterFlights();
    } catch (error) {
        console.error('Error:', error);
        ticketInfoElement.innerHTML =
            '<p class="error p-4 mb-0">Could not load tickets. Make sure the server is running.</p>';
    }
}

document.getElementById('searchFlights').addEventListener('click', filterFlights);
// Run the function when the page loads
fetchticket_info();