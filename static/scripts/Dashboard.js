async function fetchUsers() {
    const userListElement = document.getElementById('user-menu');
    try {
        // Fetch data from your Express API route
        const response = await fetch('/api/users');
        
        if (!response.ok) {
            throw new Error('Failed to fetch data from server');
        }

        const users = await response.json();

        // Clear the loading message
        userListElement.innerHTML = '';

        if (users.length === 0) {
            userListElement.innerHTML = '<li>No users found in the database.</li>';
            return;
        }

        // Loop through the users and add them to the HTML list
        users.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>Name:</strong> ${user.name} <br>
                            <strong>Email:</strong> ${user.email} <br>`
                            userListElement.appendChild(li);
        });

    } catch (error) {
        console.error('Error:', error);
        userListElement.innerHTML = `<li class="error">Could not load users. Make sure your server is running.</li>`;
    }
}

// Run the function when the page loads
fetchUsers();