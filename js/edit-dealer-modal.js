/**
 * Bootstrap Modal Handler for Editing Dealers
 * Handles opening modal with dealer data, form submission, and list refresh
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if Bootstrap is available
  if (typeof bootstrap === 'undefined') {
    console.error('Bootstrap is not loaded. Please ensure Bootstrap JS is included.');
    return;
  }

  // Get modal element
  const editDealerModalElement = document.getElementById('editDealerModal');
  if (!editDealerModalElement) {
    console.error('Edit dealer modal element not found.');
    return;
  }

  // Initialize Bootstrap modal
  const editDealerModal = new bootstrap.Modal(editDealerModalElement);
  
  const editDealerForm = document.getElementById('editDealerForm');
  const editDealerError = document.getElementById('editDealerError');
  
  // Get form inputs
  const editDealerIdInput = document.getElementById('editDealerId');
  const editDealerNameInput = document.getElementById('editDealerName');
  const editDealerUsernameInput = document.getElementById('editDealerUsername');
  const editDealerContactNumberInput = document.getElementById('editDealerContactNumber');
  const editDealerAddressInput = document.getElementById('editDealerAddress');

  // Validate all elements exist
  if (!editDealerForm || !editDealerError || !editDealerIdInput || !editDealerNameInput || 
      !editDealerUsernameInput || !editDealerContactNumberInput || !editDealerAddressInput) {
    console.error('One or more modal form elements not found.');
    return;
  }

  // Get dealer list store
  const dealerListStore = window.dealerListStore;
  if (!dealerListStore) {
    console.error('Dealer list store is not available.');
    return;
  }

  /**
   * Opens the edit modal and populates it with dealer data
   * @param {Object} dealer - The dealer object to edit
   */
  function openEditModal(dealer) {
    if (!dealer) {
      console.error('No dealer provided to edit modal');
      return;
    }

    // Get dealer ID (handle different possible ID fields)
    const dealerId = dealer.id || dealer.dealerId || dealer.uuid;
    if (!dealerId) {
      console.error('Dealer ID not found in dealer object');
      return;
    }

    // Populate form fields with dealer data
    editDealerIdInput.value = dealerId;
    editDealerNameInput.value = dealer.name || '';
    editDealerUsernameInput.value = dealer.username || dealer.login || '';
    
    // Map contact number (API uses contactNumber, UI might use phone)
    editDealerContactNumberInput.value = dealer.contactNumber || dealer.phone || dealer.phoneNumber || '';
    
    editDealerAddressInput.value = dealer.address || '';

    // Clear any previous errors
    hideError();

    // Open the modal
    editDealerModal.show();
  }

  /**
   * Shows error message in the modal
   * @param {string} message - Error message to display
   */
  function showError(message) {
    editDealerError.textContent = message;
    editDealerError.classList.remove('d-none');
  }

  /**
   * Hides error message in the modal
   */
  function hideError() {
    editDealerError.classList.add('d-none');
    editDealerError.textContent = '';
  }

  /**
   * Handles form submission
   */
  editDealerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError();

    // Get form values
    const dealerId = editDealerIdInput.value;
    const name = editDealerNameInput.value.trim();
    const username = editDealerUsernameInput.value.trim();
    const contactNumber = editDealerContactNumberInput.value.trim();
    const address = editDealerAddressInput.value.trim();

    // Validate required fields
    if (!name) {
      showError('Name is required.');
      editDealerNameInput.focus();
      return;
    }

    if (!username) {
      showError('Username is required.');
      editDealerUsernameInput.focus();
      return;
    }

    if (!dealerId) {
      showError('Dealer ID is missing. Please refresh the page and try again.');
      return;
    }

    // Get the update API function
    const updateDealer = window.dealerUpdateApi?.updateDealer;
    if (typeof updateDealer !== 'function') {
      showError('Update API is not available. Please refresh the page.');
      return;
    }

    // Prepare the payload - API expects contactNumber format
    const dealerPayload = {
      name: name,
      username: username,
      contactNumber: contactNumber, // Use contactNumber to match API format
      address: address,
      existingDealer: dealerListStore.getDealerById(dealerId) || {},
    };

    // Disable submit button during request
    const submitButton = editDealerForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Saving...';

    try {
      // Send PUT request to update dealer
      await updateDealer(dealerId, dealerPayload);

      // Close modal
      editDealerModal.hide();

      // Refresh dealer list
      await dealerListStore.load({ showLoadingState: false });
    } catch (error) {
      console.error('Failed to update dealer:', error);
      showError(error instanceof Error ? error.message : 'Failed to update dealer. Please try again.');
    } finally {
      // Re-enable submit button
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });

  /**
   * Listen for clicks on edit buttons in the dealer list
   * This attaches to dynamically created edit buttons
   */
  document.addEventListener('click', (event) => {
    const target = event.target;
    
    // Find the edit button - check if target is the button or inside it
    const editButton = target.classList.contains('dealer-edit-btn') 
      ? target 
      : target.closest('.dealer-edit-btn');
    
    if (editButton) {
      event.preventDefault();
      event.stopPropagation();

      // Find the dealer row
      const dealerRow = editButton.closest('.dealer-row');
      if (!dealerRow) {
        return;
      }

      // Get dealer ID from data attribute
      const dealerId = dealerRow.getAttribute('data-id');
      if (!dealerId) {
        return;
      }

      // Get dealer data from store
      const dealer = dealerListStore.getDealerById(dealerId);
      if (!dealer) {
        console.error('Dealer not found with ID:', dealerId);
        return;
      }

      // Open the edit modal with dealer data
      openEditModal(dealer);
    }
  });

  // Expose openEditModal function globally for manual calls if needed
  window.openEditDealerModal = openEditModal;
});

