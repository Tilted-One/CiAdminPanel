(function () {
  const API_REGISTER_DEALER = window.API + '/registerdealer';

  const cleanToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  const buildPayload = (dealerPayload = {}) => ({
    name: dealerPayload.name || '',
    username: dealerPayload.username || '',
    passwordHash: dealerPayload.password || '',
    contactNumber: dealerPayload.phone || dealerPayload.contactNumber || '',
    address: dealerPayload.address || '',
    cars: Array.isArray(dealerPayload.cars) ? dealerPayload.cars : [],
  });

  async function registerDealer(dealerPayload = {}) {
    const token = cleanToken();

    if (!token) {
      throw new Error('Missing authentication token. Please login again.');
    }

    const body = buildPayload(dealerPayload);

    const response = await fetch(API_REGISTER_DEALER, {
      method: 'POST',
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
          : parsedResponse?.message || 'Failed to register dealer.';
      throw new Error(message);
    }

    return parsedResponse;
  }

  window.dealerApi = window.dealerApi || {};
  window.dealerApi.registerDealer = registerDealer;
})();