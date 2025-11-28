document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return;

  const usernameInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorBox = document.getElementById('login-error');

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const username = String(usernameInput?.value || '').trim();
    const password = String(passwordInput?.value || '').trim();

    // Simple front-end validation only; no API, no session, no token
    if (!username || !password) {
      if (errorBox) {
        errorBox.textContent = 'Please enter username and password.';
      }
      usernameInput?.classList.add('error');
      passwordInput?.classList.add('error');
      return;
    }

    // Clear any previous error state
    if (errorBox) {
      errorBox.textContent = '';
    }
    usernameInput?.classList.remove('error');
    passwordInput?.classList.remove('error');

    // Always navigate to dashboard; no authentication/session handling
    window.location.href = 'dashboard.html';
  });
});
