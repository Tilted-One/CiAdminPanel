(function () {
  const PHOTO_ENDPOINT = 'http://57.131.25.31:8080/carphotos';
  const PHOTO_ADMIN_ENDPOINT = 'http://57.131.25.31:8080/carphotosadmin';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Get all photos for a car
   * @param {number} carId
   */
  async function getCarPhotos(carId) {
    const token = getToken();
    if (!token) {
      console.error('No token found');
      return [];
    }

    try {
      const response = await fetch(`${PHOTO_ADMIN_ENDPOINT}/${carId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch photos: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching car photos:', error);
      return [];
    }
  }

  /**
   * Upload car photos
   * @param {number} carId
   * @param {number} type - 0: purchasing, 1: loading, 2: arriving
   * @param {File[]} files - Array of File objects
   */
  async function uploadCarPhoto(carId, type, files) {
   

    const token = getToken();
    if (!token) {
      console.error('No token found');
      throw new Error('Missing authentication token');
    }

    const formData = new FormData();
    formData.append('carId', carId);
    formData.append('type', type);

    if (files && files.length) {
      files.forEach((file) => {
        // Append each file with key 'images'
        formData.append('images', file);
      });
    }
    // Log FormData entries for debugging
    for (let pair of formData.entries()) {
    }

    try {
      const response = await fetch(PHOTO_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type header is set automatically with boundary for FormData
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${responseText}`);
      }

      return responseText;
    } catch (error) {
      console.error('Error uploading photos:', error);
      throw error;
    }
  }

  window.carPhotosApi = window.carPhotosApi || {};
  window.carPhotosApi.uploadCarPhoto = uploadCarPhoto;
  window.carPhotosApi.getCarPhotos = getCarPhotos;
})();

