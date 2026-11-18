const registerForm = document.getElementById('registerForm');
const registerStatus = document.getElementById('registerStatus');

registerForm.addEventListener('submit', async event => {
    event.preventDefault();
    registerStatus.textContent = 'Creating account...';
    registerStatus.className = 'mt-3 mb-0 text-secondary';

    const formData = new FormData(registerForm);
    const account = {
        username: formData.get('username'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        role: formData.get('role')
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(account)
        });
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'Registration failed.');
        }

        registerStatus.textContent = result.message;
        registerStatus.className = 'mt-3 mb-0 text-success';
        registerForm.reset();
    } catch (error) {
        console.error('Registration error:', error);
        registerStatus.textContent = error.message;
        registerStatus.className = 'mt-3 mb-0 text-danger';
    }
});
