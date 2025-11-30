document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const loginInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const errorBox = document.getElementById('login-error');

    const API_URL = 'http://57.131.25.31:8080/loginadmin';

    // Auto-login check
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
        fetch('http://57.131.25.31:8080/dealers', {
            headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                localStorage.removeItem('token');
            }
        })
        .catch(() => {
            localStorage.removeItem('token');
        });
    }

    if (!form || !loginInput || !passwordInput || !errorBox) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const login = loginInput.value.trim();
        const password = passwordInput.value.trim();

        if (!login || !password) {
            errorBox.textContent = 'Please enter username and password';
            return;
        }

        errorBox.textContent = '';

        try {
            // ✅ SEND AS FORM DATA
            const body = new URLSearchParams();
            body.append('login', login);
            body.append('password', password);

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            });

            // ✅ READ TOKEN AS TEXT (NOT JSON)
            const tokenResponse = await response.text();
            const token = tokenResponse.replace(/"/g, "");

            if (response.status === 200 && token) {
                localStorage.setItem('token', token);


                window.location.href = 'dashboard.html';
                return;
            }

            errorBox.textContent = 'Invalid username or password';

        } catch (error) {
            console.error(error);
            errorBox.textContent = 'Server error. Try again later.';
        }
    });
});