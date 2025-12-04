(function () {
  const DEALER_RESET_PASSWORD_ENDPOINT = 'http://57.131.25.31:8080/dealer/resetpassword';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Reset dealer password
   * POST /dealer/resetpassword?dealerId={id}&newPass={password}
   *
   * @param {number|string} dealerId
   * @param {string} newPass
   */
  async function resetDealerPassword(dealerId, newPass) {
    const token = getToken();
    if (!token) {
      throw new Error('Missing authentication token. Please login again.');
    }

    // Validate dealerId
    const idNum = parseInt(String(dealerId), 10);
    if (!dealerId || Number.isNaN(idNum) || idNum <= 0) {
      throw new Error('Invalid dealer ID.');
    }

    // Validate newPass
    const pass = String(newPass || '').trim();
    if (!pass) {
      throw new Error('New password is required.');
    }

    // Build query string: dealerId & newPass (no * in keys)
    const params = new URLSearchParams({
      dealerId: String(idNum),
      newPass: pass,
    });

    const url = `${DEALER_RESET_PASSWORD_ENDPOINT}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    const responseText = await response.text();
    let parsedResponse = null;

    if (responseText) {
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (error) {
        parsedResponse = responseText;
      }
    }

    if (!response.ok) {
      const message =
        typeof parsedResponse === 'string' && parsedResponse
          ? parsedResponse
          : (parsedResponse && parsedResponse.message) || 'Failed to reset password.';
      throw new Error(message);
    }

    return parsedResponse;
  }

  window.dealerResetPasswordApi = window.dealerResetPasswordApi || {};
  window.dealerResetPasswordApi.resetDealerPassword = resetDealerPassword;
})();


