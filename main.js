// Ease Babysitter - Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
  // Set default dates to tomorrow
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const searchDateInput = document.getElementById('searchDate');
  const bookingDateInput = document.getElementById('bookingDate');

  if (searchDateInput) searchDateInput.value = tomorrowStr;
  if (bookingDateInput) bookingDateInput.value = tomorrowStr;

  // 1. Hamburger Navigation Drawer
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const navDrawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    navDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    navDrawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    navDrawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    navDrawer.setAttribute('aria-hidden', 'true');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // 2. Sitter Category Filtering
  const filterChips = document.querySelectorAll('.filter-chip');
  const sitterCards = document.querySelectorAll('.sitter-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filterValue = chip.getAttribute('data-filter');

      sitterCards.forEach(card => {
        // Keep the featured sitter card visible always
        if (card.classList.contains('featured-sitter-card')) return;

        const categories = card.getAttribute('data-category') || '';
        if (filterValue === 'all' || categories.includes(filterValue)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 3. Search Button Handler
  const searchBtn = document.getElementById('searchSittersBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const type = document.getElementById('searchType').value;
      const sittersSection = document.getElementById('sitters');

      if (type !== 'all') {
        const targetChip = document.querySelector(`.filter-chip[data-filter="${type}"]`);
        if (targetChip) targetChip.click();
      } else {
        const allChip = document.querySelector('.filter-chip[data-filter="all"]');
        if (allChip) allChip.click();
      }

      sittersSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 4. Booking Modal Handling
  const modal = document.getElementById('bookingModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const bookingSitterInput = document.getElementById('bookingSitterInput');
  const openModalButtons = document.querySelectorAll('.open-booking-btn');

  openModalButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();

      const sitterName = btn.getAttribute('data-sitter');
      const serviceName = btn.getAttribute('data-service');

      if (sitterName) {
        bookingSitterInput.value = `Caregiver: ${sitterName}`;
      } else if (serviceName) {
        bookingSitterInput.value = `Plan: ${serviceName}`;
      } else {
        bookingSitterInput.value = 'Any Top-Rated Sitter (Next Available)';
      }

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    });
  });

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    clearValidationErrors();
  }

  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // 5. Booking Form Validation & Submission
  const bookingForm = document.getElementById('bookingForm');
  const parentNameInput = document.getElementById('parentName');
  const parentPhoneInput = document.getElementById('parentPhone');
  const parentNameError = document.getElementById('parentNameError');
  const parentPhoneError = document.getElementById('parentPhoneError');

  function clearValidationErrors() {
    if (parentNameInput) parentNameInput.classList.remove('input-error');
    if (parentPhoneInput) parentPhoneInput.classList.remove('input-error');
    if (parentNameError) parentNameError.style.display = 'none';
    if (parentPhoneError) parentPhoneError.style.display = 'none';
  }

  if (parentNameInput) {
    parentNameInput.addEventListener('input', () => {
      if (parentNameInput.value.trim()) {
        parentNameInput.classList.remove('input-error');
        if (parentNameError) parentNameError.style.display = 'none';
      }
    });
  }

  if (parentPhoneInput) {
    parentPhoneInput.addEventListener('input', () => {
      if (parentPhoneInput.value.trim()) {
        parentPhoneInput.classList.remove('input-error');
        if (parentPhoneError) parentPhoneError.style.display = 'none';
      }
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let hasError = false;

      if (!parentNameInput.value.trim()) {
        parentNameInput.classList.add('input-error');
        if (parentNameError) parentNameError.style.display = 'flex';
        hasError = true;
      }

      if (!parentPhoneInput.value.trim()) {
        parentPhoneInput.classList.add('input-error');
        if (parentPhoneError) parentPhoneError.style.display = 'flex';
        hasError = true;
      }

      if (hasError) return;

      const parentName = parentNameInput.value.trim();
      const sitter = bookingSitterInput.value;

      closeModal();
      showToast(`Thank you, ${parentName}! Your request for ${sitter} has been received.`);
      bookingForm.reset();
      clearValidationErrors();
      if (bookingDateInput) bookingDateInput.value = tomorrowStr;
    });
  }

  // 6. Toast Notification
  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  // 7. Accordion (FAQ)
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const titleBtn = item.querySelector('.accordion-title');
    titleBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      accordionItems.forEach(i => {
        i.classList.remove('active');
        const btn = i.querySelector('.accordion-title');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        titleBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 8. Secondary Actions (Log in & Sitter sign up)
  const loginBtn = document.getElementById('loginBtn');
  const heroLoginLink = document.getElementById('heroLoginLink');
  const sitterSignupBtn = document.getElementById('sitterSignupBtn');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      showToast('Parent and caregiver login is coming up next.');
    });
  }

  if (heroLoginLink) {
    heroLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Parent and caregiver login is coming up next.');
    });
  }

  if (sitterSignupBtn) {
    sitterSignupBtn.addEventListener('click', () => {
      showToast('Caregiver registration and safety onboarding will open soon.');
    });
  }

  // 9. Keyboard Accessibility for Role Cards
  const roleCards = document.querySelectorAll('.role-card');
  roleCards.forEach(card => {
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
});
