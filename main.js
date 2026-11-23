// Ease Babysitter - Comprehensive Application Logic (Phase 1 & Phase 2)

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Babysitters Database
  // --------------------------------------------------------------------------
  const sittersData = {
    'sarah-lim': {
      id: 'sarah-lim',
      name: 'Sarah Lim',
      match: 98,
      age: 28,
      exp: '5 years',
      languages: 'English, Mandarin',
      rating: '4.9 (126 reviews)',
      starsNum: 5,
      price: 25,
      rateText: 'RM 25',
      cpr: true,
      newborn: true,
      degree: 'Diploma in Early Childhood Education',
      school: 'SEGi College Kuala Lumpur (Graduated 2020)',
      bio: 'Warm, patient, and creative caregiver dedicated to nurturing young children. Experienced in newborn care routines, developmental toddler play, and engaging educational activities. Non-smoker, clean driving record, and comfortable with household pets.',
      certs: [
        { name: 'Pediatric & Infant CPR Certification', expiry: 'Verified safety check • Valid until Dec 2027' },
        { name: 'Pediatric First Aid Training', expiry: 'Malaysian Red Crescent • Valid until Oct 2027' },
        { name: 'Newborn Care Specialist & Sleep Routine', expiry: 'Certified infant sleep guidance' },
      ],
      reviews: [
        { stars: '5.0', text: 'Sarah was incredible with our 10-month-old daughter. She was punctual, so warm, and sent us photo check-ins throughout our dinner. Total peace of mind!', author: 'Michelle T. • Bangsar (Parent of 10-month-old)' },
        { stars: '5.0', text: 'Our 3-year-old twins adore Sarah. She reads stories, plays creative games, and follows their bedtime routine to the minute. Highly recommended!', author: 'Kevin L. • Mont Kiara (Parent of 3-year-old twins)' }
      ],
      availability: [
        { day: 'Monday – Friday', times: 'Afternoons & Evenings (1:00 PM – 9:00 PM)' },
        { day: 'Saturday', times: 'Full Day (9:00 AM – 10:00 PM)' },
        { day: 'Sunday', times: 'Available upon request' }
      ]
    },
    'nur-ain': {
      id: 'nur-ain',
      name: 'Nur Ain',
      match: 95,
      age: 31,
      exp: '4 years',
      languages: 'Malay, English',
      rating: '4.8 (84 reviews)',
      starsNum: 5,
      price: 22,
      rateText: 'RM 22',
      cpr: true,
      newborn: false,
      degree: 'Diploma in Early Childhood Education',
      school: 'Universiti Pendidikan Sultan Idris (UPSI, 2019)',
      bio: 'Energetic and dependable babysitter with 4 years of hands-on experience in preschool settings and private homes. Passionate about arts, reading, and gentle guidance.',
      certs: [
        { name: 'Pediatric First Aid & CPR', expiry: 'St John Ambulance • Valid until Aug 2027' },
        { name: 'Early Childhood Development Certificate', expiry: 'Verified safety check' }
      ],
      reviews: [
        { stars: '4.9', text: 'Nur Ain was patient and attentive with my son. He warmed up to her immediately and enjoyed every activity!', author: 'Farah A. • Damansara' }
      ],
      availability: [
        { day: 'Monday – Friday', times: 'Flexible mornings and afternoons' },
        { day: 'Weekends', times: 'Available with 24h notice' }
      ]
    },
    'aisyah': {
      id: 'aisyah',
      name: 'Aisyah',
      match: 93,
      age: 24,
      exp: '2 years',
      languages: 'Malay, English',
      rating: '4.7 (51 reviews)',
      starsNum: 5,
      price: 20,
      rateText: 'RM 20',
      cpr: false,
      newborn: false,
      degree: 'SPM & Professional Babysitter Training',
      school: 'Ease Certified Caregiver Academy (2024)',
      bio: 'Enthusiastic and reliable childcare assistant. Experienced in helping with homework, arts & crafts, and engaging outdoor games for toddlers and primary school kids.',
      certs: [
        { name: 'Basic First Aid Certification', expiry: 'Red Crescent • Valid until Jan 2027' },
        { name: 'Ease Safety & Background Verified', expiry: 'Verified identity check' }
      ],
      reviews: [
        { stars: '4.8', text: 'Aisyah was very punctual, energetic, and polite. The kids had a wonderful time doing art with her!', author: 'Nadia S. • Subang Jaya' }
      ],
      availability: [
        { day: 'Weekdays', times: 'Evenings (4:00 PM – 9:00 PM)' },
        { day: 'Saturday & Sunday', times: 'All day' }
      ]
    }
  };

  // --------------------------------------------------------------------------
  // 2. Application State
  // --------------------------------------------------------------------------
  const state = {
    // Flow state
    postcode: '50450',
    when: 'Today',
    customDate: '',
    careType: 'Half day',
    whoNeedsCare: ['Toddler 1 to 3'],
    budget: 25,
    extras: ['CPR certified', 'Speaks Mandarin', 'Newborn experience'],
    comparedSitters: new Set(),

    // User & Auth state
    isLoggedIn: false,
    user: {
      name: 'Jessica Roberts',
      email: 'jessica@example.com',
      phone: '012-3456789',
    },
    hasAddedChild: false,
    children: [],
    child: {
      name: 'Liam',
      gender: 'Boy',
      birthDate: '2024-05-15',
      allergies: 'None',
      medical: 'None',
      specialNeeds: 'None',
      routine: 'Nap at 1:30 PM, water and snack at 4 PM',
      emergencyName: 'Mark Roberts',
      emergencyPhone: '012-9876543',
      description: 'Loves building blocks and bedtime stories.',
    },

    // Booking & Navigation state
    selectedSitterId: 'sarah-lim',
    bookingIntent: true, // true if booking, false if messaging
    bookingData: {
      childName: 'Liam',
      date: '2026-11-20',
      time: '14:00',
      hours: 4,
      location: '50450 Kuala Lumpur',
      specialReq: '',
      extraNotes: '',
      isTrial: false,
      rate: 25,
      subtotal: 100,
      fee: 5,
      total: 105,
    },
    bookingStatusState: 'waiting', // 'waiting' | 'accepted' | 'declined'
    paymentAttempts: 0,
    selectedPaymentMethod: 'fpx',
  };

  // Load state from localStorage
  try {
    const saved = localStorage.getItem('ease_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      state.comparedSitters = new Set(parsed.comparedSitters || []);

      // Multiple children migration / compatibility handling
      if (Array.isArray(parsed.children) && parsed.children.length > 0) {
        state.children = parsed.children;
        state.child = parsed.children[0];
        state.hasAddedChild = true;
      } else if (parsed.child && parsed.child.name && parsed.hasAddedChild) {
        // Migrate single existing child into children array
        state.children = [parsed.child];
        state.hasAddedChild = true;
      } else {
        state.children = Array.isArray(parsed.children) ? parsed.children : [];
      }
    }
  } catch (e) {
    console.warn('Could not load localStorage state', e);
  }

  function saveState() {
    try {
      if (state.children && state.children.length > 0) {
        state.child = state.children[0];
        state.hasAddedChild = true;
      }
      const serialized = {
        ...state,
        comparedSitters: Array.from(state.comparedSitters),
      };
      localStorage.setItem('ease_state', JSON.stringify(serialized));
    } catch (e) {
      console.warn('Could not save localStorage state', e);
    }
  }

  // --------------------------------------------------------------------------
  // 3. Screen Elements Map
  // --------------------------------------------------------------------------
  const screens = {
    welcome: document.getElementById('screenWelcome'),
    q1: document.getElementById('screenQ1'),
    q2: document.getElementById('screenQ2'),
    q3: document.getElementById('screenQ3'),
    q4: document.getElementById('screenQ4'),
    q5: document.getElementById('screenQ5'),
    q6: document.getElementById('screenQ6'),
    summary: document.getElementById('screenSummary'),
    matches: document.getElementById('screenMatches'),
    profile: document.getElementById('screenProfile'),
    compare: document.getElementById('screenCompare'),
    auth: document.getElementById('screenAuth'),
    verify: document.getElementById('screenVerify'),
    addChild: document.getElementById('screenAddChild'),
    bookingDetails: document.getElementById('screenBookingDetails'),
    bookingStatus: document.getElementById('screenBookingStatus'),
    payment: document.getElementById('screenPayment'),
    bookingConfirmed: document.getElementById('screenBookingConfirmed'),
    parentHome: document.getElementById('screenParentHome'),
    chat: document.getElementById('screenChat'),
  };

  const navBackBtn = document.getElementById('navBackBtn');
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navDrawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const bottomNav = document.getElementById('bottomNav');

  // Navigation History Stack
  const screenHistory = ['welcome'];
  let currentScreen = 'welcome';
  let waitingCountdownInterval = null;

  function showScreen(screenId, pushHistory = true) {
    if (!screens[screenId]) return;

    // Hide all screens
    Object.values(screens).forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Show target screen
    screens[screenId].style.display = 'block';

    if (pushHistory && currentScreen !== screenId) {
      screenHistory.push(screenId);
    }
    currentScreen = screenId;

    // Topbar Back / Hamburger behavior
    if (screenId === 'welcome') {
      navBackBtn.style.display = 'none';
      hamburgerBtn.style.display = 'flex';
      window.location.hash = '#/';
    } else {
      navBackBtn.style.display = 'flex';
      hamburgerBtn.style.display = 'none';
      window.location.hash = `#/${screenId}`;
    }

    // Bottom Navigation visibility (Visible for logged-in parents on inner app screens)
    const loggedInScreens = ['parentHome', 'chat', 'bookingStatus', 'bookingConfirmed', 'matches'];
    if (state.isLoggedIn && loggedInScreens.includes(screenId) && bottomNav) {
      bottomNav.style.display = 'flex';
      updateBottomNavActive(screenId);
    } else if (bottomNav) {
      bottomNav.style.display = 'none';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Screen-specific setup
    if (screenId === 'summary') {
      populateSummary();
    } else if (screenId === 'q1') {
      const inputPostcode = document.getElementById('inputPostcode');
      if (inputPostcode) inputPostcode.value = state.postcode;
    } else if (screenId === 'q5') {
      const slider = document.getElementById('budgetSlider');
      const display = document.getElementById('budgetDisplayVal');
      if (slider && display) {
        slider.value = state.budget;
        display.textContent = `RM ${state.budget}`;
      }
    } else if (screenId === 'profile') {
      populateProfile(state.selectedSitterId);
    } else if (screenId === 'bookingDetails') {
      setupBookingDetails();
    } else if (screenId === 'bookingStatus') {
      renderBookingStatus(state.bookingStatusState);
    } else if (screenId === 'payment') {
      setupPaymentScreen();
    } else if (screenId === 'bookingConfirmed') {
      setupBookingConfirmed();
    } else if (screenId === 'parentHome') {
      setupParentHome();
    } else if (screenId === 'chat') {
      setupChatScreen();
    } else if (screenId === 'addChild') {
      setupEmergencyContactToggle();
      renderSavedChildrenList();
    } else if (screenId === 'verify') {
      const verifyEmail = document.getElementById('verifyEmailDisplay');
      if (verifyEmail) verifyEmail.textContent = state.user.email;
    }

    saveState();
  }

  // Back Button Logic
  navBackBtn.addEventListener('click', () => {
    if (screenHistory.length > 1) {
      screenHistory.pop(); // remove current
      const prev = screenHistory[screenHistory.length - 1];
      showScreen(prev, false);
    } else {
      showScreen('welcome', false);
    }
  });

  // Topbar Logo goes to Welcome / Home
  const topbarLogo = document.getElementById('topbarLogo');
  if (topbarLogo) {
    topbarLogo.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.isLoggedIn) {
        showScreen('parentHome');
      } else {
        showScreen('welcome');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 4. Hamburger Drawer Controls
  // --------------------------------------------------------------------------
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

  document.querySelectorAll('.drawer-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      closeDrawer();
      const target = link.getAttribute('data-route') || link.getAttribute('data-target');
      const screenMap = {
        'welcome': 'welcome',
        'q1': 'q1',
        'summary': 'summary',
        'matches': 'matches',
        'compare': 'compare',
        'auth': 'auth',
        'parent-home': 'parentHome',
      };
      const screenId = screenMap[target];
      if (screenId && screens[screenId]) {
        showScreen(screenId);
      } else {
        showToast(`${link.textContent.trim()} section`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Screen 1: Welcome Actions
  // --------------------------------------------------------------------------
  const roleNeedSitterCard = document.getElementById('roleNeedSitterCard');
  const roleAmSitterCard = document.getElementById('roleAmSitterCard');
  const welcomeLoginLink = document.getElementById('welcomeLoginLink');

  function activateRoleCard(card) {
    if (!card) return;
    card.addEventListener('click', () => {
      if (card.id === 'roleNeedSitterCard') {
        showScreen('q1');
      } else {
        showToast('Babysitter application is opening soon!');
      }
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  }

  activateRoleCard(roleNeedSitterCard);
  activateRoleCard(roleAmSitterCard);

  if (welcomeLoginLink) {
    welcomeLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen('auth');
    });
  }

  // --------------------------------------------------------------------------
  // 6. Parent Questionnaire Logic (Questions 1 - 6)
  // --------------------------------------------------------------------------
  // Q1: Postcode
  const inputPostcode = document.getElementById('inputPostcode');
  const errorPostcode = document.getElementById('errorPostcode');
  const btnNextQ1 = document.getElementById('btnNextQ1');

  function validatePostcode() {
    const val = inputPostcode.value.trim();
    const isValid = /^\d{5}$/.test(val);
    if (!isValid) {
      inputPostcode.classList.add('input-error');
      errorPostcode.style.display = 'flex';
      return false;
    } else {
      inputPostcode.classList.remove('input-error');
      errorPostcode.style.display = 'none';
      state.postcode = val;
      saveState();
      return true;
    }
  }

  if (inputPostcode) {
    inputPostcode.addEventListener('input', () => {
      if (errorPostcode.style.display === 'flex') {
        validatePostcode();
      }
    });
    inputPostcode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (validatePostcode()) showScreen('q2');
      }
    });
  }

  if (btnNextQ1) {
    btnNextQ1.addEventListener('click', () => {
      if (validatePostcode()) showScreen('q2');
    });
  }

  // Q2: When
  const whenCards = document.querySelectorAll('#screenQ2 .option-card');
  const customDateWrap = document.getElementById('customDateWrap');
  const customDateInput = document.getElementById('customDateInput');
  const btnNextQ2 = document.getElementById('btnNextQ2');

  whenCards.forEach(card => {
    card.addEventListener('click', () => {
      whenCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      const val = card.getAttribute('data-value');
      state.when = val;
      // Show date picker for "Pick a date" or "Custom date"
      if (val === 'Pick a date' || val === 'Custom date') {
        customDateWrap.style.display = 'block';
        const datePicker = document.getElementById('customDatePicker') || document.getElementById('customDateInput');
        if (datePicker) datePicker.focus();
      } else {
        customDateWrap.style.display = 'none';
      }
      saveState();
    });
  });

  if (btnNextQ2) {
    btnNextQ2.addEventListener('click', () => {
      const datePicker = document.getElementById('customDatePicker') || document.getElementById('customDateInput');
      if ((state.when === 'Pick a date' || state.when === 'Custom date') && datePicker && datePicker.value) {
        state.customDate = datePicker.value;
      }
      showScreen('q3');
    });
  }

  // Q3: Care Type
  const careTypeCards = document.querySelectorAll('#screenQ3 .option-card');
  const btnNextQ3 = document.getElementById('btnNextQ3');

  careTypeCards.forEach(card => {
    card.addEventListener('click', () => {
      careTypeCards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      state.careType = card.getAttribute('data-value');
      saveState();
    });
  });

  if (btnNextQ3) {
    btnNextQ3.addEventListener('click', () => {
      showScreen('q4');
    });
  }

  // Q4: Who Needs Care (Multi-select)
  const childCards = document.querySelectorAll('#screenQ4 .option-card');
  const btnNextQ4 = document.getElementById('btnNextQ4');

  childCards.forEach(card => {
    card.addEventListener('click', () => {
      const val = card.getAttribute('data-value');
      const isSelected = card.classList.contains('selected');
      if (isSelected) {
        if (state.whoNeedsCare.length > 1) {
          card.classList.remove('selected');
          card.setAttribute('aria-checked', 'false');
          state.whoNeedsCare = state.whoNeedsCare.filter(item => item !== val);
        } else {
          showToast('Please select at least one age range.');
        }
      } else {
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        state.whoNeedsCare.push(val);
      }
      saveState();
    });
  });

  if (btnNextQ4) {
    btnNextQ4.addEventListener('click', () => {
      showScreen('q5');
    });
  }

  // Q5: Budget Slider
  const budgetSlider = document.getElementById('budgetSlider');
  const budgetDisplayVal = document.getElementById('budgetDisplayVal');
  const btnNextQ5 = document.getElementById('btnNextQ5');

  if (budgetSlider && budgetDisplayVal) {
    budgetSlider.addEventListener('input', () => {
      const val = budgetSlider.value;
      state.budget = Number(val);
      budgetDisplayVal.textContent = `RM ${val}`;
      saveState();
    });
  }

  if (btnNextQ5) {
    btnNextQ5.addEventListener('click', () => {
      showScreen('q6');
    });
  }

  // Q6: Extras (Multi-select)
  const extrasCards = document.querySelectorAll('#screenQ6 .option-card');
  const btnNextQ6 = document.getElementById('btnNextQ6');

  extrasCards.forEach(card => {
    card.addEventListener('click', () => {
      const val = card.getAttribute('data-value');
      const isSelected = card.classList.contains('selected');
      if (isSelected) {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
        state.extras = state.extras.filter(item => item !== val);
      } else {
        card.classList.add('selected');
        card.setAttribute('aria-checked', 'true');
        state.extras.push(val);
      }
      saveState();
    });
  });

  if (btnNextQ6) {
    btnNextQ6.addEventListener('click', () => {
      showScreen('summary');
    });
  }

  // --------------------------------------------------------------------------
  // 7. Screen 3: Summary Page
  // --------------------------------------------------------------------------
  function populateSummary() {
    const sumPostcode = document.getElementById('summaryValPostcode');
    const sumWhen = document.getElementById('summaryValWhen');
    const sumCareType = document.getElementById('summaryValCareType');
    const sumWho = document.getElementById('summaryValWho');
    const sumBudget = document.getElementById('summaryValBudget');
    const sumExtras = document.getElementById('summaryValExtras');

    if (sumPostcode) sumPostcode.textContent = `Postcode ${state.postcode || '50450'}`;
    if (sumWhen) {
      sumWhen.textContent = (state.when === 'Pick a date' || state.when === 'Custom date') && state.customDate ? state.customDate : (state.when || 'Today');
    }
    if (sumCareType) sumCareType.textContent = state.careType || 'Half day';
    if (sumWho) sumWho.textContent = (state.whoNeedsCare || []).join(', ') || 'Toddler 1 to 3';
    if (sumBudget) sumBudget.textContent = `Up to RM ${state.budget || 25} / hour`;
    if (sumExtras) {
      sumExtras.textContent = (state.extras || []).length > 0 ? state.extras.join(', ') : 'None specified';
    }
  }

  // Summary Edit buttons — use data-target attribute
  document.querySelectorAll('.summary-edit-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target && screens[target]) {
        showScreen(target);
      } else if (target === 'q1') showScreen('q1');
      else if (target === 'q2') showScreen('q2');
      else if (target === 'q3') showScreen('q3');
      else if (target === 'q4') showScreen('q4');
      else if (target === 'q5') showScreen('q5');
      else if (target === 'q6') showScreen('q6');
    });
  });

  // "Show my matches" button on Summary screen
  const btnFindMatches = document.getElementById('btnFindMatches') || document.getElementById('btnShowMatches');
  if (btnFindMatches) {
    btnFindMatches.addEventListener('click', () => {
      showScreen('matches');
    });
  }

  // Skip Q6 button
  const btnSkipQ6 = document.getElementById('btnSkipQ6');
  if (btnSkipQ6) {
    btnSkipQ6.addEventListener('click', () => {
      state.extras = [];
      saveState();
      showScreen('summary');
    });
  }

  // --------------------------------------------------------------------------
  // 8. Screen 4: Top Matches (Filters, Sort, Compare Bar)
  // --------------------------------------------------------------------------
  const filterChips = document.querySelectorAll('.filter-chip');
  const sitterCards = document.querySelectorAll('.sitter-match-card');

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      // Support both data-filter and data-match-filter attribute names
      const filter = chip.getAttribute('data-filter') || chip.getAttribute('data-match-filter');

      sitterCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'flex';
        } else if (filter === 'cpr') {
          card.style.display = card.getAttribute('data-cpr') === 'true' ? 'flex' : 'none';
        } else if (filter === 'newborn') {
          card.style.display = card.getAttribute('data-newborn') === 'true' ? 'flex' : 'none';
        } else if (filter === 'mandarin') {
          card.style.display = card.getAttribute('data-mandarin') === 'true' ? 'flex' : 'none';
        }
      });
    });
  });

  const sortSelect = document.getElementById('sortSittersSelect');
  const sittersListContainer = document.getElementById('sittersMatchList');

  if (sortSelect && sittersListContainer) {
    sortSelect.addEventListener('change', () => {
      const mode = sortSelect.value;
      const cardsArr = Array.from(sittersListContainer.children);

      cardsArr.sort((a, b) => {
        if (mode === 'match') {
          return Number(b.getAttribute('data-match')) - Number(a.getAttribute('data-match'));
        } else if (mode === 'rating') {
          return Number(b.getAttribute('data-rating')) - Number(a.getAttribute('data-rating'));
        } else if (mode === 'price-asc') {
          return Number(a.getAttribute('data-price')) - Number(b.getAttribute('data-price'));
        } else if (mode === 'price-desc') {
          return Number(b.getAttribute('data-price')) - Number(a.getAttribute('data-price'));
        }
        return 0;
      });

      cardsArr.forEach(card => sittersListContainer.appendChild(card));
    });
  }

  // Compare Checkboxes & Floating Bar
  const compareInputs = document.querySelectorAll('.compare-input');
  const compareFloatingBar = document.getElementById('compareFloatingBar');
  const compareCountText = document.getElementById('compareCountText');
  const compareNamesText = document.getElementById('compareNamesText');
  const btnCompareSitters = document.getElementById('btnCompareSitters');

  function updateCompareBar() {
    const checked = Array.from(compareInputs).filter(i => i.checked);
    state.comparedSitters = new Set(checked.map(i => i.getAttribute('data-sitter-id')));

    if (checked.length >= 2) {
      compareFloatingBar.style.display = 'block';
      const names = checked.map(i => i.getAttribute('data-sitter-name')).join(' & ');
      compareCountText.textContent = `${checked.length} babysitters selected`;
      compareNamesText.textContent = names;
    } else {
      compareFloatingBar.style.display = 'none';
    }
    saveState();
  }

  compareInputs.forEach(input => {
    input.addEventListener('change', updateCompareBar);
  });

  if (btnCompareSitters) {
    btnCompareSitters.addEventListener('click', () => {
      showScreen('compare');
    });
  }

  // View Profile buttons on Matches screen
  document.querySelectorAll('.view-sitter-profile-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sitterId = btn.getAttribute('data-sitter-id');
      state.selectedSitterId = sitterId;
      showScreen('profile');
    });
  });

  // Book buttons directly on Matches cards
  document.querySelectorAll('.btn-book-sitter').forEach(btn => {
    btn.addEventListener('click', () => {
      const sitterId = btn.getAttribute('data-sitter-id');
      startBookingFlow(sitterId);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Screen 5: Babysitter Profile
  // --------------------------------------------------------------------------
  function populateProfile(sitterId) {
    const sitter = sittersData[sitterId] || sittersData['sarah-lim'];

    const profileDisplayName = document.getElementById('profileDisplayName');
    const profileName = document.getElementById('profileName');
    const profileRatingText = document.getElementById('profileRatingText');
    const profilePrice = document.getElementById('profilePrice');
    const btnProfileBook = document.getElementById('btnProfileBook');
    const profileAge = document.getElementById('profileAge');
    const profileExp = document.getElementById('profileExp');
    const profileLanguages = document.getElementById('profileLanguages');
    const profileBio = document.getElementById('profileBio');
    const profileEduDegree = document.getElementById('profileEduDegree');
    const profileEduSchool = document.getElementById('profileEduSchool');
    const profileCertList = document.getElementById('profileCertList');

    if (profileDisplayName) profileDisplayName.textContent = sitter.name;
    if (profileName) profileName.textContent = sitter.name;
    if (profileRatingText) profileRatingText.textContent = sitter.rating;
    if (profilePrice) profilePrice.textContent = sitter.rateText;
    if (btnProfileBook) btnProfileBook.textContent = `Book ${sitter.name.split(' ')[0]}`;
    if (profileAge) profileAge.textContent = `${sitter.age} years old`;
    if (profileExp) profileExp.textContent = sitter.exp;
    if (profileLanguages) profileLanguages.textContent = sitter.languages;
    if (profileBio) profileBio.textContent = sitter.bio;
    if (profileEduDegree) profileEduDegree.textContent = sitter.degree;
    if (profileEduSchool) profileEduSchool.textContent = sitter.school;

    if (profileCertList && sitter.certs) {
      profileCertList.innerHTML = sitter.certs.map(c => `
        <li class="cert-item">
          <div class="cert-left">
            <span class="check-icon">✓</span>
            <div>
              <strong>${c.name}</strong>
              <span class="cert-expiry">${c.expiry}</span>
            </div>
          </div>
          <span class="badge badge-verified">Verified</span>
        </li>
      `).join('');
    }
  }

  function startBookingFlow(sitterId) {
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.bookingIntent = true;
    saveState();

    const hasChildren = Array.isArray(state.children) && state.children.length > 0;

    if (!state.isLoggedIn) {
      showScreen('auth');
    } else if (!hasChildren) {
      showToast('Please add your child\'s profile before booking.');
      showScreen('addChild');
    } else {
      showScreen('bookingDetails');
    }
  }

  function startMessageFlow(sitterId) {
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.bookingIntent = false;
    saveState();

    if (!state.isLoggedIn) {
      showScreen('auth');
    } else {
      showScreen('chat');
    }
  }

  const btnProfileBook = document.getElementById('btnProfileBook');
  const btnProfileMessage = document.getElementById('btnProfileMessage');
  const btnProfileCompare = document.getElementById('btnProfileCompare');

  if (btnProfileBook) {
    btnProfileBook.addEventListener('click', () => {
      startBookingFlow(state.selectedSitterId);
    });
  }

  if (btnProfileMessage) {
    btnProfileMessage.addEventListener('click', () => {
      startMessageFlow(state.selectedSitterId);
    });
  }

  if (btnProfileCompare) {
    btnProfileCompare.addEventListener('click', () => {
      showScreen('compare');
    });
  }

  // --------------------------------------------------------------------------
  // 10. Screen 6: Compare Babysitters
  // --------------------------------------------------------------------------
  document.querySelectorAll('.btn-book-from-compare').forEach(btn => {
    btn.addEventListener('click', () => {
      const sitterId = btn.getAttribute('data-sitter-id');
      startBookingFlow(sitterId);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Screen 7: Sign Up / Log In
  // --------------------------------------------------------------------------
  const tabSignUp = document.getElementById('tabSignUp');
  const tabLogIn = document.getElementById('tabLogIn');
  const authHeadline = document.getElementById('authHeadline');
  const groupName = document.getElementById('groupName');
  const groupPhone = document.getElementById('groupPhone');
  const groupPrivacy = document.getElementById('groupPrivacy');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const authForm = document.getElementById('authForm');

  let authMode = 'signup'; // 'signup' | 'login'

  function setAuthMode(mode) {
    authMode = mode;
    if (mode === 'signup') {
      tabSignUp.classList.add('active');
      tabLogIn.classList.remove('active');
      authHeadline.textContent = 'Create an account to book';
      groupName.style.display = 'flex';
      groupPhone.style.display = 'flex';
      groupPrivacy.style.display = 'block';
      btnAuthSubmit.textContent = 'Continue';
    } else {
      tabLogIn.classList.add('active');
      tabSignUp.classList.remove('active');
      authHeadline.textContent = 'Log in to your account';
      groupName.style.display = 'none';
      groupPhone.style.display = 'none';
      groupPrivacy.style.display = 'none';
      btnAuthSubmit.textContent = 'Log In';
    }
    clearAuthErrors();
  }

  if (tabSignUp) tabSignUp.addEventListener('click', () => setAuthMode('signup'));
  if (tabLogIn) tabLogIn.addEventListener('click', () => setAuthMode('login'));

  function clearAuthErrors() {
    ['authName', 'authEmail', 'authPhone', 'authPassword'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.classList.remove('input-error');
    });
    ['errorAuthName', 'errorAuthEmail', 'errorAuthPhone', 'errorAuthPassword', 'errorAuthPrivacy'].forEach(id => {
      const err = document.getElementById(id);
      if (err) err.style.display = 'none';
    });
  }

  // Clear single error on typing
  ['authName', 'authEmail', 'authPhone', 'authPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('input-error');
        const errId = `error${id.charAt(0).toUpperCase() + id.slice(1)}`;
        const err = document.getElementById(errId);
        if (err) err.style.display = 'none';
      });
    }
  });

  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearAuthErrors();

      const nameVal = document.getElementById('authName').value.trim();
      const emailVal = document.getElementById('authEmail').value.trim();
      const phoneVal = document.getElementById('authPhone').value.trim();
      const passwordVal = document.getElementById('authPassword').value;
      const privacyChecked = document.getElementById('authPrivacy').checked;

      let hasError = false;

      if (authMode === 'signup') {
        if (!nameVal) {
          document.getElementById('authName').classList.add('input-error');
          document.getElementById('errorAuthName').style.display = 'flex';
          hasError = true;
        }
        if (!phoneVal) {
          document.getElementById('authPhone').classList.add('input-error');
          document.getElementById('errorAuthPhone').style.display = 'flex';
          hasError = true;
        }
        if (!privacyChecked) {
          document.getElementById('errorAuthPrivacy').style.display = 'flex';
          hasError = true;
        }
      }

      // Common validations
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        document.getElementById('authEmail').classList.add('input-error');
        document.getElementById('errorAuthEmail').style.display = 'flex';
        hasError = true;
      }

      if (!passwordVal || passwordVal.length < 6) {
        document.getElementById('authPassword').classList.add('input-error');
        document.getElementById('errorAuthPassword').style.display = 'flex';
        hasError = true;
      }

      if (hasError) return;

      // Update state user info
      if (authMode === 'signup') {
        state.user.name = nameVal;
        state.user.email = emailVal;
        state.user.phone = phoneVal;
      } else {
        state.user.email = emailVal;
      }

      saveState();

      // Proceed to Email Verification
      showScreen('verify');
    });
  }

  // --------------------------------------------------------------------------
  // 12. Screen 8: Email Verification
  // --------------------------------------------------------------------------
  const btnEmailVerifiedDemo = document.getElementById('btnEmailVerifiedDemo');
  const btnResendEmail = document.getElementById('btnResendEmail');

  if (btnResendEmail) {
    btnResendEmail.addEventListener('click', () => {
      showToast(`Verification email resent to ${state.user.email}`);
    });
  }

  if (btnEmailVerifiedDemo) {
    btnEmailVerifiedDemo.addEventListener('click', () => {
      state.isLoggedIn = true;
      saveState();
      showToast('Email verified successfully!');

      if (!state.hasAddedChild) {
        showScreen('addChild');
      } else if (state.bookingIntent) {
        showScreen('bookingDetails');
      } else {
        showScreen('chat');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 13. Screen 9: Add Child (First Time Only)
  // --------------------------------------------------------------------------
  const addChildForm = document.getElementById('addChildForm');
  const btnAddAnotherChild = document.getElementById('btnAddAnotherChild');

  function validateChildForm() {
    const nameInput = document.getElementById('childName');
    const birthDateInput = document.getElementById('childBirthDate');
    const emergNameInput = document.getElementById('childEmergencyName');
    const emergPhoneInput = document.getElementById('childEmergencyPhone');

    let isValid = true;

    // Clear previous error states
    [nameInput, birthDateInput, emergNameInput, emergPhoneInput].forEach(input => {
      if (input) input.classList.remove('input-error');
    });
    document.querySelectorAll('.child-error-msg').forEach(el => {
      el.style.display = 'none';
    });

    if (!nameInput || !nameInput.value.trim()) {
      if (nameInput) nameInput.classList.add('input-error');
      const err = document.getElementById('errorChildName');
      if (err) err.style.display = 'flex';
      isValid = false;
    }

    if (!birthDateInput || !birthDateInput.value) {
      if (birthDateInput) birthDateInput.classList.add('input-error');
      const err = document.getElementById('errorChildBirthDate');
      if (err) err.style.display = 'flex';
      isValid = false;
    }

    if (!emergNameInput || !emergNameInput.value.trim()) {
      if (emergNameInput) emergNameInput.classList.add('input-error');
      const err = document.getElementById('errorChildEmergencyName');
      if (err) err.style.display = 'flex';
      isValid = false;
    }

    if (!emergPhoneInput || !emergPhoneInput.value.trim()) {
      if (emergPhoneInput) emergPhoneInput.classList.add('input-error');
      const err = document.getElementById('errorChildEmergencyPhone');
      if (err) err.style.display = 'flex';
      isValid = false;
    }

    return isValid;
  }

  // Clear validation errors on user typing
  ['childName', 'childBirthDate', 'childEmergencyName', 'childEmergencyPhone'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.classList.remove('input-error');
        const err = document.getElementById(`error${id.charAt(0).toUpperCase() + id.slice(1)}`);
        if (err) err.style.display = 'none';
      });
    }
  });

  // Setup multi-select chip groups with mutual-exclusivity for "None" and conditional reveals
  function setupChipGroups() {
    const chipGrids = document.querySelectorAll('#screenAddChild .chips-grid');
    chipGrids.forEach(grid => {
      const field = grid.getAttribute('data-field');
      const chips = grid.querySelectorAll('.form-chip');

      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const val = chip.getAttribute('data-value');
          const isSelected = chip.classList.contains('active');

          if (val === 'None') {
            if (isSelected) {
              chip.classList.remove('active');
            } else {
              // Deselect all others in this specific grid
              chips.forEach(c => c.classList.remove('active'));
              chip.classList.add('active');
            }
          } else {
            // Uncheck "None" in this grid
            const noneChip = Array.from(chips).find(c => c.getAttribute('data-value') === 'None');
            if (noneChip) noneChip.classList.remove('active');
            chip.classList.toggle('active');
          }

          updateConditionalInputs(field, grid);
        });
      });
    });
  }

  function updateConditionalInputs(field, grid) {
    const activeValues = Array.from(grid.querySelectorAll('.form-chip.active')).map(c => c.getAttribute('data-value'));
    const hasOther = activeValues.includes('Other');
    const hasAnyRealItem = activeValues.some(v => v !== 'None');

    if (field === 'allergies') {
      const wrapOther = document.getElementById('wrapAllergiesOther');
      const wrapDetails = document.getElementById('wrapAllergiesDetails');
      if (wrapOther) wrapOther.style.display = hasOther ? 'block' : 'none';
      if (wrapDetails) wrapDetails.style.display = hasAnyRealItem ? 'block' : 'none';
    } else if (field === 'medical') {
      const wrapOther = document.getElementById('wrapMedicalOther');
      const wrapDetails = document.getElementById('wrapMedicalDetails');
      if (wrapOther) wrapOther.style.display = hasOther ? 'block' : 'none';
      if (wrapDetails) wrapDetails.style.display = hasAnyRealItem ? 'block' : 'none';
    } else if (field === 'specialNeeds') {
      const wrapOther = document.getElementById('wrapSpecialNeedsOther');
      const wrapDetails = document.getElementById('wrapSpecialNeedsDetails');
      if (wrapOther) wrapOther.style.display = hasOther ? 'block' : 'none';
      if (wrapDetails) wrapDetails.style.display = hasAnyRealItem ? 'block' : 'none';
    } else if (field === 'personality') {
      const wrapOther = document.getElementById('wrapPersonalityOther');
      if (wrapOther) wrapOther.style.display = hasOther ? 'block' : 'none';
    } else if (field === 'interests') {
      const wrapOther = document.getElementById('wrapInterestsOther');
      if (wrapOther) wrapOther.style.display = hasOther ? 'block' : 'none';
    }
  }

  function getSelectedChips(gridId) {
    const grid = document.getElementById(gridId);
    if (!grid) return [];
    const activeChips = grid.querySelectorAll('.form-chip.active');
    return Array.from(activeChips).map(c => c.getAttribute('data-value'));
  }

  // Emergency contact toggle with registered parent details safeguard
  function setupEmergencyContactToggle() {
    const toggleBox = document.getElementById('wrapEmergencyParentToggle');
    const parentDetailsText = document.getElementById('emergencyParentDetailsText');
    const radioParent = document.getElementById('radioParentEmergency');
    const radioManual = document.getElementById('radioManualEmergency');
    const nameInput = document.getElementById('childEmergencyName');
    const phoneInput = document.getElementById('childEmergencyPhone');

    // SAFEGUARD: Only allow "Use my registered contact details" when user is authenticated
    // and both actual registered name and phone are non-empty. Never use placeholder data!
    const hasRegisteredParent = Boolean(
      state.isLoggedIn &&
      state.user &&
      typeof state.user.name === 'string' &&
      state.user.name.trim() !== '' &&
      typeof state.user.phone === 'string' &&
      state.user.phone.trim() !== ''
    );

    if (hasRegisteredParent && toggleBox && parentDetailsText) {
      toggleBox.style.display = 'flex';
      parentDetailsText.textContent = `${state.user.name} • ${state.user.phone}`;

      if (radioParent) {
        radioParent.onchange = () => {
          if (radioParent.checked) {
            nameInput.value = state.user.name;
            phoneInput.value = state.user.phone;
            nameInput.classList.remove('input-error');
            phoneInput.classList.remove('input-error');
            const errN = document.getElementById('errorChildEmergencyName');
            const errP = document.getElementById('errorChildEmergencyPhone');
            if (errN) errN.style.display = 'none';
            if (errP) errP.style.display = 'none';
          }
        };
      }

      if (radioManual) {
        radioManual.onchange = () => {
          if (radioManual.checked) {
            nameInput.value = '';
            phoneInput.value = '';
            nameInput.focus();
          }
        };
      }
    } else if (toggleBox) {
      toggleBox.style.display = 'none';
      if (radioManual) radioManual.checked = true;
    }
  }

  function getChildFormData() {
    const allergies = getSelectedChips('chipsAllergies');
    const allergiesOther = document.getElementById('childAllergiesOther')?.value.trim() || '';
    const allergiesDetails = document.getElementById('childAllergiesDetails')?.value.trim() || '';

    const medical = getSelectedChips('chipsMedical');
    const medicalOther = document.getElementById('childMedicalOther')?.value.trim() || '';
    const medicalDetails = document.getElementById('childMedicalDetails')?.value.trim() || '';

    const specialNeeds = getSelectedChips('chipsSpecialNeeds');
    const specialNeedsOther = document.getElementById('childSpecialNeedsOther')?.value.trim() || '';
    const specialNeedsDetails = document.getElementById('childSpecialNeedsDetails')?.value.trim() || '';

    const personality = getSelectedChips('chipsPersonality');
    const personalityOther = document.getElementById('childPersonalityOther')?.value.trim() || '';

    const interests = getSelectedChips('chipsInterests');
    const interestsOther = document.getElementById('childInterestsOther')?.value.trim() || '';

    const routineSleep = getSelectedChips('chipsRoutineSleep');
    const routineFeeding = getSelectedChips('chipsRoutineFeeding');
    const routineNotes = document.getElementById('childRoutineNotes')?.value.trim() || '';

    const radioParent = document.getElementById('radioParentEmergency');
    const isParentEmergency = Boolean(radioParent && radioParent.checked);

    // SAFEGUARD: Generate readable string values for c.routine and c.description
    // Ensures legacy screens receive clean strings, not arrays!
    const routineParts = [];
    if (routineSleep.length > 0) routineParts.push(routineSleep.join(', '));
    if (routineFeeding.length > 0) routineParts.push(routineFeeding.join(', '));
    if (routineNotes) routineParts.push(routineNotes);
    const routineLegacyStr = routineParts.length > 0 ? routineParts.join(' • ') : 'Standard routine';

    const descParts = [];
    if (personality.length > 0) {
      const pItems = [...personality.filter(p => p !== 'Other')];
      if (personalityOther) pItems.push(personalityOther);
      descParts.push(pItems.join(', '));
    }
    if (interests.length > 0) {
      const iItems = [...interests.filter(i => i !== 'Other')];
      if (interestsOther) iItems.push(interestsOther);
      descParts.push('Loves ' + iItems.join(', '));
    }
    const descriptionLegacyStr = descParts.length > 0 ? descParts.join('. ') : 'Friendly and curious.';

    return {
      id: 'child_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: document.getElementById('childName').value.trim(),
      gender: document.getElementById('childGender').value,
      birthDate: document.getElementById('childBirthDate').value,

      // Health & Safety
      allergies: allergies,
      allergiesOther: allergiesOther,
      allergiesDetails: allergiesDetails,
      medical: medical,
      medicalOther: medicalOther,
      medicalDetails: medicalDetails,
      specialNeeds: specialNeeds,
      specialNeedsOther: specialNeedsOther,
      specialNeedsDetails: specialNeedsDetails,

      // Personality & Interests
      personality: personality,
      personalityOther: personalityOther,
      interests: interests,
      interestsOther: interestsOther,

      // Routine
      routineSleep: routineSleep,
      routineFeeding: routineFeeding,
      routineNotes: routineNotes,

      // Emergency Contact
      isParentEmergencyContact: isParentEmergency,
      emergencyName: document.getElementById('childEmergencyName').value.trim(),
      emergencyPhone: document.getElementById('childEmergencyPhone').value.trim(),

      // Backward-compatibility string properties for legacy screens
      routine: routineLegacyStr,
      description: descriptionLegacyStr,
    };
  }

  function resetChildForm() {
    const nameEl = document.getElementById('childName');
    const genderEl = document.getElementById('childGender');
    const birthEl = document.getElementById('childBirthDate');
    const routineNotesEl = document.getElementById('childRoutineNotes');
    const emergNameEl = document.getElementById('childEmergencyName');
    const emergPhoneEl = document.getElementById('childEmergencyPhone');

    if (nameEl) nameEl.value = '';
    if (genderEl) genderEl.value = 'Boy';
    if (birthEl) birthEl.value = '';
    if (routineNotesEl) routineNotesEl.value = '';
    if (emergNameEl) emergNameEl.value = '';
    if (emergPhoneEl) emergPhoneEl.value = '';

    // Clear conditional text inputs
    ['childAllergiesOther', 'childAllergiesDetails', 'childMedicalOther', 'childMedicalDetails',
      'childSpecialNeedsOther', 'childSpecialNeedsDetails', 'childPersonalityOther', 'childInterestsOther'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });

    // Hide conditional wraps
    ['wrapAllergiesOther', 'wrapAllergiesDetails', 'wrapMedicalOther', 'wrapMedicalDetails',
      'wrapSpecialNeedsOther', 'wrapSpecialNeedsDetails', 'wrapPersonalityOther', 'wrapInterestsOther'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

    // SAFEGUARD: Do not automatically select "None". Allow no selection until parent makes a choice!
    document.querySelectorAll('#screenAddChild .form-chip').forEach(chip => {
      chip.classList.remove('active');
    });

    // Reset emergency radio to manual if present
    const radioManual = document.getElementById('radioManualEmergency');
    if (radioManual) radioManual.checked = true;

    // Clear error highlights
    ['childName', 'childBirthDate', 'childEmergencyName', 'childEmergencyPhone'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
      const err = document.getElementById(`error${id.charAt(0).toUpperCase() + id.slice(1)}`);
      if (err) err.style.display = 'none';
    });
  }

  function isChildFormPartiallyFilled() {
    const name = document.getElementById('childName')?.value.trim() || '';
    const birthDate = document.getElementById('childBirthDate')?.value || '';
    const emergName = document.getElementById('childEmergencyName')?.value.trim() || '';
    const emergPhone = document.getElementById('childEmergencyPhone')?.value.trim() || '';
    const notes = document.getElementById('childRoutineNotes')?.value.trim() || '';
    const activeChipsCount = document.querySelectorAll('#screenAddChild .form-chip.active').length;
    return Boolean(name || birthDate || emergName || emergPhone || notes || activeChipsCount > 0);
  }

  function formatChildAge(birthDateStr) {
    if (!birthDateStr) return '';
    const birth = new Date(birthDateStr);
    if (isNaN(birth.getTime())) return '';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    if (years >= 1) {
      return `${years} year${years > 1 ? 's' : ''} old`;
    } else {
      const months = Math.max(1, (now.getFullYear() - birth.getFullYear()) * 12 + monthDiff);
      return `${months} month${months > 1 ? 's' : ''} old`;
    }
  }

  // SAFEGUARD: Distinguish between an empty/unanswered field and explicitly selected "None"
  function formatAllergiesSummary(c) {
    if (!c) return 'None reported';
    if (Array.isArray(c.allergies)) {
      if (c.allergies.includes('None')) return 'None';
      if (c.allergies.length > 0) {
        const items = [...c.allergies.filter(a => a !== 'Other')];
        if (c.allergiesOther) items.push(c.allergiesOther);
        return items.join(', ');
      }
      return 'None reported';
    }
    if (typeof c.allergies === 'string' && c.allergies.trim()) {
      return c.allergies;
    }
    return 'None reported';
  }

  function formatMedicalSummary(c) {
    if (!c) return '';
    if (Array.isArray(c.medical)) {
      if (c.medical.includes('None')) return 'None';
      if (c.medical.length > 0) {
        const items = [...c.medical.filter(m => m !== 'Other')];
        if (c.medicalOther) items.push(c.medicalOther);
        return items.join(', ');
      }
      return '';
    }
    if (typeof c.medical === 'string' && c.medical.trim() && c.medical !== 'None') {
      return c.medical;
    }
    return '';
  }

  // SAFEGUARD: Display compact & easy to scan summary cards (Name, Age, Gender, Allergies, Medical)
  function renderSavedChildrenList() {
    const container = document.getElementById('savedChildrenSection');
    const list = document.getElementById('savedChildrenList');
    const countEl = document.getElementById('savedChildrenCount');

    if (!container || !list) return;

    if (!state.children || state.children.length === 0) {
      container.style.display = 'none';
      list.innerHTML = '';
      if (countEl) countEl.textContent = '0';
      return;
    }

    container.style.display = 'block';
    if (countEl) countEl.textContent = state.children.length;

    list.innerHTML = state.children.map(c => {
      const ageStr = formatChildAge(c.birthDate);
      const allergiesText = formatAllergiesSummary(c);
      const medicalText = formatMedicalSummary(c);
      const avatar = c.gender === 'Girl' ? '👧' : '👦';

      return `
        <div class="saved-child-card">
          <div class="saved-child-avatar">${avatar}</div>
          <div class="saved-child-info">
            <div class="saved-child-header">
              <strong class="saved-child-name">${escapeHtml(c.name)}</strong>
              <span class="saved-child-meta">${escapeHtml(c.gender)}${ageStr ? ' • ' + escapeHtml(ageStr) : ''}</span>
            </div>
            <p class="saved-child-details">
              <span>Allergies: ${escapeHtml(allergiesText)}</span>
              ${medicalText ? ` • <span>Medical: ${escapeHtml(medicalText)}</span>` : ''}
            </p>
          </div>
        </div>
      `;
    }).join('');
  }

  // Initialize chip groups on page load
  setupChipGroups();

  if (btnAddAnotherChild) {
    btnAddAnotherChild.addEventListener('click', () => {
      if (!validateChildForm()) {
        showToast('Please fill in all required fields marked with *');
        return;
      }
      const newChild = getChildFormData();
      state.children.push(newChild);
      state.child = newChild;
      state.bookingData.childId = newChild.id;
      state.bookingData.childName = newChild.name;
      state.bookingData.child = newChild;
      state.hasAddedChild = true;
      saveState();
      renderSavedChildrenList();
      resetChildForm();
      showToast(`Saved "${newChild.name}"! You can add another child now.`);
      const nameInput = document.getElementById('childName');
      if (nameInput) nameInput.focus();
    });
  }

  if (addChildForm) {
    addChildForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const hasSaved = Array.isArray(state.children) && state.children.length > 0;
      const hasInput = isChildFormPartiallyFilled();

      // If user has entered data in the form or hasn't saved any children yet, validate and save current entry
      if (hasInput || !hasSaved) {
        if (!validateChildForm()) {
          showToast('Please fill in all required fields marked with *');
          return;
        }
        const newChild = getChildFormData();
        state.children.push(newChild);
        state.child = newChild;
        state.bookingData.childId = newChild.id;
        state.bookingData.childName = newChild.name;
        state.bookingData.child = newChild;
        state.hasAddedChild = true;
        saveState();
        renderSavedChildrenList();
        resetChildForm();
        showToast(`Child "${newChild.name}" saved!`);
      }

      if (!state.children || state.children.length === 0) {
        showToast('Please add at least one child.');
        return;
      }

      state.child = state.children[0];
      state.hasAddedChild = true;
      saveState();

      if (state.bookingIntent) {
        showScreen('bookingDetails');
      } else {
        showScreen('parentHome');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 14. Screen 10: Booking Details
  // --------------------------------------------------------------------------
  function updateBookingChildSummaryCard(child) {
    const card = document.getElementById('bookingChildSummaryCard');
    const avatarEl = document.getElementById('bookingChildAvatar');
    const nameEl = document.getElementById('bookingChildName');
    const metaEl = document.getElementById('bookingChildMeta');
    const healthEl = document.getElementById('bookingChildHealthSummary');
    const routineEl = document.getElementById('bookingChildRoutineSummary');

    if (!card || !child) return;

    card.style.display = 'block';
    if (avatarEl) avatarEl.textContent = child.gender === 'Girl' ? '👧' : '👦';
    if (nameEl) nameEl.textContent = child.name;

    const ageStr = formatChildAge(child.birthDate);
    if (metaEl) metaEl.textContent = `${child.gender || 'Child'}${ageStr ? ' • ' + ageStr : ''}`;

    const allergies = formatAllergiesSummary(child);
    const medical = formatMedicalSummary(child);
    let healthText = `Allergies: ${allergies}`;
    if (medical) healthText += ` • Medical: ${medical}`;
    if (healthEl) healthEl.textContent = healthText;

    let routineText = '';
    if (child.routine && typeof child.routine === 'string') {
      routineText = `Routine: ${child.routine}`;
    } else if (Array.isArray(child.routineSleep) && child.routineSleep.length > 0) {
      routineText = `Routine: ${child.routineSleep.join(', ')}`;
    } else {
      routineText = 'Routine: Standard daily routine';
    }
    if (routineEl) routineEl.textContent = routineText;
  }

  function setupBookingDetails() {
    const hasChildren = Array.isArray(state.children) && state.children.length > 0;
    if (!hasChildren) {
      showToast('Please add your child\'s profile before booking.');
      showScreen('addChild');
      return;
    }

    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];

    const bookingSitterTitle = document.getElementById('bookingSitterTitle');
    const bookingSitterRate = document.getElementById('bookingSitterRate');
    const bookingChildSelect = document.getElementById('bookingChildSelect');
    const bookingLocationInput = document.getElementById('bookingLocationInput');

    if (bookingSitterTitle) bookingSitterTitle.textContent = sitter.name;
    if (bookingSitterRate) bookingSitterRate.textContent = `${sitter.rateText} / hr • Ease Trained`;
    if (bookingLocationInput) bookingLocationInput.value = `${state.postcode} Kuala Lumpur`;

    if (bookingChildSelect) {
      // Determine which child should be selected
      let selectedChild = state.children.find(c => c.id === state.bookingData.childId);
      if (!selectedChild) {
        selectedChild = state.children[0];
        state.bookingData.childId = selectedChild.id;
        state.bookingData.childName = selectedChild.name;
        state.bookingData.child = selectedChild;
      }

      bookingChildSelect.innerHTML = state.children.map(c => {
        const ageStr = formatChildAge(c.birthDate);
        const isSel = c.id === selectedChild.id ? 'selected' : '';
        return `<option value="${c.id}" ${isSel}>${escapeHtml(c.name)} (${ageStr || c.gender})</option>`;
      }).join('');

      updateBookingChildSummaryCard(selectedChild);

      bookingChildSelect.onchange = () => {
        const chosenId = bookingChildSelect.value;
        const chosenChild = state.children.find(c => c.id === chosenId) || state.children[0];
        if (chosenChild) {
          state.bookingData.childId = chosenChild.id;
          state.bookingData.childName = chosenChild.name;
          state.bookingData.child = chosenChild;
          state.child = chosenChild;
          updateBookingChildSummaryCard(chosenChild);
          saveState();
        }
      };
    }

    recalcBookingPrice();
  }

  const btnBookingAddChild = document.getElementById('btnBookingAddChild');
  if (btnBookingAddChild) {
    btnBookingAddChild.addEventListener('click', () => {
      state.bookingIntent = true;
      saveState();
      showScreen('addChild');
    });
  }

  function recalcBookingPrice() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const hoursSelect = document.getElementById('bookingHours');
    const trialOption = document.getElementById('bookingTrialOption');

    const hours = hoursSelect ? Number(hoursSelect.value) : 4;
    const isTrial = trialOption ? trialOption.checked : false;
    const rate = sitter.price;

    let totalHours = hours;
    if (isTrial) totalHours += 1; // 1-hour trial session

    const subtotal = totalHours * rate;
    const fee = 5;
    const total = subtotal + fee;

    state.bookingData.hours = hours;
    state.bookingData.isTrial = isTrial;
    state.bookingData.rate = rate;
    state.bookingData.subtotal = subtotal;
    state.bookingData.total = total;

    const priceBreakdownHours = document.getElementById('priceBreakdownHours');
    const priceBreakdownBase = document.getElementById('priceBreakdownBase');
    const priceBreakdownTotal = document.getElementById('priceBreakdownTotal');

    if (priceBreakdownHours) {
      priceBreakdownHours.textContent = isTrial
        ? `${hours} hrs + 1 hr trial (${totalHours} hrs × RM ${rate}/hr)`
        : `${hours} hours × RM ${rate}/hr`;
    }
    if (priceBreakdownBase) priceBreakdownBase.textContent = `RM ${subtotal}`;
    if (priceBreakdownTotal) priceBreakdownTotal.textContent = `RM ${total}`;
  }

  const bookingHours = document.getElementById('bookingHours');
  const bookingTrialOption = document.getElementById('bookingTrialOption');
  const bookingDetailsForm = document.getElementById('bookingDetailsForm');

  if (bookingHours) bookingHours.addEventListener('change', recalcBookingPrice);
  if (bookingTrialOption) bookingTrialOption.addEventListener('change', recalcBookingPrice);

  if (bookingDetailsForm) {
    bookingDetailsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      recalcBookingPrice();

      const bookingChildSelect = document.getElementById('bookingChildSelect');
      const selectedId = bookingChildSelect ? bookingChildSelect.value : state.bookingData.childId;
      const selectedChild = state.children.find(c => c.id === selectedId) || state.children[0] || state.child;

      if (selectedChild) {
        state.bookingData.childId = selectedChild.id;
        state.bookingData.childName = selectedChild.name;
        state.bookingData.child = selectedChild;
        state.child = selectedChild;
      }

      state.bookingData.date = document.getElementById('bookingDateInput').value || '2026-11-20';
      state.bookingData.time = document.getElementById('bookingTimeStart').value || '14:00';
      state.bookingData.location = document.getElementById('bookingLocationInput').value || '50450 Kuala Lumpur';
      state.bookingData.specialReq = document.getElementById('bookingSpecialReq').value;
      state.bookingData.extraNotes = document.getElementById('bookingExtraNotes').value;

      state.bookingStatusState = 'waiting';
      saveState();

      showScreen('bookingStatus');
    });
  }

  // --------------------------------------------------------------------------
  // 15. Screen 11: Booking Status (3 States with Demo Switcher)
  // --------------------------------------------------------------------------
  function renderBookingStatus(statusState) {
    state.bookingStatusState = statusState;
    saveState();

    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];

    const panelWaiting = document.getElementById('statusStateWaiting');
    const panelAccepted = document.getElementById('statusStateAccepted');
    const panelDeclined = document.getElementById('statusStateDeclined');

    const sitterNameWaiting = document.getElementById('statusSitterNameWaiting');
    const statusAcceptedHeadline = document.getElementById('statusAcceptedHeadline');

    if (sitterNameWaiting) sitterNameWaiting.textContent = sitter.name;
    if (statusAcceptedHeadline) statusAcceptedHeadline.textContent = `${sitter.name.split(' ')[0]} accepted your booking!`;

    if (panelWaiting) panelWaiting.style.display = statusState === 'waiting' ? 'flex' : 'none';
    if (panelAccepted) panelAccepted.style.display = statusState === 'accepted' ? 'flex' : 'none';
    if (panelDeclined) panelDeclined.style.display = statusState === 'declined' ? 'flex' : 'none';

    // Countdown Timer in Waiting state
    clearInterval(waitingCountdownInterval);
    if (statusState === 'waiting') {
      let secondsRemaining = 14 * 60 + 59;
      const countdownDigits = document.getElementById('waitingCountdown');
      waitingCountdownInterval = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining <= 0) {
          clearInterval(waitingCountdownInterval);
          return;
        }
        const m = Math.floor(secondsRemaining / 60).toString().padStart(2, '0');
        const s = (secondsRemaining % 60).toString().padStart(2, '0');
        if (countdownDigits) countdownDigits.textContent = `${m}:${s}`;
      }, 1000);
    }
  }

  // Demo Switcher Buttons
  const btnDemoWaiting = document.getElementById('btnDemoWaiting');
  const btnDemoAccept = document.getElementById('btnDemoAccept');
  const btnDemoDecline = document.getElementById('btnDemoDecline');

  if (btnDemoWaiting) {
    btnDemoWaiting.addEventListener('click', () => {
      renderBookingStatus('waiting');
    });
  }

  if (btnDemoAccept) {
    btnDemoAccept.addEventListener('click', () => {
      renderBookingStatus('accepted');
    });
  }

  if (btnDemoDecline) {
    btnDemoDecline.addEventListener('click', () => {
      renderBookingStatus('declined');
    });
  }

  // Action Buttons on Status Panels
  const btnPayNow = document.getElementById('btnPayNow');
  const btnFindAnotherSitter = document.getElementById('btnFindAnotherSitter');
  const btnCancelBookingRequest = document.getElementById('btnCancelBookingRequest');

  if (btnPayNow) {
    btnPayNow.addEventListener('click', () => {
      showScreen('payment');
    });
  }

  if (btnFindAnotherSitter) {
    btnFindAnotherSitter.addEventListener('click', () => {
      showScreen('matches');
    });
  }

  if (btnCancelBookingRequest) {
    btnCancelBookingRequest.addEventListener('click', () => {
      if (confirm('Are you sure you want to cancel this booking request?')) {
        showToast('Booking request cancelled.');
        showScreen('matches');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 16. Screen 12: Payment (First Attempt Fails, Second Succeeds)
  // --------------------------------------------------------------------------
  function setupPaymentScreen() {
    const totalAmountDisplay = document.querySelector('.payment-total-amount');
    const btnSubmitPayment = document.getElementById('btnSubmitPayment');
    const btnRetryPayment = document.getElementById('btnRetryPayment');
    const paymentErrorBox = document.getElementById('paymentErrorBox');

    const total = state.bookingData.total || 105;
    if (totalAmountDisplay) totalAmountDisplay.textContent = `RM ${total}`;
    if (btnSubmitPayment) {
      btnSubmitPayment.textContent = `Pay RM ${total}`;
      btnSubmitPayment.style.display = 'block';
    }
    if (btnRetryPayment) btnRetryPayment.style.display = 'none';
    if (paymentErrorBox) paymentErrorBox.style.display = 'none';

    state.paymentAttempts = 0;
  }

  // Payment Option selection
  const paymentOptions = document.querySelectorAll('.payment-options-grid .option-card');
  paymentOptions.forEach(card => {
    card.addEventListener('click', () => {
      paymentOptions.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      state.selectedPaymentMethod = card.getAttribute('data-pay-method');
      saveState();
    });
  });

  const btnSubmitPayment = document.getElementById('btnSubmitPayment');
  const btnRetryPayment = document.getElementById('btnRetryPayment');
  const paymentErrorBox = document.getElementById('paymentErrorBox');

  if (btnSubmitPayment) {
    btnSubmitPayment.addEventListener('click', () => {
      // First attempt fails deliberately with a clear error
      state.paymentAttempts = 1;
      btnSubmitPayment.style.display = 'none';
      if (paymentErrorBox) paymentErrorBox.style.display = 'flex';
      if (btnRetryPayment) btnRetryPayment.style.display = 'block';
    });
  }

  if (btnRetryPayment) {
    btnRetryPayment.addEventListener('click', () => {
      // Second attempt succeeds
      state.paymentAttempts = 2;
      if (paymentErrorBox) paymentErrorBox.style.display = 'none';
      showToast('Payment successful! Your session is confirmed.');
      showScreen('bookingConfirmed');
    });
  }

  // --------------------------------------------------------------------------
  // 17. Screen 13: Booking Confirmed
  // --------------------------------------------------------------------------
  function setupBookingConfirmed() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const confirmedSitterName = document.getElementById('confirmedSitterName');
    const confirmedChildName = document.getElementById('confirmedChildName');
    if (confirmedSitterName) confirmedSitterName.textContent = sitter.name;
    if (confirmedChildName) {
      confirmedChildName.textContent = state.bookingData.childName || (state.child && state.child.name) || 'Liam';
    }
  }

  const btnAddCalendar = document.getElementById('btnAddCalendar');
  const btnGoHome = document.getElementById('btnGoHome');

  if (btnAddCalendar) {
    btnAddCalendar.addEventListener('click', () => {
      showToast('Booking added to your Google Calendar!');
    });
  }

  if (btnGoHome) {
    btnGoHome.addEventListener('click', () => {
      showScreen('parentHome');
    });
  }

  // --------------------------------------------------------------------------
  // 18. Screen 14: Parent Home (Logged In Dashboard)
  // --------------------------------------------------------------------------
  function setupParentHome() {
    const greeting = document.getElementById('homeGreetingTitle');
    const homeChildName = document.getElementById('homeChildName');
    const homeNextBookingChild = document.getElementById('homeNextBookingChild');

    const firstName = (state.user.name || 'Jessica').split(' ')[0];
    if (greeting) greeting.textContent = `Welcome back, ${firstName}`;

    const activeChild = state.child || (state.children && state.children[0]) || null;
    const activeChildName = (activeChild && activeChild.name) || 'Liam';
    if (homeChildName) homeChildName.textContent = activeChildName;
    if (homeNextBookingChild) {
      homeNextBookingChild.textContent = state.bookingData.childName || activeChildName;
    }
  }

  const btnHomeViewDetails = document.getElementById('btnHomeViewDetails');
  const btnHomeMessageSarah = document.getElementById('btnHomeMessageSarah');
  const btnHomeFindSitter = document.getElementById('btnHomeFindSitter');
  const btnHomeViewNur = document.getElementById('btnHomeViewNur');
  const btnHomeViewAisyah = document.getElementById('btnHomeViewAisyah');
  const btnHomeAddChild = document.getElementById('btnHomeAddChild');
  const btnHomeBookAgain = document.getElementById('btnHomeBookAgain');
  const btnHomeViewAllMessages = document.getElementById('btnHomeViewAllMessages');
  const homeRecentMsgCard = document.getElementById('homeRecentMsgCard');

  if (btnHomeViewDetails) {
    btnHomeViewDetails.addEventListener('click', () => {
      showScreen('bookingConfirmed');
    });
  }

  if (btnHomeMessageSarah) {
    btnHomeMessageSarah.addEventListener('click', () => {
      state.selectedSitterId = 'sarah-lim';
      showScreen('chat');
    });
  }

  if (btnHomeFindSitter) {
    btnHomeFindSitter.addEventListener('click', () => {
      showScreen('matches');
    });
  }

  if (btnHomeViewNur) {
    btnHomeViewNur.addEventListener('click', () => {
      state.selectedSitterId = 'nur-ain';
      showScreen('profile');
    });
  }

  if (btnHomeViewAisyah) {
    btnHomeViewAisyah.addEventListener('click', () => {
      state.selectedSitterId = 'aisyah';
      showScreen('profile');
    });
  }

  if (btnHomeAddChild) {
    btnHomeAddChild.addEventListener('click', () => {
      showScreen('addChild');
    });
  }

  if (btnHomeBookAgain) {
    btnHomeBookAgain.addEventListener('click', () => {
      startBookingFlow('sarah-lim');
    });
  }

  if (btnHomeViewAllMessages) {
    btnHomeViewAllMessages.addEventListener('click', () => {
      showScreen('chat');
    });
  }

  if (homeRecentMsgCard) {
    homeRecentMsgCard.addEventListener('click', () => {
      showScreen('chat');
    });
  }

  // --------------------------------------------------------------------------
  // 19. Screen 15: Private Chat
  // --------------------------------------------------------------------------
  function setupChatScreen() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const chatSitterName = document.getElementById('chatSitterName');
    const chatMessagesArea = document.getElementById('chatMessagesArea');

    if (chatSitterName) chatSitterName.textContent = sitter.name;
    if (chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
  }

  const btnChatBack = document.getElementById('btnChatBack');
  const btnChatBook = document.getElementById('btnChatBook');
  const chatForm = document.getElementById('chatForm');
  const chatInputText = document.getElementById('chatInputText');
  const chatMessagesArea = document.getElementById('chatMessagesArea');
  const btnChatAttach = document.getElementById('btnChatAttach');

  if (btnChatBack) {
    btnChatBack.addEventListener('click', () => {
      if (screenHistory.length > 1) {
        screenHistory.pop();
        showScreen(screenHistory[screenHistory.length - 1], false);
      } else {
        showScreen(state.isLoggedIn ? 'parentHome' : 'profile', false);
      }
    });
  }

  if (btnChatBook) {
    btnChatBook.addEventListener('click', () => {
      startBookingFlow(state.selectedSitterId);
    });
  }

  if (btnChatAttach) {
    btnChatAttach.addEventListener('click', () => {
      showToast('Photo or document attachment selected.');
    });
  }

  if (chatForm && chatInputText && chatMessagesArea) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = chatInputText.value.trim();
      if (!text) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Append parent bubble
      const parentBubble = document.createElement('div');
      parentBubble.className = 'chat-message chat-msg-parent';
      parentBubble.innerHTML = `
        <p>${escapeHtml(text)}</p>
        <span class="chat-time">${timeStr}</span>
      `;
      chatMessagesArea.appendChild(parentBubble);
      chatInputText.value = '';
      chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

      // Simulated auto-reply from sitter after 900ms
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sitterBubble = document.createElement('div');
        sitterBubble.className = 'chat-message chat-msg-sitter';
        sitterBubble.innerHTML = `
          <p>Thanks for your message! Looking forward to our session.</p>
          <span class="chat-time">${replyTime}</span>
        `;
        chatMessagesArea.appendChild(sitterBubble);
        chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
      }, 900);
    });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  // --------------------------------------------------------------------------
  // 20. Mobile Bottom Navigation
  // --------------------------------------------------------------------------
  function updateBottomNavActive(screenId) {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    navItems.forEach(item => {
      const navTarget = item.getAttribute('data-nav');
      if (
        (navTarget === 'home' && screenId === 'parentHome') ||
        (navTarget === 'find' && (screenId === 'matches' || screenId === 'profile' || screenId === 'compare')) ||
        (navTarget === 'bookings' && (screenId === 'bookingStatus' || screenId === 'bookingDetails' || screenId === 'bookingConfirmed')) ||
        (navTarget === 'messages' && screenId === 'chat')
      ) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('.bottom-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = btn.getAttribute('data-nav');
      if (nav === 'home') {
        showScreen('parentHome');
      } else if (nav === 'find') {
        showScreen('matches');
      } else if (nav === 'bookings') {
        showScreen('bookingStatus');
      } else if (nav === 'messages') {
        showScreen('chat');
      } else if (nav === 'profile') {
        showToast(`Signed in as ${state.user.name} (${state.user.email})`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 21. Toast Helper
  // --------------------------------------------------------------------------
  function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMsg = document.getElementById('toastMessage');

    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  // --------------------------------------------------------------------------
  // 22. Initial Route Detection
  // --------------------------------------------------------------------------
  const hash = window.location.hash.replace('#/', '');
  if (hash && screens[hash]) {
    showScreen(hash, false);
  } else {
    showScreen('welcome', false);
  }

  // Handle browser native Back/Forward buttons
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#/', '');
    const target = h && screens[h] ? h : 'welcome';
    if (target !== currentScreen) {
      showScreen(target, false);
    }
  });
});
