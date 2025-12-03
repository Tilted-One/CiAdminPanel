(function () {
  const DEALER_DELETE_ENDPOINT = 'http://57.131.25.31:8080/dealers';

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

    const url = `${DEALER_DELETE_ENDPOINT}/${dealerId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    
    if (response.ok) {
       const text = await response.text();
       return text ? JSON.parse(text) : { success: true };
    }

    const text = await response.text();
    throw new Error(`Delete failed: ${response.status} ${text}`);
  }

  window.dealerDeleteApi = window.dealerDeleteApi || {};
  window.dealerDeleteApi.deleteDealer = deleteDealer;
})();

