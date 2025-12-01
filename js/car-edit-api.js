(function () {
  const CARS_ENDPOINT = 'http://57.131.25.31:8080/cars';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

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

  async function updateCar(carData) {
    const token = getToken();
    if (!token) {
      throw new Error('Missing authentication token.');
    }

    // Ensure numeric types and complete payload structure
    const payload = {
      id: parseInteger(carData.id),
      manufacturer: String(carData.manufacturer || ''),
      model: String(carData.model || ''),
      vin: String(carData.vin || ''),
      manufacturedYear: parseInteger(carData.manufacturedYear),
      transportingPrice: parseNumber(carData.transportingPrice),
      auctionPrice: parseNumber(carData.auctionPrice),
      lotNumber: String(carData.lotNumber || ''),
      purchaseDate: String(carData.purchaseDate || ''),
      estimatedArrivalDate: String(carData.estimatedArrivalDate || ''),
      containerCode: String(carData.containerCode || ''),
      transporterLine: String(carData.transporterLine || ''),
      carOwnerId: parseInteger(carData.carOwnerId),
      vehicleTypeId: parseInteger(carData.vehicleTypeId) || 1,
      destinationPortId: parseInteger(carData.destinationPortId) || 1,
      carPhotos: Array.isArray(carData.carPhotos) ? carData.carPhotos : [],
      status: parseInteger(carData.status)
    };


    const response = await fetch(CARS_ENDPOINT, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`Update failed: ${response.status} ${text}`);
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  }

  window.carEditApi = window.carEditApi || {};
  window.carEditApi.updateCar = updateCar;
})();

