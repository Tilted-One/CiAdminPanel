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

    // Ensure valid ID or default (1) for required relation fields
    const ensureId = (val, defaultVal = 1) => {
      const n = parseInteger(val);
      return n > 0 ? n : defaultVal;
    };

    // Construct STRICTLY FLAT payload for PUT request
    // No nested objects for relations (carOwner, destinationPort, etc.)
    // Only IDs are allowed.
    const payload = {
      id: parseInteger(carData.id),
      manufacturer: String(carData.manufacturer || carData.make || ''),
      model: String(carData.model || ''),
      vin: String(carData.vin || ''),
      manufacturedYear: parseInteger(carData.manufacturedYear || carData.year),
      transportingPrice: parseNumber(carData.transportingPrice || carData.priceTransport),
      auctionPrice: parseNumber(carData.auctionPrice || carData.priceAuction),
      lotNumber: String(carData.lotNumber || ''),
      
      // Priority: explicitly set transportationState -> mapped from status -> existing -> default 0
      transportationState: (carData.transportationState !== undefined && carData.transportationState !== null) 
          ? parseInteger(carData.transportationState)
          : parseInteger(carData.status),
          
      purchaseDate: String(carData.purchaseDate || carData.purchasedDate || '2025-12-01'),
      estimatedArrivalDate: String(carData.estimatedArrivalDate || carData.arrivalDate || '2025-12-01'),
      containerCode: String(carData.containerCode || carData.containerNumber || ''),
      transporterLine: String(carData.transporterLine || carData.shippingLine || ''),
      
      // Foreign Keys - Must exist and be integers
      carOwnerId: ensureId(carData.carOwnerId, 1), 
      vehicleTypeId: ensureId(carData.vehicleTypeId, 1),
      destinationPortId: ensureId(carData.destinationPortId, 1),
      
      // Car Photos (Array of objects is allowed/required here)
      carPhotos: Array.isArray(carData.carPhotos) ? carData.carPhotos.map(p => ({
        id: parseInteger(p.id),
        carId: parseInteger(carData.id),
        photoUrl: String(p.photoUrl || ''),
        photoType: parseInteger(p.photoType)
      })) : []
    };

    console.log('Sending PUT payload:', payload);

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

  window.carUpdateApi = window.carUpdateApi || {};
  window.carUpdateApi.updateCar = updateCar;
})();
