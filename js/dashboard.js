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
  const dealerPhoneInput = document.getElementById('dealer-phone');
  const dealerAddressInput = document.getElementById('dealer-address');
  const dealerStatusSelect = document.getElementById('dealer-status');
  const dealerUsernameInput = document.getElementById('dealer-username');
  const dealerPasswordInput = document.getElementById('dealer-password');

  const dealerListStore = window.dealerListStore;
  if (!dealerListStore) {
    console.error('Dealer list store is not available.');
    return;
  }

  dealerListStore.init({
    listEl: dealerListEl,
    searchInput,
    statusFilter,
  });

  let editDealerId = null;

  function openDealerModal(mode, dealer) {
    dealerFormError.textContent = '';
    dealerNameInput.classList.remove('error');

    if (mode === 'edit' && dealer) {
      editDealerId = dealer.id;
      dealerModalTitle.textContent = 'დილერის რედაქტირება';
      dealerNameInput.value = dealer.name || '';
      dealerPhoneInput.value = dealer.phone || '';
      dealerAddressInput.value = dealer.address || '';
      dealerStatusSelect.value = dealer.status || 'active';
      dealerUsernameInput.value = dealer.username || '';
      dealerPasswordInput.value = dealer.password || '';
    } else {
      editDealerId = null;
      dealerModalTitle.textContent = 'ახალი დილერი';
      dealerNameInput.value = '';
      dealerPhoneInput.value = '';
      dealerAddressInput.value = '';
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

  async function handleDealerFormSubmit(event) {
    event.preventDefault();
    dealerFormError.textContent = '';
    dealerNameInput.classList.remove('error');

    const name = String(dealerNameInput.value || '').trim();
    const phone = String(dealerPhoneInput.value || '').trim();
    const address = String(dealerAddressInput.value || '').trim();
    const status = dealerStatusSelect.value || 'active';
    const username = String(dealerUsernameInput.value || '').trim();
    const password = String(dealerPasswordInput.value || '').trim();

    if (!name) {
      dealerFormError.textContent = 'დასახელება სავალდებულოა.';
      dealerNameInput.classList.add('error');
      return;
    }

    const dealerPayload = {
      name,
      phone,
      address,
      status,
      username,
      password,
    };

    if (!editDealerId) {
      const apiRegister = window.dealerApi?.registerDealer;
      if (typeof apiRegister !== 'function') {
        dealerFormError.textContent =
          'Dealer API unavailable. Please refresh the page and try again.';
        return;
      }

      try {
        await apiRegister(dealerPayload);
      } catch (error) {
        console.error('Failed to register dealer via API', error);
        dealerFormError.textContent =
          error instanceof Error ? error.message : 'Failed to register dealer.';
        return;
      }

      await dealerListStore.load({ showLoadingState: false });
    } else {
      const existing = dealerListStore.getDealerById(editDealerId);
      if (existing) {
        dealerListStore.updateDealer({
          ...existing,
          ...dealerPayload,
        });
      }
    }

    closeDealerModal();
  }

  // Event bindings
  logoutBtn?.addEventListener('click', () => {
    // Simple navigation back to login; no session handling
    window.location.href = 'index.html';
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
      const dealer = dealerListStore.getDealerById(id);
      if (dealer) {
        openDealerModal('edit', dealer);
      }
    } else if (target.classList.contains('dealer-delete-btn')) {
      const dealer = dealerListStore.getDealerById(id);
      if (!dealer) return;

      const confirmed = window.confirm(
        `გსურთ დილერის "${dealer.name}" და მისი ყველა ავტომობილის წაშლა?`
      );
      if (!confirmed) return;

      dealerListStore.removeDealer(id);
    } else {
      // Click anywhere else on the row opens dealer detail
      window.location.href = `dealer.html?dealerId=${encodeURIComponent(id)}`;
    }
  });

  // Initialize
  const cachedDealers = dealerListStore.getCachedDealers();
  if (cachedDealers.length) {
    dealerListStore.setDealers(cachedDealers);
    dealerListStore.load({ showLoadingState: false });
  } else {
    dealerListStore.load({ showLoadingState: true });
  }
});


