(function () {
  const PHOTO_ENDPOINT = 'http://57.131.25.31:8080/carphoto';

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : '';
  };

  /**
   * Delete a car photo by ID
   * @param {number} photoId - ID of the photo to delete
   * @returns {Promise<void>}
   */
  async function deleteCarPhoto(photoId) {
    const token = getToken();
    if (!token) {
      throw new Error('Missing authentication token');
    }

    const url = `${PHOTO_ENDPOINT}/${photoId}`;
    console.log('Deleting photo:', url);

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to delete photo: ${response.status} ${text}`);
    }
  }

  window.carPhotosDeleteApi = window.carPhotosDeleteApi || {};
  window.carPhotosDeleteApi.deleteCarPhoto = deleteCarPhoto;
})();

