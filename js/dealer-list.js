const dealerListStore = (() => {
  const API_DEALERS = window.API + '/dealers';
  const DEALER_CACHE_KEY = 'dashboardDealerCache';
  let fallbackIdCounter = 0;

  const state = {
    listEl: null,
    searchInput: null,
    dealers: [],
  };

  const getToken = () => {
    const raw = localStorage.getItem('token');
    return raw ? raw.replace(/"/g, '') : null;
  };

  const extractDealers = (payload) => {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && Array.isArray(payload.data)) {
      return payload.data;
    }

    return [];
  };

  const readCache = () => {
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

  const writeCache = (dealers) => {
    try {
      sessionStorage.setItem(DEALER_CACHE_KEY, JSON.stringify(dealers));
    } catch (error) {
      console.warn('Unable to cache dealers.', error);
    }
  };

  const getDealerId = (dealer) => {
    if (!dealer) return '';

    const existingId =
      dealer.id ??
      dealer.dealerId ??
      dealer.uuid ??
      dealer.username ??
      dealer.email;

    if (existingId !== undefined && existingId !== null && existingId !== '') {
      return String(existingId);
    }

    if (!dealer.__dealerRowId) {
      fallbackIdCounter += 1;
      dealer.__dealerRowId = `temp-${fallbackIdCounter}`;
    }

    return dealer.__dealerRowId;
  };

  const renderMessage = (text, className = 'dealer-empty') => {
    if (!state.listEl) return;
    state.listEl.innerHTML = `<div class="${className}">${text}</div>`;
  };

  const renderDealers = (dealers) => {
    if (!state.listEl) {
      return;
    }

    if (!dealers.length) {
      renderMessage('დილერები ვერ მოიძებნა.', 'dealer-empty');
      return;
    }

    const fragment = document.createDocumentFragment();

    dealers.forEach((dealer) => {
      const row = document.createElement('div');
      row.className = 'dealer-row';
      row.dataset.id = getDealerId(dealer);

      const username = dealer?.username || dealer?.login || '';
      const phone =
        dealer?.phone ||
        dealer?.phoneNumber ||
        dealer?.contactNumber ||
        dealer?.contact_number ||
        '—';

      const nameSub = username
        ? `<span class="dealer-name-sub">@${username}</span>`
        : '';

      row.innerHTML = `
        <div class="dealer-name">
          <span class="dealer-name-main">${dealer?.name || 'უცნობი დილერი'}</span>
  
        </div>
        <span class="dealer-phone">${phone}</span>
        <div class="dealer-row-actions">
          <button type="button" class="btn btn-ghost dealer-edit-btn">რედაქტირება</button>
          <button type="button" class="btn btn-ghost dealer-delete-btn" style="color: #ef4444; border-color: #ef4444;">წაშლა</button>
        </div>
      `;

      fragment.appendChild(row);
    });

    state.listEl.innerHTML = '';
    state.listEl.appendChild(fragment);
  };

  const filterDealers = () => {
    const query = String(state.searchInput?.value || '').trim().toLowerCase();
    const filtered = state.dealers.filter((dealer) => {
      const matchesSearch =
        !query ||
        [
          dealer?.name,
          dealer?.username,
          dealer?.phone,
          dealer?.phoneNumber,
          dealer?.contactNumber,
          dealer?.contact_number,
        ]
          .filter(Boolean)
          .some((field) =>
            String(field).toLowerCase().includes(query.toLowerCase())
          );

      return matchesSearch;
    });

    renderDealers(filtered);
  };

  const init = ({ listEl, searchInput }) => {
    state.listEl = listEl || null;
    state.searchInput = searchInput || null;

    state.searchInput?.addEventListener('input', filterDealers);
  };

  const setDealers = (dealers = [], { persist = true } = {}) => {
    state.dealers = Array.isArray(dealers) ? dealers.slice() : [];
    if (persist) {
      writeCache(state.dealers);
    }
    filterDealers();
  };

  const getCachedDealers = () => readCache();

  const getDealerById = (id) => {
    if (!id) return null;
    return (
      state.dealers.find(
        (dealer) => getDealerId(dealer) === String(id)
      ) || null
    );
  };

  const updateDealer = (updatedDealer) => {
    if (!updatedDealer) return;
    const targetId = getDealerId(updatedDealer);
    state.dealers = state.dealers.map((dealer) =>
      getDealerId(dealer) === targetId ? { ...dealer, ...updatedDealer } : dealer
    );
    writeCache(state.dealers);
    filterDealers();
  };

  const removeDealer = (dealerId) => {
    if (!dealerId) return;
    state.dealers = state.dealers.filter(
      (dealer) => getDealerId(dealer) !== String(dealerId)
    );
    writeCache(state.dealers);
    filterDealers();
  };

  const load = async ({ showLoadingState = true } = {}) => {
    if (showLoadingState) {
      renderMessage('დილერები იტვირთება…', 'dealer-loading');
    }

    const token = getToken();
    if (!token) {
      renderMessage('ავტორიზაცია მოითხოვება.', 'dealer-error');
      throw new Error('Missing authentication token.');
    }

    const response = await fetch(API_DEALERS, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      renderMessage('დილერების ჩამოტვირთვა ვერ მოხერხდა.', 'dealer-error');
      throw new Error(`Failed to fetch dealers: ${response.status}`);
    }

    const payload = await response.json();
    const dealers = extractDealers(payload);
    setDealers(dealers);
    return dealers;
  };

  return {
    init,
    load,
    setDealers,
    getDealerById,
    updateDealer,
    removeDealer,
    getCachedDealers,
  };
})();

window.dealerListStore = dealerListStore;