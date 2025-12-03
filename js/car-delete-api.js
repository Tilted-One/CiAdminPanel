(function () {
  const CAR_DELETE_ENDPOINT = 'http://57.131.25.31:8080/car';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  async function deleteCar(carId) {
    const token = getToken();
    if (!token) {
      throw new Error('Missing authentication token.');
    }

    if (!carId) {
      throw new Error('Car ID is required.');
    }

    const url = `${CAR_DELETE_ENDPOINT}/${carId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    
    // Handle both 200 OK and 204 No Content as success
    if (response.ok) {
       // Some APIs return empty body for DELETE
       const text = await response.text();
       return text ? JSON.parse(text) : { success: true };
    }

    const text = await response.text();
    throw new Error(`Delete failed: ${response.status} ${text}`);
  }

  window.carDeleteApi = window.carDeleteApi || {};
  window.carDeleteApi.deleteCar = deleteCar;
})();
