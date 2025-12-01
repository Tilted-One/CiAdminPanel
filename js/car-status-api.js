(function () {
  const TRANSPORTATION_STATE_ENDPOINT = 'http://57.131.25.31:8080/cartransportationstate';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Update car transportation state
   * @param {number|string} carId
   * @param {number} transportationState - 0: Purchasing, 1: Loading, 2: Arrived
   */
  async function updateCarStatus(carId, transportationState) {
    const token = getToken();
    if (!token) {
      console.error('No token found');
      throw new Error('Missing authentication token');
    }

    try {
      const url = `${TRANSPORTATION_STATE_ENDPOINT}/${carId}/${transportationState}`;
   

      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }
      
      // Return true if successful
      return true;
    } catch (error) {
      console.error('Error updating car status:', error);
      throw error;
    }
  }

  window.carStatusApi = window.carStatusApi || {};
  window.carStatusApi.updateCarStatus = updateCarStatus;
})();

