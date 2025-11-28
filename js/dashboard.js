document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const dealerListEl = document.getElementById('dealer-list');
  const searchInput = document.getElementById('dealer-search');
  const statusFilter = document.getElementById('dealer-status-filter');
  const newDealerBtn = document.getElementById('new-dealer-btn');

  const dealerModal = document.getElementById('dealer-modal');
  const dealerModalTitle = document.getElementById('dealer-modal-title');
  const dealerModalClose = document.getElementById('dealer-modal-close');
  const dealerModalCancel = document.getElementById('dealer-modal-cancel');
  const dealerForm = document.getElementById('dealer-form');
  const dealerFormError = document.getElementById('dealer-form-error');

  const dealerNameInput = document.getElementById('dealer-name');
  const dealerEmailInput = document.getElementById('dealer-email');
  const dealerPhoneInput = document.getElementById('dealer-phone');
  const dealerStatusSelect = document.getElementById('dealer-status');
  const dealerUsernameInput = document.getElementById('dealer-username');
  const dealerPasswordInput = document.getElementById('dealer-password');

  let dealers = [];
  let editDealerId = null;

  function loadDealers() {
    try {
      const raw = localStorage.getItem('adminDealers');
      if (!raw) {
        // default seed data
        dealers = [
          {
            id: 'd1',
            name: 'Auto City',
            email: 'contact@autocity.com',
            phone: '+1 555 0101',
            status: 'active',
          },
          {
            id: 'd2',
            name: 'Prime Motors',
            email: 'hello@primemotors.com',
            phone: '+1 555 0202',
            status: 'inactive',
          },
          {
            id: 'd3',
            name: 'Skyline Imports',
            email: 'info@skylineimports.com',
            phone: '+1 555 0303',
            status: 'active',
          },
        ];
        saveDealers();
      } else {
      dealers = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load dealers', e);
      dealers = [];
    }
  }

  function saveDealers() {
    localStorage.setItem('adminDealers', JSON.stringify(dealers));
  }

  function applyFilters(list) {
    const term = String(searchInput.value || '').trim().toLowerCase();
    const status = statusFilter.value;

    return list.filter((dealer) => {
      const matchesTerm =
        !term ||
        dealer.name.toLowerCase().includes(term) ||
        dealer.email.toLowerCase().includes(term);

      const matchesStatus =
        status === 'all' ? true : dealer.status.toLowerCase() === status;

      return matchesTerm && matchesStatus;
    });
  }

  function renderDealers() {
    if (!dealerListEl) return;

    const filtered = applyFilters(dealers);

    if (!filtered.length) {
      dealerListEl.innerHTML =
        '<div class="dealer-empty-row">დილერები ვერ მოიძებნა. სცადეთ ფილტრების შეცვლა ან დაამატეთ ახალი დილერი.</div>';
      return;
    }

    dealerListEl.innerHTML = filtered
      .map((dealer) => {
        const statusLabel = dealer.status === 'active' ? 'აქტიური' : 'არააქტიური';
        return `
          <div class="dealer-row" data-id="${dealer.id}">
            <div class="dealer-cell dealer-name">
              <span class="dealer-name-main">${dealer.name}</span>
              <span class="dealer-name-sub">${dealer.email}</span>
            </div>
            <div class="dealer-cell dealer-email">
              ${dealer.email}
            </div>
            <div class="dealer-cell dealer-phone">
              ${dealer.phone || '-'}
            </div>
            <div class="dealer-cell dealer-status">
              <span class="status-pill status-${dealer.status}">
                ${statusLabel}
              </span>
            </div>
            <div class="dealer-cell dealer-actions">
              <button
                class="btn btn-ghost dealer-edit-btn"
                type="button"
                data-id="${dealer.id}"
              >
                რედაქტირება
              </button>
              <button
                class="btn btn-ghost dealer-delete-btn"
                type="button"
                data-id="${dealer.id}"
              >
                წაშლა
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  function openDealerModal(mode, dealer) {
    dealerFormError.textContent = '';
    dealerNameInput.classList.remove('error');
    dealerEmailInput.classList.remove('error');

    if (mode === 'edit' && dealer) {
      editDealerId = dealer.id;
      dealerModalTitle.textContent = 'დილერის რედაქტირება';
      dealerNameInput.value = dealer.name || '';
      dealerEmailInput.value = dealer.email || '';
      dealerPhoneInput.value = dealer.phone || '';
      dealerStatusSelect.value = dealer.status || 'active';
      dealerUsernameInput.value = dealer.username || '';
      dealerPasswordInput.value = dealer.password || '';
    } else {
      editDealerId = null;
      dealerModalTitle.textContent = 'ახალი დილერი';
      dealerNameInput.value = '';
      dealerEmailInput.value = '';
      dealerPhoneInput.value = '';
      dealerStatusSelect.value = 'active';
      dealerUsernameInput.value = '';
      dealerPasswordInput.value = '';
    }

    dealerModal.setAttribute('aria-hidden', 'false');
    dealerModal.classList.add('open');
  }

  function closeDealerModal() {
    dealerModal.classList.remove('open');
    dealerModal.setAttribute('aria-hidden', 'true');
  }

  function handleDealerFormSubmit(event) {
    event.preventDefault();
    dealerFormError.textContent = '';
    dealerNameInput.classList.remove('error');
    dealerEmailInput.classList.remove('error');

    const name = String(dealerNameInput.value || '').trim();
    const email = String(dealerEmailInput.value || '').trim();
    const phone = String(dealerPhoneInput.value || '').trim();
    const status = dealerStatusSelect.value || 'active';
    const username = String(dealerUsernameInput.value || '').trim();
    const password = String(dealerPasswordInput.value || '').trim();

    if (!name || !email) {
      dealerFormError.textContent = 'სახელი და ელ-ფოსტა სავალდებულოა.';
      if (!name) dealerNameInput.classList.add('error');
      if (!email) dealerEmailInput.classList.add('error');
      return;
    }

    if (!editDealerId) {
      // create
      const id = `d${Date.now()}`;
      dealers.push({
        id,
        name,
        email,
        phone,
        status,
        username,
        password,
        cars: [],
      });
    } else {
      // update
      dealers = dealers.map((d) =>
        d.id === editDealerId
          ? {
              ...d,
              name,
              email,
              phone,
              status,
              username,
              password,
            }
          : d
      );
    }

    saveDealers();
    renderDealers();
    closeDealerModal();
  }

  // Event bindings
  logoutBtn?.addEventListener('click', () => {
    // Simple navigation back to login; no session handling
    window.location.href = 'index.html';
  });

  searchInput?.addEventListener('input', () => {
    renderDealers();
  });

  statusFilter?.addEventListener('change', () => {
    renderDealers();
  });

  newDealerBtn?.addEventListener('click', () => {
    openDealerModal('create');
  });

  dealerModalClose?.addEventListener('click', closeDealerModal);
  dealerModalCancel?.addEventListener('click', closeDealerModal);

  dealerModal.addEventListener('click', (event) => {
    if (event.target === dealerModal) {
      closeDealerModal();
    }
  });

  dealerForm.addEventListener('submit', handleDealerFormSubmit);

  dealerListEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const row = target.closest('.dealer-row');
    if (!row) return;

    const id = row.getAttribute('data-id');
    if (!id) return;

    if (target.classList.contains('dealer-edit-btn')) {
      const dealer = dealers.find((d) => d.id === id);
      if (dealer) {
        openDealerModal('edit', dealer);
      }
    } else if (target.classList.contains('dealer-delete-btn')) {
      const dealer = dealers.find((d) => d.id === id);
      if (!dealer) return;

      const confirmed = window.confirm(
        `გსურთ დილერის "${dealer.name}" და მისი ყველა ავტომობილის წაშლა?`
      );
      if (!confirmed) return;

      dealers = dealers.filter((d) => d.id !== id);
      saveDealers();
      renderDealers();
    } else {
      // Click anywhere else on the row opens dealer detail
      window.location.href = `dealer.html?dealerId=${encodeURIComponent(id)}`;
    }
  });

  // Initialize
  loadDealers();
  renderDealers();
});


