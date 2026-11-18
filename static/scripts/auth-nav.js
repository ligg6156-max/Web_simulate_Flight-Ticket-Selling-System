async function updateAuthNavigation() {
    try {
        const response = await fetch('/api/session');
        const session = await response.json();
        const authActions = document.querySelectorAll('[data-auth-action]');

        authActions.forEach(action => {
            if (!session.authenticated) {
                action.href = 'login.html';
                action.title = 'Sign in';
                action.innerHTML = `
                    <svg class="icon me-1" aria-hidden="true">
                        <use href="#icon-user"></use>
                    </svg>
                    Sign in
                `;
                action.onclick = null;
                return;
            }

            action.href = '#';
            action.title = `Log out ${session.user.username}`;
            action.textContent = 'Log out';
            action.onclick = async event => {
                event.preventDefault();
                const logoutResponse = await fetch('/api/logout', { method: 'POST' });

                if (logoutResponse.ok) {
                    sessionStorage.removeItem('selectedFlight');
                    sessionStorage.removeItem('selectedBooking');
                    window.location.href = 'Dashboard.html';
                }
            };
        });

        const loginForm = document.getElementById('loginForm');
        const loginStatus = document.getElementById('loginStatus');
        if (session.authenticated && loginForm) {
            loginForm.hidden = true;
            loginStatus.textContent = `Signed in as ${session.user.username}.`;
            loginStatus.className = 'mt-3 mb-0 text-success';
        }
    } catch (error) {
        console.error('Unable to update authentication navigation:', error);
    }
}

updateAuthNavigation();
