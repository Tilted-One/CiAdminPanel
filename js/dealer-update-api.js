(function () {
  const API_UPDATE_DEALER = window.API + '/dealer';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Updates a dealer.
   * Sends PUT request with body:
   * {
   *   "id": 0,
   *   "name": "string",
   *   "username": "string",
   *   "contactNumber": "string",
   *   "address": "string"
   * }
   *
   * @param {Object} dealer - Dealer data to update
   */
  async function updateDealer(dealer = {}) {
    const token = getToken();

    if (!token) {
      throw new Error('Missing authentication token. Please login again.');
    }

    // Convert and validate ID
    const id = Number(dealer.id);
    if (!id || Number.isNaN(id) || id <= 0) {
      throw new Error('Invalid dealer ID format.');
    }

    // Ensure all fields are strings (API expects string format)
    const name = String(dealer.name || '').trim();
    const username = String(dealer.username || '').trim();
    const contactNumber = String(dealer.contactNumber || dealer.phone || '').trim();
    const address = String(dealer.address || '').trim();
    
    // Validate required fields
    if (!name) {
      throw new Error('Name is required.');
    }
    if (!username) {
      throw new Error('Username is required.');
    }
    
    // API expects exactly these fields: id (number), name, username, contactNumber, address (all strings)
    const body = {
      id: id,
      name: name,
      username: username,
      contactNumber: contactNumber,
      address: address,
    };

    // Backend expects ID in the body; use the base URL for PUT
    const response = await fetch(API_UPDATE_DEALER, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
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
          : (parsedResponse && parsedResponse.message) || 'Failed to update dealer.';
      throw new Error(message);
    }

    return parsedResponse;
  }

  window.dealerUpdateApi = window.dealerUpdateApi || {};
  window.dealerUpdateApi.updateDealer = updateDealer;
})();

