const loginForm = document.getElementById('loginForm');
const loginStatus = document.getElementById('loginStatus');

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginStatus.textContent = 'Verifying login...';
    loginStatus.className = 'mt-3 mb-0 text-secondary';

    const formData = new FormData(loginForm);
    const credentials = {
        username: formData.get('username'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const contentType = response.headers.get('content-type') || '';
        const result = contentType.includes('application/json')
            ? await response.json()
            : { success: false, message: `Login request failed (${response.status}).` };

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Login failed.');
        }

        loginStatus.textContent = result.message;
        loginStatus.className = 'mt-3 mb-0 text-success';
        window.location.href = 'Dashboard.html';
    } catch (error) {
        console.error('Login error:', error);
        loginStatus.textContent = error.message;
        loginStatus.className = 'mt-3 mb-0 text-danger';
    }
});
