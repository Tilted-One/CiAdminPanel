document.addEventListener('DOMContentLoaded', () => {
  const CARS_ENDPOINT = 'http://57.131.25.31:8080/carsadmin';
  const DEALER_CACHE_KEY = 'dashboardDealerCache';

  const dealerErrorSection = document.getElementById('dealer-error');
  const dealerContentSection = document.getElementById('dealer-content');

  const dealerNameHeading = document.getElementById('dealer-name-heading');
  const dealerEmailLine = document.getElementById('dealer-email-line');
  const dealerPhoneLine = document.getElementById('dealer-phone-line');
  const dealerTotalCountEl = document.getElementById('dealer-total-count');

  const logoutBtn = document.getElementById('logout-btn');

  const carGridEl = document.getElementById('car-grid');
  const carSearchInput = document.getElementById('car-search');
  const carStatusFilter = document.getElementById('car-status-filter');
  const newCarBtn = document.getElementById('new-car-btn');

  const carModal = document.getElementById('car-modal');
  const carModalTitle = document.getElementById('car-modal-title');
  const carModalClose = document.getElementById('car-modal-close');
  const carModalCancel = document.getElementById('car-modal-cancel');
  const carForm = document.getElementById('car-form');
  const carFormError = document.getElementById('car-form-error');

  const carMakeInput = document.getElementById('car-make');
  const carModelInput = document.getElementById('car-model');
  const carVinInput = document.getElementById('car-vin');
  const carYearInput = document.getElementById('car-year');
  const carLotNumberInput = document.getElementById('car-lot-number');
  const carPurchasedDateInput = document.getElementById('car-purchased-date');
  const carArrivalDateInput = document.getElementById('car-arrival-date');
  const carContainerNumberInput = document.getElementById('car-container-number');
  const carShippingLineInput = document.getElementById('car-shipping-line');
  const carPriceAuctionInput = document.getElementById('car-price-auction');
  const carPriceTransportInput = document.getElementById('car-price-transport');
  const carStatusSelect = document.getElementById('car-status');

  // Detail modal elements (editable)
  const carDetailModal = document.getElementById('car-detail-modal');
  const carDetailTitle = document.getElementById('car-detail-title');
  const carDetailClose = document.getElementById('car-detail-close');
  const carDetailForm = document.getElementById('car-detail-form');
  const carDetailCancel = document.getElementById('car-detail-cancel');
  const carDetailImagesRow = document.getElementById('car-detail-images-row');
  const detailActionSection = document.getElementById('detail-action-section');
  const detailInfoSection = document.getElementById('detail-info-section');

  // Delete Photo Modal elements
  const deletePhotoModal = document.getElementById('delete-photo-modal');
  const deletePhotoClose = document.getElementById('delete-photo-close');
  const deletePhotoCancel = document.getElementById('delete-photo-cancel');
  const deletePhotoConfirm = document.getElementById('delete-photo-confirm');
  
  let photoToDelete = null; // { id, type, index }

  const detailStatus = document.getElementById('detail-status');
  const detailVin = document.getElementById('detail-vin');
  const detailMake = document.getElementById('detail-make');
  const detailModel = document.getElementById('detail-model');
  const detailYear = document.getElementById('detail-year');
  const detailLot = document.getElementById('detail-lot');
  const detailPurchased = document.getElementById('detail-purchased');
  const detailArrival = document.getElementById('detail-arrival');
  const detailContainer = document.getElementById('detail-container');
  const detailShipping = document.getElementById('detail-shipping');
  const detailPriceAuction = document.getElementById('detail-price-auction');
  const detailPriceTransport = document.getElementById('detail-price-transport');

  const params = new URLSearchParams(window.location.search);
  const dealerId = params.get('dealerId');

  let dealer = null;
  let cars = [];
  let editCarId = null;
  let currentDetailCarId = null;
  let detailImages = []; // Array of { url, id, type }
  let newDetailFiles = []; // File objects
  let newDetailPreviews = []; // Preview URLs
  let currentMode = 'edit'; // 'edit' or 'action'

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : null;
  };

  const getCachedDealers = () => {
    try {
      const raw = sessionStorage.getItem(DEALER_CACHE_KEY);
      if (!raw) return [];
      const cached = JSON.parse(raw);
      return Array.isArray(cached) ? cached : [];
    } catch (error) {
      console.warn('Unable to read dealer cache.', error);
      return [];
    }
  };

  const getDealerId = (d) => {
    if (!d) return '';
    const existingId = d.id ?? d.dealerId ?? d.uuid ?? d.username ?? d.email;
    if (existingId !== undefined && existingId !== null && existingId !== '') {
      return String(existingId);
    }
    return d.__dealerRowId || '';
  };

  function showErrorView() {
    dealerContentSection.classList.add('hidden');
    dealerErrorSection.classList.remove('hidden');
  }

  function showDealerView() {
    dealerErrorSection.classList.add('hidden');
    dealerContentSection.classList.remove('hidden');
  }

  function showLoadingState() {
    if (!carGridEl) return;
    carGridEl.innerHTML = '<div class="car-empty-row">მანქანები იტვირთება...</div>';
  }

  function getCorrectPhotoUrl(url) {
    if (!url) return '';
    if (url.startsWith('data:')) return url;

    // Extract filename from URL or path
    const parts = url.split('/');
    let filename = parts[parts.length - 1];

    // Remove query parameters if present
    if (filename.includes('?')) {
      filename = filename.split('?')[0];
    }

    // Construct the required endpoint: host/photo/{photoname}
    return `http://57.131.25.31:8080/photo/${filename}`;
  }

  async function loadProtectedImages(container) {
    const images = container.querySelectorAll('img[data-src]');
    const token = getToken();
    
    const promises = Array.from(images).map(async (img) => {
      const rawUrl = img.getAttribute('data-src');
      if (!rawUrl) return;
      
      const url = getCorrectPhotoUrl(rawUrl);
      
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const res = await fetch(url, { headers });
        if (res.ok) {
          const blob = await res.blob();
          const objUrl = URL.createObjectURL(blob);
          img.src = objUrl;
          img.removeAttribute('data-src');
        } else {
           console.error('Failed to load image:', url, res.status);
        }
      } catch (err) {
        console.error('Error fetching image blob:', err);
      }
    });
    
    await Promise.all(promises);
  }

  function getCarImages(car) {
    // Return array of photo objects
    if (Array.isArray(car.carPhotos) && car.carPhotos.length) {
      return car.carPhotos.map(p => ({
        url: p.photoUrl,
        id: p.id,
        type: p.photoType
      }));
    }
    if (Array.isArray(car.images) && car.images.length) {
      // Fallback for manual images without ID
      return car.images.map((url, i) => ({ url, id: null }));
    }
    if (car.image) {
      return [{ url: car.image, id: null }];
    }
    return [];
  }

  function setDetailText(element, value) {
    if (!element) return;
    const v = value && String(value).trim() ? String(value) : '';
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
      element.value = v;
    } else {
      element.textContent = v || '-';
    }
  }

  // 3-section image rendering logic
  function renderDetailImages() {
    // Render for each type: 0, 1, 2
    [0, 1, 2].forEach(type => {
      const container = document.getElementById(`car-detail-images-row-${type}`);
      if (!container) return;

      const uploadSlotHtml = `
        <div class="car-detail-image-slot car-detail-image-upload" id="upload-slot-${type}">
          <div class="car-detail-image-upload-inner">
            <span class="upload-plus">+</span>
            <span class="upload-text">Add</span>
            <input id="input-${type}" type="file" accept=".jpg, .jpeg, image/jpeg" multiple />
          </div>
        </div>
      `;

      // Filter existing images for this type
      const existingHtml = (detailImages || [])
        .map((img, idx) => ({ ...img, originalIndex: idx }))
        .filter(img => (img.type ?? 0) === type)
        .map(
          (imgObj) => `
        <div class="car-detail-image-slot">
          <img
            data-src="${imgObj.url}"
            src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
            alt="Car image"
            class="car-detail-image-thumb-img"
          />
          <button
            type="button"
            class="car-detail-image-remove"
            data-type="existing"
            data-index="${imgObj.originalIndex}"
          >
            ×
          </button>
        </div>
      `
        )
        .join('');

      // Filter new images for this type
      const newHtml = (newDetailFiles || [])
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter(item => item.type === type)
        .map(
          (item) => `
        <div class="car-detail-image-slot">
          <img
            src="${item.preview}"
            alt="New image preview"
            class="car-detail-image-thumb-img"
            style="opacity: 0.8; border: 2px solid #3b82f6;"
          />
          <button
            type="button"
            class="car-detail-image-remove"
            data-type="new"
            data-index="${item.originalIndex}"
          >
            ×
          </button>
        </div>
      `
        )
        .join('');

      container.innerHTML = uploadSlotHtml + existingHtml + newHtml;
      
      loadProtectedImages(container);

      // Bind input event
      const input = document.getElementById(`input-${type}`);
      input?.addEventListener('change', (event) => {
        const target = event.target;
        if (!target || !target.files || !target.files.length) return;

        const files = Array.from(target.files);
        
        files.forEach((file) => {
          // Validate file type (only JPG/JPEG allowed)
          if (!file.type.match('image/jpeg') && !file.name.match(/\.(jpg|jpeg)$/i)) {
             alert(`File "${file.name}" is not a valid JPG image.`);
             return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              // Add to newDetailFiles with type
              newDetailFiles.push({
                file: file,
                preview: reader.result,
                type: type
              });
              renderDetailImages();
            }
          };
          reader.readAsDataURL(file);
        });

        target.value = '';
      });
    });

    // Bind delete events globally for the container to handle dynamic elements
    // Actually, I'll just let the global click listener handle it if I update logic there
  }

  function openCarDetailModal(car, mode = 'edit') {
    if (!carDetailModal) return;
    currentMode = mode;

    if (mode === 'edit') {
      carDetailTitle.textContent = 'Edit Car Info';
      // Show info, hide action
      if (detailInfoSection) {
        detailInfoSection.style.display = 'block';
        // Enable inputs
        detailInfoSection.querySelectorAll('input').forEach(el => el.disabled = false);
      }
      if (detailActionSection) {
        detailActionSection.style.display = 'none';
      }
    } else {
      // Action mode
      carDetailTitle.textContent = 'Car Actions';
      // Show action, Hide info
      if (detailInfoSection) {
        detailInfoSection.style.display = 'none';
      }
      if (detailActionSection) {
        detailActionSection.style.display = 'block';
      }
    }
    
    // Reset new files
    newDetailFiles = [];
    newDetailPreviews = [];

    setDetailText(detailVin, car.vin);

    detailImages = getCarImages(car);
    renderDetailImages();

    // Fetch fresh photos from admin endpoint
    if (window.carPhotosApi && window.carPhotosApi.getCarPhotos) {
      window.carPhotosApi.getCarPhotos(car.id)
        .then((data) => {
          // The API might return an array directly or an object with data property
          const photos = Array.isArray(data) ? data : (data.data || []);
          
          if (Array.isArray(photos)) {
            detailImages = photos.map(p => ({
              url: p.photoUrl,
              id: p.id,
              type: p.photoType
            }));
            renderDetailImages();
          }
        })
        .catch(err => console.error('Failed to load fresh car photos:', err));
    }

    setDetailText(detailMake, car.make);
    setDetailText(detailModel, car.model);
    setDetailText(detailYear, car.year);
    setDetailText(detailLot, car.lotNumber);

    setDetailText(detailPurchased, car.purchasedDate);
    setDetailText(detailArrival, car.arrivalDate);
    setDetailText(detailContainer, car.containerNumber);
    setDetailText(detailShipping, car.shippingLine);

    setDetailText(detailPriceAuction, car.priceAuction);
    setDetailText(detailPriceTransport, car.priceTransport);

    let statusVal = '0';
    const statusStr = (car.status || '').toLowerCase();
    if (statusStr === 'loading') statusVal = '1';
    if (statusStr === 'arrived') statusVal = '2';
    if (detailStatus) detailStatus.value = statusVal;

    currentDetailCarId = car.id;
    carDetailModal.setAttribute('aria-hidden', 'false');
    carDetailModal.classList.add('open');
  }

  function closeCarDetailModal() {
    if (!carDetailModal) return;
    carDetailModal.classList.remove('open');
    carDetailModal.setAttribute('aria-hidden', 'true');
  }

  // Normalize car data from API to internal format
  function normalizeCar(apiCar, index) {
    let images = [];
    let status = 'purchasing';
    
    if (Array.isArray(apiCar.carPhotos) && apiCar.carPhotos.length) {
      images = apiCar.carPhotos.map(photo => photo.photoUrl).filter(Boolean);
      const types = apiCar.carPhotos.map(p => p.photoType);
      if (types.includes(2)) status = 'arrived';
      else if (types.includes(1)) status = 'loading';
    } else if (Array.isArray(apiCar.images)) {
      images = apiCar.images;
    } else if (apiCar.image) {
      images = [apiCar.image];
    }

    return {
      id: apiCar.id || apiCar.carId || `car-${index}`,
      title: `${apiCar.manufacturer || ''} ${apiCar.model || ''}`.trim() || 'Unknown Car',
      vin: apiCar.vin || '',
      year: apiCar.manufacturedYear || '',
      status: status,
      make: apiCar.manufacturer || '',
      model: apiCar.model || '',
      lotNumber: apiCar.lotNumber || '',
      purchasedDate: apiCar.purchaseDate || '',
      arrivalDate: apiCar.estimatedArrivalDate || '',
      containerNumber: apiCar.containerCode || '',
      shippingLine: apiCar.transporterLine || '',
      priceAuction: apiCar.auctionPrice || '',
      priceTransport: apiCar.transportingPrice || '',
      images: images,
      image: images.length ? images[0] : null,
      carOwnerId: apiCar.carOwnerId,
      vehicleTypeId: apiCar.vehicleTypeId,
      destinationPortId: apiCar.destinationPortId,
      carPhotos: apiCar.carPhotos || [] // Keep original objects for reference
    };
  }

  async function fetchCarsFromApi(userId) {
    const token = getToken();
    if (!token) {
      console.error('Missing authentication token.');
      return [];
    }

    try {
      const url = `${CARS_ENDPOINT}/${encodeURIComponent(userId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch cars: ${response.status}`);
        return [];
      }

      const data = await response.json();
      
      let carsArray = [];
      if (Array.isArray(data)) {
        carsArray = data;
      } else if (data && Array.isArray(data.cars)) {
        carsArray = data.cars;
      } else if (data && Array.isArray(data.data)) {
        carsArray = data.data;
      }

      return carsArray.map((car, index) => normalizeCar(car, index));
    } catch (error) {
      console.error('Error fetching cars from API:', error);
      return [];
    }
  }

  async function hydrateDealer() {
    if (!dealerId) {
      showErrorView();
      return;
    }

    const cachedDealers = getCachedDealers();
    dealer = cachedDealers.find((d) => getDealerId(d) === dealerId);
    
    if (!dealer) {
      showErrorView();
      return;
    }

    dealerNameHeading.textContent = dealer.name || 'Dealer';
    dealerEmailLine.textContent = dealer.email || dealer.username || '-';

    if (dealerPhoneLine) {
      dealerPhoneLine.textContent = dealer.phone || dealer.phoneNumber || dealer.contactNumber || dealer.contact_number || '-';
    }

    showDealerView();
    showLoadingState();

    cars = await fetchCarsFromApi(dealerId);

    if (dealerTotalCountEl) {
      dealerTotalCountEl.textContent = String(cars.length);
    }

    renderCars();
  }

  function applyCarFilters(list) {
    const term = String(carSearchInput.value || '').trim().toLowerCase();
    const statusFilter = carStatusFilter.value;

    return list.filter((car) => {
      const matchesTerm =
        !term ||
        (car.title || '').toLowerCase().includes(term) ||
        (car.vin || '').toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : (car.status || '').toLowerCase() === statusFilter;

      return matchesTerm && matchesStatus;
    });
  }

  function renderCars() {
    if (!carGridEl) return;

    const filtered = applyCarFilters(cars || []);

    if (dealerTotalCountEl) {
      dealerTotalCountEl.textContent = String(cars.length);
    }

    if (!filtered.length) {
      carGridEl.innerHTML =
        '<div class="car-empty-row">მანქანები ვერ მოიძებნა ამ დილერისთვის.</div>';
      return;
    }

    carGridEl.innerHTML = filtered
      .map((car) => {
        const status = (car.status || 'purchasing').toLowerCase();
        let statusLabel = 'Purchasing';
        if (status === 'loading') statusLabel = 'Loading';
        if (status === 'arrived') statusLabel = 'Arrived';

        const year = car.year || '-';
        const vin = car.vin || '-';

        // Pick the first available photo from carPhotos API field
        let mainImage = null;
        if (Array.isArray(car.carPhotos) && car.carPhotos.length > 0) {
           // Try to find first valid photo object with URL
           const photoObj = car.carPhotos.find(p => p && p.photoUrl);
           if (photoObj) {
             mainImage = photoObj.photoUrl;
           }
        }

        // Fallback to legacy images array or single image
        if (!mainImage) {
          if (Array.isArray(car.images) && car.images.length > 0) {
             mainImage = car.images[0];
          } else if (car.image) {
             mainImage = car.image;
          }
        }

        const imageHtml = mainImage
          ? `<img class="car-img" data-src="${mainImage}" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="${(car.title || '').replace(/"/g, '&quot;')}" />`
          : `<div class="car-img car-img-placeholder">
               <span class="no-image-text">No Image</span>
             </div>`;

        return `
          <div class="car-card glass-card" data-id="${car.id}">
            <div class="car-img-container">
              <div class="status-badge status-${
                status === 'arrived'
                  ? 'arrived'
                  : status === 'loading'
                  ? 'loading'
                  : 'transit'
              }">
                ${statusLabel}
              </div>
              ${imageHtml}
            </div>
            <div class="car-details">
              <div class="car-title-row">
                <h3 class="car-title">${car.title || 'Untitled car'}</h3>
              </div>
              <div class="car-meta">
                <span>${year}</span>
                <span>${vin}</span>
              </div>
              <div class="car-card-actions" style="display: flex; gap: 8px; margin-top: 10px;">
                <button type="button" class="btn btn-outline car-edit-mode-btn" style="flex: 1; padding: 6px;">Edit</button>
                <button type="button" class="btn btn-primary car-action-btn" style="flex: 1; padding: 6px;">Photo</button>
              </div>
            </div>
          </div>
        `;
      })
      .join('');
      
    loadProtectedImages(carGridEl);
  }

  function clearFormErrors() {
    carFormError.textContent = '';
    const inputs = [
      carMakeInput,
      carModelInput,
      carYearInput,
      carLotNumberInput,
      carPurchasedDateInput,
      carArrivalDateInput,
      carContainerNumberInput,
      carShippingLineInput,
      carPriceAuctionInput,
      carPriceTransportInput,
      carVinInput,
    ];
    inputs.forEach((input) => input?.classList.remove('error'));
  }

  function openCarModal(mode, car) {
    clearFormErrors();

    if (mode === 'edit' && car) {
      editCarId = car.id;
      carModalTitle.textContent = 'Edit car';
      carMakeInput.value = car.make || '';
      carModelInput.value = car.model || '';
      carVinInput.value = car.vin || '';
      carYearInput.value = car.year || '';
      carLotNumberInput.value = car.lotNumber || '';
      carPurchasedDateInput.value = car.purchasedDate || '';
      carArrivalDateInput.value = car.arrivalDate || '';
      carContainerNumberInput.value = car.containerNumber || '';
      carShippingLineInput.value = car.shippingLine || '';
      carPriceAuctionInput.value = car.priceAuction || '';
      carPriceTransportInput.value = car.priceTransport || '';
    } else {
      editCarId = null;
      carModalTitle.textContent = 'New car';
      carMakeInput.value = '';
      carModelInput.value = '';
      carVinInput.value = '';
      carYearInput.value = '';
      carLotNumberInput.value = '';
      carPurchasedDateInput.value = '';
      carArrivalDateInput.value = '';
      carContainerNumberInput.value = '';
      carShippingLineInput.value = '';
      carPriceAuctionInput.value = '';
      carPriceTransportInput.value = '';
    }

    carModal.setAttribute('aria-hidden', 'false');
    carModal.classList.add('open');
  }

  function closeCarModal() {
    carModal.classList.remove('open');
    carModal.setAttribute('aria-hidden', 'true');
  }

  async function handleCarFormSubmit(event) {
    event.preventDefault();
    clearFormErrors();

    const make = String(carMakeInput.value || '').trim();
    const model = String(carModelInput.value || '').trim();
    const vin = String(carVinInput.value || '').trim();
    const year = String(carYearInput.value || '').trim();
    const lotNumber = String(carLotNumberInput.value || '').trim();
    const purchasedDate = String(carPurchasedDateInput.value || '').trim();
    const arrivalDate = String(carArrivalDateInput.value || '').trim();
    const containerNumber = String(carContainerNumberInput.value || '').trim();
    const shippingLine = String(carShippingLineInput.value || '').trim();
    const priceAuction = String(carPriceAuctionInput.value || '').trim();
    const priceTransport = String(carPriceTransportInput.value || '').trim();

    const requiredFields = [
      { el: carMakeInput, value: make },
      { el: carModelInput, value: model },
      { el: carYearInput, value: year },
      { el: carLotNumberInput, value: lotNumber },
      { el: carVinInput, value: vin },
      { el: carPurchasedDateInput, value: purchasedDate },
      { el: carArrivalDateInput, value: arrivalDate },
      { el: carContainerNumberInput, value: containerNumber },
      { el: carShippingLineInput, value: shippingLine },
      { el: carPriceAuctionInput, value: priceAuction },
      { el: carPriceTransportInput, value: priceTransport },
    ];

    const firstMissing = requiredFields.find((f) => !f.value);
    if (firstMissing) {
      carFormError.textContent = 'Please fill in all required fields.';
      firstMissing.el.classList.add('error');
      firstMissing.el.focus();
      return;
    }

    const carData = {
      manufacturer: make,
      model: model,
      vin: vin,
      manufacturedYear: year,
      lotNumber: lotNumber,
      purchaseDate: purchasedDate,
      estimatedArrivalDate: arrivalDate,
      containerCode: containerNumber,
      transporterLine: shippingLine,
      auctionPrice: priceAuction,
      transportingPrice: priceTransport,
      carOwnerId: dealerId,
      carPhotos: [],
    };

    const addCarApi = window.carApi?.addCar;
    if (typeof addCarApi !== 'function') {
      carFormError.textContent = 'Car API unavailable. Please refresh the page.';
      return;
    }

    try {
      await addCarApi(carData);
      cars = await fetchCarsFromApi(dealerId);
      renderCars();
      closeCarModal();
    } catch (error) {
      console.error('Failed to add car via API', error);
      carFormError.textContent =
        error instanceof Error ? error.message : 'Failed to add car.';
    }
  }

  // Event bindings
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
  });

  carSearchInput?.addEventListener('input', () => {
    renderCars();
  });

  carStatusFilter?.addEventListener('change', () => {
    renderCars();
  });

  newCarBtn?.addEventListener('click', () => {
    openCarModal('create');
  });

  carModalClose?.addEventListener('click', closeCarModal);
  carModalCancel?.addEventListener('click', closeCarModal);

  carModal.addEventListener('click', (event) => {
    if (event.target === carModal) {
      closeCarModal();
    }
  });

  carForm.addEventListener('submit', handleCarFormSubmit);

  // Detail modal form handlers
  carDetailForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentDetailCarId) {
      closeCarDetailModal();
      return;
    }

    const index = cars.findIndex((c) => c.id === currentDetailCarId);
    if (index === -1) {
      closeCarDetailModal();
      return;
    }

    const car = cars[index];
    const statusVal = detailStatus ? parseInt(detailStatus.value, 10) : 0;
    
    const keptPhotos = detailImages.map(img => ({
      id: img.id || 0,
      photoUrl: img.url,
      photoType: img.type || 0
    }));

    const updatedData = {
      id: car.id,
      manufacturer: String(detailMake?.value || '').trim(),
      model: String(detailModel?.value || '').trim(),
      vin: String(detailVin?.value || '').trim(),
      manufacturedYear: String(detailYear?.value || '').trim(),
      lotNumber: String(detailLot?.value || '').trim(),
      purchaseDate: String(detailPurchased?.value || '').trim(),
      estimatedArrivalDate: String(detailArrival?.value || '').trim(),
      containerCode: String(detailContainer?.value || '').trim(),
      transporterLine: String(detailShipping?.value || '').trim(),
      auctionPrice: String(detailPriceAuction?.value || '').trim(),
      transportingPrice: String(detailPriceTransport?.value || '').trim(),
      carOwnerId: car.carOwnerId,
      vehicleTypeId: car.vehicleTypeId,
      destinationPortId: car.destinationPortId,
      status: statusVal,
      carPhotos: keptPhotos 
    };

    const saveCarApi = window.carApi?.saveCar;
    const updateCarApi = window.carEditApi?.updateCar;
    const uploadPhotoApi = window.carPhotosApi?.uploadCarPhoto;

    if (typeof saveCarApi !== 'function') {
      console.error('Car API unavailable');
      return;
    }

    try {
      // 1. Save car details (only in edit mode)
      if (currentMode === 'edit' && updateCarApi) {
         await updateCarApi(updatedData);
      }

      // 2. Upload new photos
      if (currentMode === 'action' && newDetailFiles.length > 0 && uploadPhotoApi) {
        // Group files by type to send separate requests for Purchasing (0), Loading (1), Arrived (2)
        const filesByType = {};
        for (const item of newDetailFiles) {
          if (!filesByType[item.type]) {
            filesByType[item.type] = [];
          }
          filesByType[item.type].push(item.file);
        }

        // Send request for each type
        for (const typeStr in filesByType) {
          const type = parseInt(typeStr, 10);
          const files = filesByType[type];
          if (files && files.length > 0) {
             await uploadPhotoApi(car.id, type, files);
          }
        }
      }

      // 3. Reload data
      cars = await fetchCarsFromApi(dealerId);
      renderCars();
      
      closeCarDetailModal();
    } catch (error) {
      console.error('Failed to update car', error);
      alert('Failed to update car. Please try again.');
    }
  });

  carDetailCancel?.addEventListener('click', closeCarDetailModal);
  carDetailClose?.addEventListener('click', closeCarDetailModal);
  
  carDetailModal?.addEventListener('click', (event) => {
    if (event.target === carDetailModal) {
      closeCarDetailModal();
    }
  });

  function openDeletePhotoModal(id, type, index) {
    photoToDelete = { id, type, index };
    deletePhotoModal.setAttribute('aria-hidden', 'false');
    deletePhotoModal.classList.add('open');
  }

  function closeDeletePhotoModal() {
    photoToDelete = null;
    deletePhotoModal.classList.remove('open');
    deletePhotoModal.setAttribute('aria-hidden', 'true');
  }

  // Detail action section click handler for dynamic remove buttons and upload slots
  detailActionSection?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.classList.contains('car-detail-image-remove')) {
      const indexAttr = target.getAttribute('data-index');
      const type = target.dataset.type; // 'existing' or 'new'
      const index = indexAttr ? parseInt(indexAttr, 10) : -1;
      
      if (type === 'new' && index >= 0 && index < newDetailFiles.length) {
        newDetailFiles.splice(index, 1);
        renderDetailImages();
      } else if (type === 'existing' && index >= 0 && index < detailImages.length) {
        // If it's an existing image (saved on server), confirm deletion
        const img = detailImages[index];
        if (img && img.id) {
           openDeletePhotoModal(img.id, 'existing', index);
        } else {
           // Fallback if no ID (legacy or local only), just remove from UI array
           detailImages.splice(index, 1);
           renderDetailImages();
        }
      }
    } else {
      // Check if clicked inside an upload slot
      const uploadSlot = target.closest('.car-detail-image-upload');
      if (uploadSlot) {
        // Find the input inside this specific slot
        const input = uploadSlot.querySelector('input[type="file"]');
        if (input) {
          input.click();
        }
      }
    }
  });

  deletePhotoClose?.addEventListener('click', closeDeletePhotoModal);
  deletePhotoCancel?.addEventListener('click', closeDeletePhotoModal);
  
  deletePhotoConfirm?.addEventListener('click', async () => {
    if (!photoToDelete) return;

    // Set loading state
    const originalText = deletePhotoConfirm.textContent;
    deletePhotoConfirm.disabled = true;
    deletePhotoConfirm.textContent = 'Deleting';
    
    try {
      const deleteApi = window.carPhotosDeleteApi?.deleteCarPhoto;
      if (deleteApi && photoToDelete.type === 'existing') {
         await deleteApi(photoToDelete.id);
         
         // Remove from local array
         const idx = detailImages.findIndex(img => img.id === photoToDelete.id);
         if (idx !== -1) {
           detailImages.splice(idx, 1);
         }
         renderDetailImages();
      }
      closeDeletePhotoModal();
    } catch (error) {
      console.error('Failed to delete photo', error);
      alert('Failed to delete photo');
    } finally {
      // Restore button state
      deletePhotoConfirm.disabled = false;
      deletePhotoConfirm.textContent = originalText;
    }
  });

  carGridEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const card = target.closest('.car-card');
    if (!card) return;

    const id = card.getAttribute('data-id');
    if (!id) return;
    
    const car = cars.find((c) => c.id == id); 

    if (target.classList.contains('car-edit-mode-btn')) {
      if (car) openCarDetailModal(car, 'edit');
    } else if (target.classList.contains('car-action-btn')) {
      if (car) openCarDetailModal(car, 'action');
    }
  });

  // Init
  hydrateDealer();
});
