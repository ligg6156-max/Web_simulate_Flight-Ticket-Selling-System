const btnLogin = document.getElementById('btn-login');
const inputUsername = document.getElementById('username');
const inputPassword = document.getElementById('password');

btnLogin.addEventListener('click', async () => {
  const username = inputUsername.value.trim();
  const password = inputPassword.value;

  if (!username || !password) {
    alert('Username and password cannot be empty');
    return;
  }

  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      password: password
    })
  });

  const data = await response.json();

  if (response.ok && data.user) {
    alert(`Logged in as ${data.user.username} (${data.user.role})`);
    window.location.href = '/Dashboard.html';
  } else if (data.message) {
    alert(data.message);
  } else {
    alert('Unknown error');
  }
});
