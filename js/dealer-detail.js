document.addEventListener('DOMContentLoaded', () => {
  // Simple session guard
  const session = localStorage.getItem('adminSession');
  if (session !== 'active') {
    window.location.href = 'index.html';
    return;
  }

  const dealerErrorSection = document.getElementById('dealer-error');
  const dealerContentSection = document.getElementById('dealer-content');

  const dealerNameHeading = document.getElementById('dealer-name-heading');
  const dealerEmailLine = document.getElementById('dealer-email-line');
  const dealerStatusPill = document.getElementById('dealer-status-pill');
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

  const carTitleInput = document.getElementById('car-title');
  const carMakeInput = document.getElementById('car-make');
  const carModelInput = document.getElementById('car-model');
  const carVinInput = document.getElementById('car-vin');
  const carYearInput = document.getElementById('car-year');
  const carLotNumberInput = document.getElementById('car-lot-number');
  const carPurchasedDateInput = document.getElementById('car-purchased-date');
  const carArrivalDateInput = document.getElementById('car-arrival-date');
  const carContainerNumberInput = document.getElementById('car-container-number');
  const carShippingLineInput = document.getElementById('car-shipping-line');
  const carOwnerNameInput = document.getElementById('car-owner-name');
  const carOwnerPhoneInput = document.getElementById('car-owner-phone');
  const carOwnerAddressInput = document.getElementById('car-owner-address');
  const carPriceAuctionInput = document.getElementById('car-price-auction');
  const carPriceTransportInput = document.getElementById('car-price-transport');
  const carStatusSelect = document.getElementById('car-status');

  const carFormImagesRow = document.getElementById('car-form-images-row');

  // Detail modal elements (editable)
  const carDetailModal = document.getElementById('car-detail-modal');
  const carDetailTitle = document.getElementById('car-detail-title');
  const carDetailClose = document.getElementById('car-detail-close');
  const carDetailForm = document.getElementById('car-detail-form');
  const carDetailCancel = document.getElementById('car-detail-cancel');
  const carDetailImagesRow = document.getElementById('car-detail-images-row');
  const detailVin = document.getElementById('detail-vin');
  const detailMake = document.getElementById('detail-make');
  const detailModel = document.getElementById('detail-model');
  const detailYear = document.getElementById('detail-year');
  const detailLot = document.getElementById('detail-lot');
  const detailPurchased = document.getElementById('detail-purchased');
  const detailArrival = document.getElementById('detail-arrival');
  const detailContainer = document.getElementById('detail-container');
  const detailShipping = document.getElementById('detail-shipping');
  const detailOwner = document.getElementById('detail-owner');
  const detailPhone = document.getElementById('detail-phone');
  const detailAddress = document.getElementById('detail-address');
  const detailPriceAuction = document.getElementById('detail-price-auction');
  const detailPriceTransport = document.getElementById('detail-price-transport');

  const params = new URLSearchParams(window.location.search);
  const dealerId = params.get('dealerId');

  let dealers = [];
  let dealer = null;
  let cars = [];
  let editCarId = null;
  let formImages = [];
  let currentDetailCarId = null;
  let detailImages = [];

  function showErrorView() {
    dealerContentSection.classList.add('hidden');
    dealerErrorSection.classList.remove('hidden');
  }

  function showDealerView() {
    dealerErrorSection.classList.add('hidden');
    dealerContentSection.classList.remove('hidden');
  }

  function loadDealers() {
    try {
      const raw = localStorage.getItem('adminDealers');
      if (!raw) {
        dealers = [];
      } else {
        dealers = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load dealers', e);
      dealers = [];
    }
  }

  function getCarImages(car) {
    if (Array.isArray(car.images)) {
      return car.images.slice();
    }
    if (car.image) {
      return [car.image];
    }
    return [];
  }

  function saveDealers() {
    localStorage.setItem('adminDealers', JSON.stringify(dealers));
  }

  function setDetailText(element, value) {
    if (!element) return;
    const v = value && String(value).trim() ? String(value) : '';
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = v;
    } else {
      element.textContent = v || '-';
    }
  }

  function renderFormImages() {
    if (!carFormImagesRow) return;

    const uploadSlotHtml = `
      <div class="car-detail-image-slot car-detail-image-upload" id="car-form-image-upload-slot">
        <div class="car-detail-image-upload-inner">
          <span class="upload-plus">+</span>
          <span class="upload-text">Add images</span>
          <input id="car-form-images-input" type="file" accept="image/*" multiple />
        </div>
      </div>
    `;

    const thumbsHtml = (formImages || [])
      .map(
        (src, index) => `
      <div class="car-detail-image-slot">
        <img
          src="${src}"
          alt="Car image ${index + 1}"
          class="car-detail-image-thumb-img"
        />
        <button
          type="button"
          class="car-detail-image-remove"
          data-index="${index}"
        >
          ×
        </button>
      </div>
    `
      )
      .join('');

    carFormImagesRow.innerHTML = uploadSlotHtml + thumbsHtml;

    const input = document.getElementById('car-form-images-input');
    input?.addEventListener('change', (event) => {
      const target = event.target;
      if (!target || !target.files || !target.files.length) return;

      const files = Array.from(target.files);
      let remaining = files.length;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            formImages.push(reader.result);
          }
          remaining -= 1;
          if (remaining === 0) {
            renderFormImages();
          }
        };
        reader.readAsDataURL(file);
      });

      target.value = '';
    });
  }

  function renderDetailImages() {
    if (!carDetailImagesRow) return;

    const uploadSlotHtml = `
      <div class="car-detail-image-slot car-detail-image-upload" id="car-detail-image-upload-slot">
        <div class="car-detail-image-upload-inner">
          <span class="upload-plus">+</span>
          <span class="upload-text">Add images</span>
          <input id="car-detail-images-input" type="file" accept="image/*" multiple />
        </div>
      </div>
    `;

    const thumbsHtml = (detailImages || [])
      .map(
        (src, index) => `
      <div class="car-detail-image-slot">
        <img
          src="${src}"
          alt="Car image ${index + 1}"
          class="car-detail-image-thumb-img"
        />
        <button
          type="button"
          class="car-detail-image-remove"
          data-index="${index}"
        >
          ×
        </button>
      </div>
    `
      )
      .join('');

    carDetailImagesRow.innerHTML = uploadSlotHtml + thumbsHtml;

    const input = document.getElementById('car-detail-images-input');
    input?.addEventListener('change', (event) => {
      const target = event.target;
      if (!target || !target.files || !target.files.length) return;

      const files = Array.from(target.files);
      let remaining = files.length;

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            detailImages.push(reader.result);
          }
          remaining -= 1;
          if (remaining === 0) {
            renderDetailImages();
          }
        };
        reader.readAsDataURL(file);
      });

      // clear input so same files can be re-selected if needed
      target.value = '';
    });
  }

  function openCarDetailModal(car) {
    if (!carDetailModal) return;

    if (carDetailTitle) {
      carDetailTitle.textContent = car.title || 'Car';
    }
    setDetailText(detailVin, car.vin);

    // reset and hydrate detail images from car
    detailImages = getCarImages(car);
    renderDetailImages();

    setDetailText(detailMake, car.make);
    setDetailText(detailModel, car.model || car.title);
    setDetailText(detailYear, car.year);
    setDetailText(detailLot, car.lotNumber);

    setDetailText(detailPurchased, car.purchasedDate);
    setDetailText(detailArrival, car.arrivalDate);
    setDetailText(detailContainer, car.containerNumber);
    setDetailText(detailShipping, car.shippingLine);

    setDetailText(detailOwner, car.ownerName);
    setDetailText(detailPhone, car.ownerPhone);
    setDetailText(detailAddress, car.ownerAddress);

    setDetailText(detailPriceAuction, car.priceAuction);
    setDetailText(detailPriceTransport, car.priceTransport);

    currentDetailCarId = car.id;
    carDetailModal.setAttribute('aria-hidden', 'false');
    carDetailModal.classList.add('open');
  }

  function closeCarDetailModal() {
    if (!carDetailModal) return;
    carDetailModal.classList.remove('open');
    carDetailModal.setAttribute('aria-hidden', 'true');
  }

  function hydrateDealer() {
    loadDealers();
    if (!dealerId) {
      showErrorView();
      return;
    }

    dealer = dealers.find((d) => d.id === dealerId);
    if (!dealer) {
      showErrorView();
      return;
    }

    if (!Array.isArray(dealer.cars)) {
      dealer.cars = [];
    }
    cars = dealer.cars;

    // Seed demo cars the first time a dealer is opened and has no cars yet
    if (cars.length === 0) {
      const baseId = Date.now();

      if (dealer.id === 'd1') {
        cars = [
          {
            id: `c${baseId}-1`,
            title: '2019 BMW 330i xDrive',
            vin: 'WBA8D9G59JNU12345',
            year: '2019',
            status: 'purchasing',
            make: 'BMW',
            model: '330i xDrive',
            lotNumber: 'LOT-1001',
            purchasedDate: '2024-02-15',
            arrivalDate: '2024-04-10',
            containerNumber: 'MSKU1234567',
            shippingLine: 'Maersk',
            ownerName: 'Auto City LLC',
            ownerPhone: '+1 555 0101',
            ownerAddress: '123 Harbor St, Los Angeles, CA',
            priceAuction: '$18,500',
            priceTransport: '$2,100',
          },
          {
            id: `c${baseId}-2`,
            title: '2020 Audi Q5 Premium Plus',
            vin: 'WA1BNAFY4L2012345',
            year: '2020',
            status: 'loading',
            make: 'Audi',
            model: 'Q5 Premium Plus',
            lotNumber: 'LOT-1002',
            purchasedDate: '2024-03-05',
            arrivalDate: '2024-05-01',
            containerNumber: 'CMAU7654321',
            shippingLine: 'CMA CGM',
            ownerName: 'Auto City LLC',
            ownerPhone: '+1 555 0101',
            ownerAddress: '123 Harbor St, Los Angeles, CA',
            priceAuction: '$27,800',
            priceTransport: '$2,350',
          },
        ];
      } else if (dealer.id === 'd2') {
        cars = [
          {
            id: `c${baseId}-1`,
            title: '2018 Mercedes C300',
            vin: '55SWF4KBXJU123456',
            year: '2018',
            status: 'arrived',
            make: 'Mercedes-Benz',
            model: 'C300',
            lotNumber: 'LOT-2001',
            purchasedDate: '2023-12-02',
            arrivalDate: '2024-02-01',
            containerNumber: 'MSCU2345678',
            shippingLine: 'Maersk',
            ownerName: 'Prime Motors',
            ownerPhone: '+1 555 0202',
            ownerAddress: '45 Downtown Ave, Miami, FL',
            priceAuction: '$21,400',
            priceTransport: '$1,950',
          },
        ];
      } else if (dealer.id === 'd3') {
        cars = [
          {
            id: `c${baseId}-1`,
            title: '2021 Toyota Camry SE',
            vin: '4T1G11AK4MU123456',
            year: '2021',
            status: 'purchasing',
            make: 'Toyota',
            model: 'Camry SE',
            lotNumber: 'LOT-3001',
            purchasedDate: '2024-04-15',
            arrivalDate: '2024-06-10',
            containerNumber: 'OOLU3456789',
            shippingLine: 'OOCL',
            ownerName: 'Skyline Imports',
            ownerPhone: '+1 555 0303',
            ownerAddress: '78 Skyline Blvd, Seattle, WA',
            priceAuction: '$23,000',
            priceTransport: '$2,300',
          },
          {
            id: `c${baseId}-2`,
            title: '2022 Honda CR-V EX-L',
            vin: '2HKRW2H83NH123456',
            year: '2022',
            status: 'arrived',
            make: 'Honda',
            model: 'CR-V EX-L',
            lotNumber: 'LOT-3002',
            purchasedDate: '2024-01-25',
            arrivalDate: '2024-03-20',
            containerNumber: 'TGHU4567890',
            shippingLine: 'Hapag-Lloyd',
            ownerName: 'Skyline Imports',
            ownerPhone: '+1 555 0303',
            ownerAddress: '78 Skyline Blvd, Seattle, WA',
            priceAuction: '$29,600',
            priceTransport: '$2,450',
          },
        ];
      } else {
        // Generic demo cars for any other dealer without data yet
        cars = [
          {
            id: `c${baseId}-1`,
            title: 'Demo Car 1',
            vin: 'VIN-DEMO-0001',
            year: '2020',
            status: 'purchasing',
            make: 'Demo',
            model: 'Demo Model',
            lotNumber: 'LOT-0001',
            purchasedDate: '2024-01-01',
            arrivalDate: '2024-02-15',
            containerNumber: 'CONTAINER0001',
            shippingLine: 'Demo Line',
            ownerName: dealer.name || 'Demo Dealer',
            ownerPhone: dealer.phone || '',
            ownerAddress: 'Demo Address',
            priceAuction: '$10,000',
            priceTransport: '$1,500',
          },
        ];
      }

      dealer.cars = cars;
      dealers = dealers.map((d) => (d.id === dealer.id ? dealer : d));
      saveDealers();
    }

    dealerNameHeading.textContent = dealer.name || 'Dealer';
    dealerEmailLine.textContent = dealer.email || '-';

    if (dealerPhoneLine) {
      dealerPhoneLine.textContent = dealer.phone || '-';
    }

    const status = (dealer.status || 'active').toLowerCase();
    dealerStatusPill.textContent =
      status === 'active' ? 'Active' : 'Inactive';
    dealerStatusPill.classList.remove('status-active', 'status-inactive');
    dealerStatusPill.classList.add(
      status === 'active' ? 'status-active' : 'status-inactive'
    );

    if (dealerTotalCountEl) {
      dealerTotalCountEl.textContent = String(cars.length);
    }

    showDealerView();
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
        '<div class="car-empty-row">No cars found for this dealer. Try adjusting filters or add a new car.</div>';
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

        const mainImage =
          (Array.isArray(car.images) && car.images.length
            ? car.images[0]
            : car.image) || null;

        const imageHtml = mainImage
          ? `<img class="car-img" src="${mainImage}" alt="${(car.title || '').replace(/"/g, '&quot;')}" />`
          : '<div class="car-img car-img-placeholder"></div>';

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
            </div>
          </div>
        `;
      })
      .join('');
  }

  function openCarModal(mode, car) {
    carFormError.textContent = '';
    carTitleInput.classList.remove('error');
    carMakeInput.classList.remove('error');
    carModelInput.classList.remove('error');
    carYearInput.classList.remove('error');
    carLotNumberInput.classList.remove('error');
    carPurchasedDateInput.classList.remove('error');
    carArrivalDateInput.classList.remove('error');
    carContainerNumberInput.classList.remove('error');
    carShippingLineInput.classList.remove('error');
    carOwnerNameInput.classList.remove('error');
    carOwnerPhoneInput.classList.remove('error');
    carOwnerAddressInput.classList.remove('error');
    carPriceAuctionInput.classList.remove('error');
    carPriceTransportInput.classList.remove('error');
    carVinInput.classList.remove('error');

    if (mode === 'edit' && car) {
      editCarId = car.id;
      carModalTitle.textContent = 'Edit car';
      carTitleInput.value = car.title || '';
      carMakeInput.value = car.make || '';
      carModelInput.value = car.model || '';
      carVinInput.value = car.vin || '';
      carYearInput.value = car.year || '';
      carLotNumberInput.value = car.lotNumber || '';
      carPurchasedDateInput.value = car.purchasedDate || '';
      carArrivalDateInput.value = car.arrivalDate || '';
      carContainerNumberInput.value = car.containerNumber || '';
      carShippingLineInput.value = car.shippingLine || '';
      carOwnerNameInput.value = car.ownerName || '';
      carOwnerPhoneInput.value = car.ownerPhone || '';
      carOwnerAddressInput.value = car.ownerAddress || '';
      carPriceAuctionInput.value = car.priceAuction || '';
      carPriceTransportInput.value = car.priceTransport || '';
      carStatusSelect.value = (car.status || 'purchasing').toLowerCase();

      formImages = getCarImages(car);
      renderFormImages();
    } else {
      editCarId = null;
      carModalTitle.textContent = 'New car';
      carTitleInput.value = '';
      carMakeInput.value = '';
      carModelInput.value = '';
      carVinInput.value = '';
      carYearInput.value = '';
      carLotNumberInput.value = '';
      carPurchasedDateInput.value = '';
      carArrivalDateInput.value = '';
      carContainerNumberInput.value = '';
      carShippingLineInput.value = '';
      carOwnerNameInput.value = '';
      carOwnerPhoneInput.value = '';
      carOwnerAddressInput.value = '';
      carPriceAuctionInput.value = '';
      carPriceTransportInput.value = '';
      carStatusSelect.value = 'purchasing';

      formImages = [];
      renderFormImages();
    }

    carModal.setAttribute('aria-hidden', 'false');
    carModal.classList.add('open');
  }

  function closeCarModal() {
    carModal.classList.remove('open');
    carModal.setAttribute('aria-hidden', 'true');
  }

  function handleCarFormSubmit(event) {
    event.preventDefault();
    carFormError.textContent = '';
    carTitleInput.classList.remove('error');
    carMakeInput.classList.remove('error');
    carModelInput.classList.remove('error');
    carYearInput.classList.remove('error');
    carLotNumberInput.classList.remove('error');
    carPurchasedDateInput.classList.remove('error');
    carArrivalDateInput.classList.remove('error');
    carContainerNumberInput.classList.remove('error');
    carShippingLineInput.classList.remove('error');
    carOwnerNameInput.classList.remove('error');
    carOwnerPhoneInput.classList.remove('error');
    carOwnerAddressInput.classList.remove('error');
    carPriceAuctionInput.classList.remove('error');
    carPriceTransportInput.classList.remove('error');
    carVinInput.classList.remove('error');

    const title = String(carTitleInput.value || '').trim();
    const make = String(carMakeInput.value || '').trim();
    const model = String(carModelInput.value || '').trim();
    const vin = String(carVinInput.value || '').trim();
    const year = String(carYearInput.value || '').trim();
    const lotNumber = String(carLotNumberInput.value || '').trim();
    const purchasedDate = String(carPurchasedDateInput.value || '').trim();
    const arrivalDate = String(carArrivalDateInput.value || '').trim();
    const containerNumber = String(carContainerNumberInput.value || '').trim();
    const shippingLine = String(carShippingLineInput.value || '').trim();
    const ownerName = String(carOwnerNameInput.value || '').trim();
    const ownerPhone = String(carOwnerPhoneInput.value || '').trim();
    const ownerAddress = String(carOwnerAddressInput.value || '').trim();
    const priceAuction = String(carPriceAuctionInput.value || '').trim();
    const priceTransport = String(carPriceTransportInput.value || '').trim();
    const status = carStatusSelect.value || 'purchasing';

    const requiredFields = [
      { el: carTitleInput, value: title },
      { el: carMakeInput, value: make },
      { el: carModelInput, value: model },
      { el: carYearInput, value: year },
      { el: carLotNumberInput, value: lotNumber },
      { el: carPurchasedDateInput, value: purchasedDate },
      { el: carArrivalDateInput, value: arrivalDate },
      { el: carContainerNumberInput, value: containerNumber },
      { el: carShippingLineInput, value: shippingLine },
      { el: carOwnerNameInput, value: ownerName },
      { el: carOwnerPhoneInput, value: ownerPhone },
      { el: carOwnerAddressInput, value: ownerAddress },
      { el: carPriceAuctionInput, value: priceAuction },
      { el: carPriceTransportInput, value: priceTransport },
      { el: carVinInput, value: vin },
    ];

    const firstMissing = requiredFields.find((f) => !f.value);
    if (firstMissing) {
      carFormError.textContent = 'Please fill in all required fields.';
      firstMissing.el.classList.add('error');
      firstMissing.el.focus();
      return;
    }

    if (!Array.isArray(cars)) {
      cars = [];
    }

    const imagesToSave = (formImages || []).slice();
    const mainImage = imagesToSave.length ? imagesToSave[0] : null;

    if (!editCarId) {
      const id = `c${Date.now()}`;
      cars.push({
        id,
        title,
        make,
        model,
        vin,
        year,
        status,
        lotNumber,
        purchasedDate,
        arrivalDate,
        containerNumber,
        shippingLine,
        ownerName,
        ownerPhone,
        ownerAddress,
        priceAuction,
        priceTransport,
        images: imagesToSave,
        image: mainImage,
      });
    } else {
      cars = cars.map((c) =>
        c.id === editCarId
          ? {
              ...c,
              title,
              make,
              model,
              vin,
              year,
              status,
              lotNumber,
              purchasedDate,
              arrivalDate,
              containerNumber,
              shippingLine,
              ownerName,
              ownerPhone,
              ownerAddress,
              priceAuction,
              priceTransport,
              images: imagesToSave,
              image: mainImage,
            }
          : c
      );
    }

    // sync back to dealer and dealers array
    dealer.cars = cars;
    dealers = dealers.map((d) => (d.id === dealer.id ? dealer : d));
    saveDealers();

    renderCars();
    closeCarModal();
  }

  // Event bindings
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('adminSession');
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

  // Detail modal form handlers (inline edit + save)
  carDetailForm?.addEventListener('submit', (event) => {
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

    const prev = cars[index];

    const updatedImages = (detailImages || []).slice();
    const mainImage = updatedImages.length ? updatedImages[0] : null;

    const updated = {
      ...prev,
      vin: String(detailVin?.value || '').trim(),
      make: String(detailMake?.value || '').trim(),
      model: String(detailModel?.value || '').trim(),
      year: String(detailYear?.value || '').trim(),
      lotNumber: String(detailLot?.value || '').trim(),
      purchasedDate: String(detailPurchased?.value || '').trim(),
      arrivalDate: String(detailArrival?.value || '').trim(),
      containerNumber: String(detailContainer?.value || '').trim(),
      shippingLine: String(detailShipping?.value || '').trim(),
      ownerName: String(detailOwner?.value || '').trim(),
      ownerPhone: String(detailPhone?.value || '').trim(),
      ownerAddress: String(detailAddress?.value || '').trim(),
      priceAuction: String(detailPriceAuction?.value || '').trim(),
      priceTransport: String(detailPriceTransport?.value || '').trim(),
      images: updatedImages,
      image: mainImage,
    };

    cars[index] = updated;
    dealer.cars = cars;
    dealers = dealers.map((d) => (d.id === dealer.id ? dealer : d));
    saveDealers();
    renderCars();
    // keep modal open but refreshed with latest values
    openCarDetailModal(updated);
  });

  carDetailCancel?.addEventListener('click', () => {
    closeCarDetailModal();
  });

  // Close detail modal with X button and backdrop click
  carDetailClose?.addEventListener('click', closeCarDetailModal);
  carDetailModal?.addEventListener('click', (event) => {
    if (event.target === carDetailModal) {
      closeCarDetailModal();
    }
  });

  // Detail images row interaction (delete + open file picker)
  carDetailImagesRow?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.classList.contains('car-detail-image-remove')) {
      const indexAttr = target.getAttribute('data-index');
      const index = indexAttr ? parseInt(indexAttr, 10) : -1;
      if (index >= 0 && index < detailImages.length) {
        detailImages.splice(index, 1);
        renderDetailImages();
      }
    } else {
      const uploadSlot = target.closest('#car-detail-image-upload-slot');
      if (uploadSlot) {
        const input = uploadSlot.querySelector('#car-detail-images-input');
        if (input) {
          input.click();
        }
      }
    }
  });

  // Car form images row interaction (delete + open file picker)
  carFormImagesRow?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.classList.contains('car-detail-image-remove')) {
      const indexAttr = target.getAttribute('data-index');
      const index = indexAttr ? parseInt(indexAttr, 10) : -1;
      if (index >= 0 && index < formImages.length) {
        formImages.splice(index, 1);
        renderFormImages();
      }
    } else {
      const uploadSlot = target.closest('#car-form-image-upload-slot');
      if (uploadSlot) {
        const input = uploadSlot.querySelector('#car-form-images-input');
        if (input) {
          input.click();
        }
      }
    }
  });

  carGridEl?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const card = target.closest('.car-card');
    if (!card) return;

    const id = card.getAttribute('data-id');
    if (!id) return;

    if (target.classList.contains('car-detail-btn')) {
      const car = cars.find((c) => c.id === id);
      if (car) {
        openCarDetailModal(car);
      }
    } else if (target.classList.contains('car-edit-btn')) {
      const car = cars.find((c) => c.id === id);
      if (car) {
        openCarModal('edit', car);
      }
    } else if (target.classList.contains('car-delete-btn')) {
      cars = cars.filter((c) => c.id !== id);
      dealer.cars = cars;
      dealers = dealers.map((d) => (d.id === dealer.id ? dealer : d));
      saveDealers();
      renderCars();
    } else {
      const car = cars.find((c) => c.id === id);
      if (car) {
        openCarDetailModal(car);
      }
    }
  });

  // Init
  hydrateDealer();
  if (dealer) {
    renderCars();
  }
});
