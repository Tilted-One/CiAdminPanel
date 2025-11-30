(function () {
  const PHOTO_ENDPOINT = 'http://57.131.25.31:8080/carphotos';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Upload car photos
   * @param {number} carId
   * @param {number} type - 0: purchasing, 1: loading, 2: arriving
   * @param {File[]} files - Array of File objects
   */
  async function uploadCarPhoto(carId, type, files) {
    console.log('--- Uploading Car Photos ---');
    console.log('Car ID:', carId);
    console.log('Type:', type);
    console.log('Files:', files);

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

    console.log('FormData created. Sending POST request to:', PHOTO_ENDPOINT);
    // Log FormData entries for debugging
    for (let pair of formData.entries()) {
      console.log(pair[0] + ', ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
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
})();

