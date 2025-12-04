(function () {
  const API_CARS = window.API + '/cars';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Build Car payload matching the API schema
   * @param {Object} carData - Car data from form
   * @returns {Object} - Car payload for API
   */
  const buildCarPayload = (carData = {}) => {
    // Parse numeric values
    const parseNumber = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const cleaned = String(val).replace(/[^0-9.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const parseInteger = (val) => {
      if (val === undefined || val === null || val === '') return 0;
      const cleaned = String(val).replace(/[^0-9-]/g, '');
      const num = parseInt(cleaned, 10);
      return isNaN(num) ? 0 : num;
    };

    return {
      id: parseInteger(carData.id),
      manufacturer: carData.manufacturer || '',
      model: carData.model || '',
      vin: carData.vin || '',
      manufacturedYear: parseInteger(carData.manufacturedYear),
      transportingPrice: parseNumber(carData.transportingPrice),
      auctionPrice: parseNumber(carData.auctionPrice),
      lotNumber: carData.lotNumber || '',
      purchaseDate: carData.purchaseDate || '',
      estimatedArrivalDate: carData.estimatedArrivalDate || '',
      containerCode: carData.containerCode || '',
      transporterLine: carData.transporterLine || '',
      carOwnerId: parseInteger(carData.carOwnerId),
      vehicleTypeId: parseInteger(carData.vehicleTypeId) || 1,
      destinationPortId: parseInteger(carData.destinationPortId) || 1,
      // If we are updating, we might want to preserve existing photos or send empty if not modifying here
      carPhotos: carData.carPhotos || [],
      // Try sending status if backend supports it, though not in swagger
      status: parseInteger(carData.status),
    };
  };

  /**
   * Add or Update a car via API
   * @param {Object} carData - Car data from form
   * @returns {Promise<Object>} - API response
   */
  async function saveCar(carData = {}) {
    const token = getToken();

    if (!token) {
      throw new Error('Missing authentication token. Please login again.');
    }

    const body = buildCarPayload(carData);

    const response = await fetch(API_CARS, {
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
          : parsedResponse?.message || 'Failed to save car.';
      throw new Error(message);
    }

    return parsedResponse;
  }

  // Expose to global scope
  window.carApi = window.carApi || {};
  window.carApi.addCar = saveCar; // Alias for backward compatibility
  window.carApi.saveCar = saveCar;
})();
