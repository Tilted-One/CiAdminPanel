(function () {
  const UPDATE_DEALER_URL = 'http://57.131.25.31:8080/dealer';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  async function updateDealer(dealerId, dealerPayload = {}) {
    const token = getToken();

    if (!token) {
      throw new Error('Missing authentication token. Please login again.');
    }

    if (!dealerId) {
      throw new Error('Dealer ID is required for update.');
    }

    // Get existing dealer data for fallback values
    const existingDealer = dealerPayload.existingDealer || {};
    
    // Convert dealerId to number for both URL and body
    const dealerIdNum = parseInt(String(dealerId), 10);
    if (isNaN(dealerIdNum) || dealerIdNum <= 0) {
      throw new Error('Invalid dealer ID format.');
    }
    
    // Extract values from payload or use existing dealer values as fallback
    const name = dealerPayload.name || existingDealer.name || '';
    const username = dealerPayload.username || existingDealer.username || '';
    // Prioritize contactNumber to match API format, fallback to phone for backwards compatibility
    const contactNumber = dealerPayload.contactNumber || dealerPayload.phone || existingDealer.contactNumber || existingDealer.phone || '';
    const address = dealerPayload.address || existingDealer.address || '';
    
    // API expects only these fields: id, name, username, contactNumber, address
    const body = {
      id: dealerIdNum,
      name: name,
      username: username,
      contactNumber: contactNumber,
      address: address,
    };

    const url = `${UPDATE_DEALER_URL}/${dealerIdNum}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
          : parsedResponse?.message || 'Failed to update dealer.';
      throw new Error(message);
    }

    return parsedResponse;
  }

  window.dealerUpdateApi = window.dealerUpdateApi || {};
  window.dealerUpdateApi.updateDealer = updateDealer;
})();

