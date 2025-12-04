(function () {
  const API_RESET_PASSWORD = window.API + '/resetpassword';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Reset dealer password
   * POST /resetpassword
   * Body (multipart/form-data):
   * dealerId: number
   * newPass: string
   * 
   * IMPORTANT: 
   * - Uses FormData for multipart/form-data
   * - DO NOT set Content-Type header manually - browser sets it automatically with boundary
   * - Authorization: Bearer token in header
   *
   * @param {number|string} dealerId - The dealer ID (numeric)
   * @param {string} newPass - The new password from the reset password modal
   */
  async function resetDealerPassword(dealerId, newPass) {
    const token = getToken();
    if (!token) {
      throw new Error('Missing authentication token. Please login again.');
    }

    // Validate dealerId - must be numeric
    const idNum = parseInt(String(dealerId), 10);
    if (!dealerId || Number.isNaN(idNum) || idNum <= 0) {
      throw new Error('Invalid dealer ID.');
    }

    // Validate newPass (what's written in reset password modal)
    const pass = String(newPass || '').trim();
    if (!pass) {
      throw new Error('New password is required.');
    }
    
    if (pass.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    // Build FormData for multipart/form-data
    // FormData automatically sets Content-Type: multipart/form-data with boundary
    const formData = new FormData();
    formData.append('dealerId', String(idNum)); // Append as string, backend will parse as number
    formData.append('newPass', pass);

    // CRITICAL: Do NOT set Content-Type header manually
    // Browser will automatically set: Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
    const response = await fetch(API_RESET_PASSWORD, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // DO NOT include Content-Type here - browser sets it automatically with boundary
      },
      body: formData, // FormData object, not JSON.stringify()
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