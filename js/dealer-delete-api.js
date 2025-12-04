(function () {
  const API_DELETE_DEALER = window.API + '/dealer';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  async function deleteDealer(dealerId) {
    const token = getToken();
    if (!token) {
      throw new Error('Missing authentication token.');
    }

    if (!dealerId) {
      throw new Error('Dealer ID is required.');
    }

    // Convert dealerId to number to match API expectations
    const dealerIdNum = parseInt(String(dealerId), 10);
    if (isNaN(dealerIdNum) || dealerIdNum <= 0) {
      throw new Error('Invalid dealer ID format.');
    }

    const url = `${API_DELETE_DEALER}/${dealerIdNum}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
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
          : parsedResponse?.message || `Delete failed: ${response.status}`;
      throw new Error(message);
    }

    return parsedResponse || { success: true };
  }

  window.dealerDeleteApi = window.dealerDeleteApi || {};
  window.dealerDeleteApi.deleteDealer = deleteDealer;
})();

