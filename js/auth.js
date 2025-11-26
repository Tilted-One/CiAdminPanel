document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorBox = document.getElementById('login-error');

  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = String(emailInput.value || '').trim();
    const password = String(passwordInput.value || '').trim();

    // Clear previous error state
    errorBox.textContent = '';
    emailInput.classList.remove('error');
    passwordInput.classList.remove('error');

    const validEmail = 'admin@dealer.com';
    const validPassword = 'admin123';

    if (email === validEmail && password === validPassword) {
      // simple string-based "session"
      localStorage.setItem('adminSession', 'active');
      window.location.href = 'dashboard.html';
    } else {
      errorBox.textContent = 'Invalid email or password. Please try again.';
      emailInput.classList.add('error');
      passwordInput.classList.add('error');
    }
  });
});


