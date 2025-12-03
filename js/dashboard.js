document.addEventListener('DOMContentLoaded', () => {
  // Check token immediately
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  const logoutBtn = document.getElementById('logout-btn');
  const dealerListEl = document.getElementById('dealer-list');
  const searchInput = document.getElementById('dealer-search');
  const newDealerBtn = document.getElementById('new-dealer-btn');

  const dealerModal = document.getElementById('dealer-modal');
  const dealerModalTitle = document.getElementById('dealer-modal-title');
  const dealerModalClose = document.getElementById('dealer-modal-close');
  const dealerModalCancel = document.getElementById('dealer-modal-cancel');
  const dealerForm = document.getElementById('dealer-form');
  const dealerFormError = document.getElementById('dealer-form-error');

  const deleteDealerModal = document.getElementById('delete-dealer-modal');
  const deleteDealerClose = document.getElementById('delete-dealer-close');
  const deleteDealerCancel = document.getElementById('delete-dealer-cancel');
  const deleteDealerConfirm = document.getElementById('delete-dealer-confirm');
  let dealerToDeleteId = null;

  const dealerNameInput = document.getElementById('dealer-name');
  const dealerPhoneInput = document.getElementById('dealer-phone');
  const dealerAddressInput = document.getElementById('dealer-address');
  const dealerUsernameInput = document.getElementById('dealer-username');

  const dealerListStore = window.dealerListStore;
  if (!dealerListStore) {
    console.error('Dealer list store is not available.');
    return;
  }

  dealerListStore.init({
    listEl: dealerListEl,
    searchInput,
  });

  let editDealerId = null;

  function openDealerModal(mode, dealer) {
    dealerFormError.textContent = '';
    dealerNameInput.classList.remove('error');

    if (mode === 'edit' && dealer) {
      editDealerId = dealer.id || dealer.dealerId || dealer.uuid;
      dealerModalTitle.textContent = 'დილერის რედაქტირება';
      dealerNameInput.value = dealer.name || '';
      // Map phone field - API uses contactNumber, UI uses phone
      dealerPhoneInput.value = dealer.phone || dealer.contactNumber || dealer.phoneNumber || '';
      dealerAddressInput.value = dealer.address || '';
      dealerUsernameInput.value = dealer.username || dealer.login || '';
    } else {
      editDealerId = null;
      dealerModalTitle.textContent = 'ახალი დილერი';
      dealerNameInput.value = '';
      dealerPhoneInput.value = '';
      dealerAddressInput.value = '';
      dealerUsernameInput.value = '';
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
    const username = String(dealerUsernameInput.value || '').trim();

    if (!name) {
      dealerFormError.textContent = 'დასახელება სავალდებულოა.';
      dealerNameInput.classList.add('error');
      return;
    }

    const dealerPayload = {
      name,
      phone,
      address,
      username,
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
      const apiUpdate = window.dealerUpdateApi?.updateDealer;
      if (typeof apiUpdate !== 'function') {
        dealerFormError.textContent =
          'Dealer update API unavailable. Please refresh the page and try again.';
        return;
      }

      const existing = dealerListStore.getDealerById(editDealerId);
      if (!existing) {
        dealerFormError.textContent = 'Dealer not found. Please refresh the page.';
        return;
      }

      try {
        await apiUpdate(editDealerId, {
          ...dealerPayload,
          existingDealer: existing,
        });
        
        // Update local store
        dealerListStore.updateDealer({
          ...existing,
          ...dealerPayload,
        });
        
        // Reload to get latest data from server
        await dealerListStore.load({ showLoadingState: false });
      } catch (error) {
        console.error('Failed to update dealer via API', error);
        dealerFormError.textContent =
          error instanceof Error ? error.message : 'Failed to update dealer.';
        return;
      }
    }

    closeDealerModal();
  }

  // Event bindings
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('token');
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

  function openDeleteDealerModal(id) {
    dealerToDeleteId = id;
    deleteDealerModal.setAttribute('aria-hidden', 'false');
    deleteDealerModal.classList.add('open');
  }

  function closeDeleteDealerModal() {
    dealerToDeleteId = null;
    deleteDealerModal.classList.remove('open');
    deleteDealerModal.setAttribute('aria-hidden', 'true');
  }

  deleteDealerClose?.addEventListener('click', closeDeleteDealerModal);
  deleteDealerCancel?.addEventListener('click', closeDeleteDealerModal);

  deleteDealerConfirm?.addEventListener('click', async () => {
    if (dealerToDeleteId) {
      const originalText = deleteDealerConfirm.textContent;
      deleteDealerConfirm.disabled = true;
      deleteDealerConfirm.textContent = 'Deleting...';

      const deleteApi = window.dealerDeleteApi?.deleteDealer;
      if (!deleteApi) {
        console.error('Dealer delete API not found');
        alert('API not found. Please refresh.');
        deleteDealerConfirm.disabled = false;
        deleteDealerConfirm.textContent = originalText;
        return;
      }

      try {
        await deleteApi(dealerToDeleteId);
        // Remove from local store
        dealerListStore.removeDealer(dealerToDeleteId);
        closeDeleteDealerModal();
      } catch (error) {
        console.error('Failed to delete dealer', error);
        alert(error instanceof Error ? error.message : 'Failed to delete dealer');
      } finally {
        deleteDealerConfirm.disabled = false;
        deleteDealerConfirm.textContent = originalText;
      }
    }
  });

  dealerListEl.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const row = target.closest('.dealer-row');
    if (!row) return;

    const id = row.getAttribute('data-id');
    if (!id) return;

    // Check if edit button was clicked
    const editButton = target.classList.contains('dealer-edit-btn') 
      ? target 
      : target.closest('.dealer-edit-btn');
    
    if (editButton) {
      // Prevent row click (navigation) - edit-dealer-modal.js will handle opening the modal
      event.stopPropagation();
      return;
    }

    if (target.classList.contains('dealer-delete-btn')) {
      // Prevent row click (navigation)
      event.stopPropagation();
      openDeleteDealerModal(id);
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


