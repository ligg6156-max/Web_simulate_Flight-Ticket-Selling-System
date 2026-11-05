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

        if (ticket_info.length === 0) {
            ticketInfoElement.innerHTML = '<p class="p-4 mb-0">No tickets found in the database.</p>';
            return;
        }

        ticketInfoElement.innerHTML = '';

        ticket_info.forEach(ticket => {
            const ticketInfoCard = `
            <div class="row g-0">
              <div class="col-md-9 p-4">
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
                    <div class="flight-time">${ticket.Time_departure}</div>
                    <div class="airport-code text-primary">HKG</div>
                    <div class="small text-secondary">${ticket.destination}</div>
                  </div>

                  <div class="col-4">
                    <div class="small text-secondary">4h 10m</div>
                    <div class="route-line">
                      <svg class="icon" aria-hidden="true">
                        <use href="#icon-plane"></use>
                      </svg>
                    </div>
                    <div class="small text-success">Direct</div>
                  </div>

                  <div class="col-4 text-end">
                    <div class="flight-time">13:40</div>
                    <div class="airport-code text-primary">HND</div>
                    <div class="small text-secondary">Tokyo Haneda</div>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-3 mt-4 small text-secondary">
                  <span>20 Nov 2026</span>
                  <span>20 kg checked baggage</span>
                  <span>Meal included</span>
                </div>
              </div>

              <div class="col-md-3 fare-panel p-4 d-flex flex-column justify-content-center">
                <span class="small text-secondary">One way from</span>
                <div class="h3 fw-bold mb-1">HK$2,180</div>
                <span class="small text-secondary mb-3">Taxes included</span>
                <span class="availability text-success mb-3">24 seats available</span>
                <button type="button" class="btn btn-primary">
                  Select flight
                </button>
              </div>
            </div>`;
            ticketInfoElement.insertAdjacentHTML('beforeend', ticketInfoCard);
        });
    } catch (error) {
        console.error('Error:', error);
        ticketInfoElement.innerHTML =
            '<p class="error p-4 mb-0">Could not load tickets. Make sure the server is running.</p>';
    }
}
// Run the function when the page loads
fetchticket_info();