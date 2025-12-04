(function () {
  const API_CAR_TRANSPORTATION_STATE = window.API + '/cartransportationstate';

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
      const url = `${API_CAR_TRANSPORTATION_STATE}/${carId}/${transportationState}`;
   

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

