// Ease Babysitter - Comprehensive Application Logic (Phase 1 & Phase 2)
import { babysittersData as sittersData, postcodeLocations } from './data/babysitters.js';

document.addEventListener('DOMContentLoaded', () => {
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
    answeredPreferences: {
      availability: false,
      distance: false,
      careType: false,
      childAge: false,
      budget: false,
      extras: false,
    },
    comparedSitters: new Set(),

    // User & Auth state
    isLoggedIn: false,
    writtenReviews: {},
    authReturnScreen: 'booking',
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
      if (!parsed.answeredPreferences) {
        state.answeredPreferences = {
          availability: Boolean(parsed.customDate) || (Boolean(parsed.when) && parsed.when !== 'Today'),
          distance: Boolean(parsed.postcode) && parsed.postcode !== '50450',
          careType: Boolean(parsed.careType) && parsed.careType !== 'Half day',
          childAge: Array.isArray(parsed.whoNeedsCare) &&
            JSON.stringify(parsed.whoNeedsCare) !== JSON.stringify(['Toddler 1 to 3']),
          budget: parsed.budget !== undefined && Number(parsed.budget) !== 25,
          extras: Array.isArray(parsed.extras) &&
            JSON.stringify(parsed.extras) !== JSON.stringify(['CPR certified', 'Speaks Mandarin', 'Newborn experience']),
        };
      }
    }
  } catch (e) {
    console.warn('Could not load localStorage state', e);
  }
  state.answeredPreferences = {
    availability: false,
    distance: false,
    careType: false,
    childAge: false,
    budget: false,
    extras: false,
    ...(state.answeredPreferences || {}),
  };
  Object.keys(state.answeredPreferences).forEach(key => {
    state.answeredPreferences[key] = Boolean(state.answeredPreferences[key]);
  });
  try {
    const storedLoginState = localStorage.getItem('easeLoggedIn');
    if (storedLoginState !== null) {
      state.isLoggedIn = storedLoginState === 'true';
    } else {
      localStorage.setItem('easeLoggedIn', String(state.isLoggedIn));
    }
  } catch (e) {
    console.warn('Could not load login state', e);
  }
  state.children = Array.isArray(state.children) && state.children.length
    ? state.children
    : (state.hasAddedChild && state.child ? [state.child] : []);
  if (state.children.length) state.child = state.children[0];

  function calculateDistanceKm(parentPostcode, sitterPostcode) {
    const origin = postcodeLocations[parentPostcode];
    const destination = postcodeLocations[sitterPostcode];
    if (!origin || !destination) return null;

    const toRadians = degrees => degrees * Math.PI / 180;
    const latitudeDelta = toRadians(destination.latitude - origin.latitude);
    const longitudeDelta = toRadians(destination.longitude - origin.longitude);
    const originLatitude = toRadians(origin.latitude);
    const destinationLatitude = toRadians(destination.latitude);
    const haversine = Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(originLatitude) * Math.cos(destinationLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
    const normalizedHaversine = Math.min(1, Math.max(0, haversine));
    return 6371 * 2 * Math.atan2(Math.sqrt(normalizedHaversine), Math.sqrt(1 - normalizedHaversine));
  }

  const preferenceTooltipText = 'This counts how many of your preferences this babysitter fits. It is not a rating.';

  function formatPreferenceTime(time) {
    const [hourText, minuteText] = String(time).split(':');
    const hour = Number(hourText);
    const minute = Number(minuteText);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return '';
    const suffix = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}${minute ? `:${String(minute).padStart(2, '0')}` : ''}${suffix}`;
  }

  function dateMatchesAvailabilityDay(date, day) {
    const weekday = date.getDay();
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    if (day === dayName) return true;
    if (day === 'Weekdays') return weekday >= 1 && weekday <= 5;
    if (day === 'Weekends') return weekday === 0 || weekday === 6;
    return false;
  }

  function getAvailabilityPreference(sitter) {
    if (!state.answeredPreferences.availability) return null;
    const requestedTime = state.bookingData && state.bookingData.time;
    if (!/^\d{2}:\d{2}$/.test(requestedTime || '')) return null;
    const [requestedHour, requestedMinute] = requestedTime.split(':').map(Number);
    if (requestedHour > 23 || requestedMinute > 59) return null;
    const requestedMinutes = requestedHour * 60 + requestedMinute;
    let requestedDates = [];

    if (state.when === 'Today') {
      requestedDates = [new Date()];
    } else if (state.when === 'This week') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      requestedDates = Array.from({ length: 7 }, (_, offset) => {
        const date = new Date(start);
        date.setDate(date.getDate() + offset);
        return date;
      });
    } else if ((state.when === 'Pick a date' || state.when === 'Custom date') && state.customDate) {
      const date = new Date(`${state.customDate}T00:00:00`);
      if (!Number.isNaN(date.getTime())) requestedDates = [date];
    }

    if (!requestedDates.length) return null;
    for (const date of requestedDates) {
      const slot = (sitter.availability || []).find(candidate => {
        if (!dateMatchesAvailabilityDay(date, candidate.day)) return false;
        const [startHour, startMinute] = (candidate.startTime || '').split(':').map(Number);
        const [endHour, endMinute] = (candidate.endTime || '').split(':').map(Number);
        if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return false;
        const startMinutes = startHour * 60 + startMinute;
        const endMinutes = endHour * 60 + endMinute;
        return requestedMinutes >= startMinutes && requestedMinutes < endMinutes;
      });

      if (slot) {
        const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
        return {
          met: true,
          text: `Available ${dayName} ${formatPreferenceTime(slot.startTime)} to ${formatPreferenceTime(slot.endTime)}`,
        };
      }
    }

    const timeLabel = formatPreferenceTime(requestedTime);
    if (state.when === 'This week') {
      return { met: false, text: `Not available this week at ${timeLabel}` };
    }
    const date = requestedDates[0];
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
    return { met: false, text: `Not available ${dayName} at ${timeLabel}` };
  }

  function getAgePreference(ageValue) {
    const value = String(ageValue).toLowerCase();
    if (value.includes('baby') || value.includes('newborn')) return { key: 'newborn', label: 'newborns' };
    if (value.includes('toddler')) return { key: 'toddler', label: 'toddlers' };
    if (value.includes('preschool')) return { key: 'preschool', label: 'preschool-age children' };
    if (value.includes('school')) return { key: 'school-age', label: 'school-age children' };
    return { key: value, label: String(ageValue) };
  }

  function getExtraPreference(sitter, extra) {
    const languageList = String(sitter.languages || '').toLowerCase();
    const definitions = {
      'cpr certified': [Boolean(sitter.cpr), 'CPR certified', 'Does not have CPR certification'],
      'first aid certified': [Boolean(sitter.firstAid), 'First aid certified', 'Does not have first aid certification'],
      'newborn experience': [Boolean(sitter.newborn), 'Newborn experience', 'No newborn experience'],
      'special needs experience': [Boolean(sitter.specialNeeds), 'Special needs experience', 'No special needs experience'],
      'verified id and background check': [Boolean(sitter.verifiedIdAndBackground), 'Verified ID and background check', 'ID and background check are not verified'],
      'speaks mandarin': [languageList.includes('mandarin'), 'Speaks Mandarin', 'Does not speak Mandarin'],
    };
    const definition = definitions[String(extra).toLowerCase()];
    if (!definition) return { met: false, text: `Could not verify ${extra}` };
    return { met: definition[0], text: definition[0] ? definition[1] : definition[2] };
  }

  function getPreferencesForSitter(sitter) {
    const preferences = [];
    const answered = state.answeredPreferences;
    const postcode = String(state.postcode || '').trim();

    if (answered.availability) {
      const availability = getAvailabilityPreference(sitter);
      if (availability) preferences.push({ key: 'availability', ...availability });
    }
    if (answered.distance && postcode) {
      const distanceKm = calculateDistanceKm(postcode, sitter.postcode);
      if (distanceKm !== null) {
        const met = distanceKm <= sitter.travelKm;
        preferences.push({
          key: 'distance',
          met,
          text: met
            ? `Within ${distanceKm.toFixed(1)} km of ${postcode}`
            : `Outside the ${sitter.travelKm} km travel range: ${distanceKm.toFixed(1)} km from ${postcode}`,
        });
      }
    }
    if (answered.careType && state.careType) {
      const careType = String(state.careType);
      const met = (sitter.careTypes || []).includes(careType);
      preferences.push({
        key: 'careType',
        met,
        text: met ? `Offers ${careType.toLowerCase()} care` : `Does not offer ${careType.toLowerCase()} care`,
      });
    }
    if (answered.childAge && Array.isArray(state.whoNeedsCare)) {
      state.whoNeedsCare.forEach(ageValue => {
        const age = getAgePreference(ageValue);
        const met = (sitter.ageGroups || []).includes(age.key);
        preferences.push({
          key: `childAge-${age.key}`,
          met,
          text: met ? `Experience with ${age.label}` : `No experience with ${age.label}`,
        });
      });
    }
    if (answered.budget && state.budget !== '' && state.budget !== null && state.budget !== undefined) {
      const budget = Number(state.budget);
      if (Number.isFinite(budget)) {
        const overBudget = Math.max(0, sitter.price - budget);
        preferences.push({
          key: 'budget',
          met: overBudget === 0,
          text: overBudget === 0 ? `Within your budget (RM ${budget} / hr)` : `RM ${overBudget} over your budget`,
        });
      }
    }
    if (answered.extras && Array.isArray(state.extras)) {
      state.extras.forEach(extra => {
        preferences.push({ key: `extra-${extra}`, ...getExtraPreference(sitter, extra) });
      });
    }
    return preferences;
  }

  function renderPreferenceSummary(sitter, preferences = getPreferencesForSitter(sitter)) {
    if (!preferences.length) return '';
    const metCount = preferences.filter(preference => preference.met).length;
    const allMet = metCount === preferences.length;
    const label = preferences.length === 1 && allMet
      ? '1 preference met'
      : allMet
        ? `All ${preferences.length} preferences met`
        : `${metCount} of ${preferences.length} preferences met`;
    return `
      <span class="preference-summary-chip${allMet ? ' all-met' : ''}">
        <svg class="preference-summary-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>${escapeHtml(label)}</span>
      </span>
      <span class="preference-info" title="${preferenceTooltipText}" aria-label="${preferenceTooltipText}" tabindex="0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="11" x2="12" y2="16"></line><line x1="12" y1="7" x2="12.01" y2="7"></line></svg>
      </span>`;
  }

  function renderPreferenceItems(preferences, className = 'preferences-full-list') {
    if (!preferences.length) return '';
    return `<ul class="${className}">${preferences.map(preference => `
      <li class="${preference.met ? 'is-met' : 'is-unmet'}">
        <span class="preference-item-icon" aria-hidden="true">${preference.met ? '✓' : '—'}</span>
        <span>${escapeHtml(preference.text)}</span>
      </li>
    `).join('')}</ul>`;
  }

  function renderPreferenceCardList(preferences) {
    if (!preferences.length) return '';
    const preview = preferences.filter(preference => preference.met).slice(0, 3);
    const hasMore = preferences.length > preview.length;
    return `
      <div class="preference-card-list">
        ${renderPreferenceItems(preview, 'preferences-preview-list')}
        ${hasMore ? `
          <div class="preferences-expanded-list" hidden>${renderPreferenceItems(preferences)}</div>
          <button type="button" class="preferences-expand-link" aria-expanded="false">See all ${preferences.length} ${preferences.length === 1 ? 'preference' : 'preferences'}</button>
        ` : ''}
      </div>`;
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.preferences-expand-link');
    if (!button) return;
    const list = button.closest('.preference-card-list');
    if (!list) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    const preview = list.querySelector('.preferences-preview-list');
    const full = list.querySelector('.preferences-expanded-list');
    if (preview) preview.hidden = !expanded;
    if (full) full.hidden = expanded;
    button.setAttribute('aria-expanded', String(!expanded));
    const preferenceCount = full ? full.querySelectorAll('li').length : 0;
    button.textContent = expanded
      ? `See all ${preferenceCount} ${preferenceCount === 1 ? 'preference' : 'preferences'}`
      : 'Show fewer preferences';
  });

  function saveState() {
    try {
      const serialized = {
        ...state,
        comparedSitters: Array.from(state.comparedSitters),
      };
      localStorage.setItem('ease_state', JSON.stringify(serialized));
    } catch (e) {
      console.warn('Could not save localStorage state', e);
    }
  }

  function setLoggedIn(isLoggedIn) {
    state.isLoggedIn = isLoggedIn;
    try {
      localStorage.setItem('easeLoggedIn', String(isLoggedIn));
    } catch (e) {
      console.warn('Could not save login state', e);
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
    find: document.getElementById('screenFind'),
    matches: document.getElementById('screenMatches'),
    profile: document.getElementById('screenProfile'),
    compare: document.getElementById('screenCompare'),
    review: document.getElementById('screenReview'),
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
  const drawerMenu = document.getElementById('drawerMenu');
  const drawerPanels = document.getElementById('drawerPanels');
  const bottomNav = document.getElementById('bottomNav');

  // Navigation History Stack
  const screenHistory = ['welcome'];
  let currentScreen = 'welcome';
  let waitingCountdownInterval = null;

  function syncQuestionOptions(screenSelector, selectedValues) {
    const values = new Set(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
    document.querySelectorAll(`${screenSelector} .option-card`).forEach(card => {
      const selected = values.has(card.getAttribute('data-value'));
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-checked', String(selected));
    });
  }

  function showScreen(screenId, pushHistory = true) {
    if (!screens[screenId]) return;
    const loggedInOnlyScreens = ['addChild', 'bookingDetails', 'bookingStatus', 'payment', 'bookingConfirmed', 'parentHome', 'chat', 'review'];
    if (!state.isLoggedIn && loggedInOnlyScreens.includes(screenId)) {
      state.bookingIntent = !['parentHome', 'chat', 'review'].includes(screenId);
      state.authReturnScreen = screenId === 'parentHome' ? 'parentHome' : screenId === 'chat' ? 'chat' : screenId === 'review' ? 'review' : 'booking';
      setAuthMode('signup');
      screenId = 'auth';
    }

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
    if (topbarLoginBtn) topbarLoginBtn.style.display = state.isLoggedIn ? 'none' : '';

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
    } else if (screenId === 'q2') {
      syncQuestionOptions('#screenQ2', state.when);
      const datePicker = document.getElementById('customDatePicker');
      const dateWrap = document.getElementById('customDateWrap');
      const customDateSelected = state.when === 'Pick a date' || state.when === 'Custom date';
      if (datePicker) datePicker.value = state.customDate || '';
      if (dateWrap) dateWrap.style.display = customDateSelected ? 'block' : 'none';
    } else if (screenId === 'q3') {
      syncQuestionOptions('#screenQ3', state.careType);
    } else if (screenId === 'q4') {
      syncQuestionOptions('#screenQ4', state.whoNeedsCare);
    } else if (screenId === 'q5') {
      const slider = document.getElementById('budgetSlider');
      const display = document.getElementById('budgetDisplayVal');
      if (slider && display) {
        slider.value = state.budget;
        display.textContent = `RM ${state.budget}`;
      }
    } else if (screenId === 'q6') {
      syncQuestionOptions('#screenQ6', state.extras);
    } else if (screenId === 'find') {
      activeFindPostcode = state.postcode || '50450';
      if (findPostcode) findPostcode.value = activeFindPostcode;
      renderFindSitters();
    } else if (screenId === 'matches') {
      renderTopMatches();
    } else if (screenId === 'profile') {
      populateProfile(state.selectedSitterId);
    } else if (screenId === 'compare') {
      populateCompareTable();
    } else if (screenId === 'review') {
      prepareReviewForm();
    } else if (screenId === 'addChild') {
      prepareAddChildForm();
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
  let drawerReturnButton = null;

  function showDrawerMenu(returnFocus) {
    if (drawerMenu) drawerMenu.hidden = false;
    if (drawerPanels) drawerPanels.hidden = true;
    navDrawer.querySelectorAll('.drawer-panel').forEach(panel => {
      panel.hidden = true;
    });
    if (returnFocus && drawerReturnButton) drawerReturnButton.focus();
    drawerReturnButton = null;
  }

  function openDrawer() {
    showDrawerMenu(false);
    navDrawer.inert = false;
    navDrawer.classList.add('active');
    drawerOverlay.classList.add('active');
    hamburgerBtn.setAttribute('aria-expanded', 'true');
    navDrawer.setAttribute('aria-hidden', 'false');
    drawerCloseBtn.focus();
  }

  function closeDrawer(returnFocus = true) {
    navDrawer.classList.remove('active');
    drawerOverlay.classList.remove('active');
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    navDrawer.setAttribute('aria-hidden', 'true');
    navDrawer.inert = true;
    showDrawerMenu(false);
    if (returnFocus) hamburgerBtn.focus();
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  if (drawerMenu && drawerPanels) {
    drawerMenu.addEventListener('click', event => {
      const routeLink = event.target.closest('[data-drawer-route]');
      if (routeLink) {
        event.preventDefault();
        closeDrawer(false);
        showScreen(routeLink.dataset.drawerRoute);
        return;
      }

      const item = event.target.closest('[data-drawer-panel]');
      if (!item) return;
      const panel = drawerPanels.querySelector(`[data-panel="${item.dataset.drawerPanel}"]`);
      if (!panel) return;

      drawerReturnButton = item;
      drawerMenu.hidden = true;
      drawerPanels.hidden = false;
      drawerPanels.querySelectorAll('.drawer-panel').forEach(drawerPanel => {
        drawerPanel.hidden = drawerPanel !== panel;
      });
      panel.focus();
    });

    drawerPanels.addEventListener('click', event => {
      if (!event.target.closest('.drawer-back')) return;
      showDrawerMenu(true);
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navDrawer.classList.contains('active')) {
      event.preventDefault();
      closeDrawer();
    }
  });

  // --------------------------------------------------------------------------
  // 5. Screen 1: Welcome Actions
  // --------------------------------------------------------------------------
  const roleNeedSitterCard = document.getElementById('roleNeedSitterCard');
  const roleAmSitterCard = document.getElementById('roleAmSitterCard');
  const welcomeLoginLink = document.getElementById('welcomeLoginLink');
  const topbarLoginBtn = document.getElementById('loginBtn');

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
      state.bookingIntent = false;
      state.authReturnScreen = 'parentHome';
      setAuthMode('login');
      showScreen('auth');
    });
  }
  if (topbarLoginBtn) {
    topbarLoginBtn.addEventListener('click', () => {
      state.bookingIntent = false;
      state.authReturnScreen = 'parentHome';
      setAuthMode('login');
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
      state.answeredPreferences.distance = true;
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
      state.answeredPreferences.availability = val !== 'Pick a date' && val !== 'Custom date';
      saveState();
    });
  });

  if (btnNextQ2) {
    btnNextQ2.addEventListener('click', () => {
      const datePicker = document.getElementById('customDatePicker') || document.getElementById('customDateInput');
      if (state.when === 'Pick a date' || state.when === 'Custom date') {
        state.customDate = datePicker && datePicker.value ? datePicker.value : '';
        state.answeredPreferences.availability = Boolean(state.customDate);
      } else {
        state.answeredPreferences.availability = true;
      }
      saveState();
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
      state.answeredPreferences.careType = true;
      saveState();
    });
  });

  if (btnNextQ3) {
    btnNextQ3.addEventListener('click', () => {
      state.answeredPreferences.careType = true;
      saveState();
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
      state.answeredPreferences.childAge = true;
      saveState();
    });
  });

  if (btnNextQ4) {
    btnNextQ4.addEventListener('click', () => {
      state.answeredPreferences.childAge = true;
      saveState();
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
      state.answeredPreferences.budget = true;
      budgetDisplayVal.textContent = `RM ${val}`;
      saveState();
    });
  }

  if (btnNextQ5) {
    btnNextQ5.addEventListener('click', () => {
      state.answeredPreferences.budget = true;
      saveState();
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
      state.answeredPreferences.extras = true;
      saveState();
    });
  });

  if (btnNextQ6) {
    btnNextQ6.addEventListener('click', () => {
      state.answeredPreferences.extras = true;
      saveState();
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
      state.answeredPreferences.extras = false;
      saveState();
      showScreen('summary');
    });
  }

  // --------------------------------------------------------------------------
  // 8. Screen 4: Top Matches (Filters, Sort, Compare Bar)
  // --------------------------------------------------------------------------
  const filterChips = document.querySelectorAll('#screenMatches [data-sitter-filter]');
  const sitterCards = document.querySelectorAll('#screenMatches .sitter-match-card');
  const findSitterList = document.getElementById('findSitterList');
  const findForm = document.getElementById('findForm');
  const findPostcode = document.getElementById('findPostcode');
  const findActiveFilters = document.getElementById('findActiveFilters');
  const findResultsCount = document.getElementById('findResultsCount');
  const findEmptyState = document.getElementById('findEmptyState');
  const matchesPostcodeError = document.getElementById('matchesPostcodeError');
  const matchesNearbyState = document.getElementById('matchesNearbyState');
  const findFilters = ['filterRating', 'filterPrice', 'filterDistance', 'filterAvailability']
    .map(id => document.getElementById(id));
  let activeFindPostcode = state.postcode || '50450';
  if (findPostcode) findPostcode.value = activeFindPostcode;
  let activeSitterFilter = 'all';

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeSitterFilter = chip.dataset.sitterFilter;
      renderTopMatches();
    });
  });

  const sortSelect = document.getElementById('sortSittersSelect');
  const sittersListContainer = document.getElementById('sittersMatchList');

  function sortTopMatches() {
    if (!sortSelect || !sittersListContainer) return;
    const mode = sortSelect.value;
    const cards = Array.from(sittersListContainer.querySelectorAll('.sitter-match-card'));
    cards.sort((a, b) => {
      if (mode === 'preferences') {
        return Number(b.dataset.preferenceCount) - Number(a.dataset.preferenceCount) ||
          Number(a.dataset.distanceKm) - Number(b.dataset.distanceKm);
      }
      if (mode === 'rating') return Number(b.dataset.rating) - Number(a.dataset.rating);
      if (mode === 'price-asc') return Number(a.dataset.price) - Number(b.dataset.price);
      if (mode === 'price-desc') return Number(b.dataset.price) - Number(a.dataset.price);
      return Number(a.dataset.distanceKm) - Number(b.dataset.distanceKm);
    });
    cards.forEach(card => sittersListContainer.appendChild(card));
  }

  function passesSitterFilter(card) {
    if (activeSitterFilter === 'cpr') return card.dataset.cpr === 'true';
    if (activeSitterFilter === 'newborn') return card.dataset.newborn === 'true';
    if (activeSitterFilter === 'mandarin') return card.dataset.mandarin === 'true';
    return true;
  }

  function renderTopMatches() {
    if (!sittersListContainer) return;
    const parentLocation = postcodeLocations[state.postcode];
    if (!parentLocation) {
      sitterCards.forEach(card => { card.style.display = 'none'; });
      if (matchesNearbyState) matchesNearbyState.style.display = 'none';
      if (matchesPostcodeError) matchesPostcodeError.style.display = 'block';
      return;
    }

    if (matchesPostcodeError) matchesPostcodeError.style.display = 'none';
    let sittersInRange = 0;
    sitterCards.forEach(card => {
      const sitter = sittersData[card.dataset.sitterId];
      const distanceKm = calculateDistanceKm(state.postcode, sitter.postcode);
      if (distanceKm === null) {
        throw new Error(`Missing postcode coordinates for ${sitter.id}`);
      }

      const distanceText = `${sitter.area} · ${distanceKm.toFixed(1)} km away`;
      const preferences = getPreferencesForSitter(sitter);
      const preferenceSummary = card.querySelector('[data-preference-summary]');
      const preferenceList = card.querySelector('[data-preference-list]');
      if (preferenceSummary) preferenceSummary.innerHTML = renderPreferenceSummary(sitter, preferences);
      if (preferenceList) preferenceList.innerHTML = renderPreferenceCardList(preferences);

      const meta = card.querySelector('.sitter-meta');
      if (meta) {
        const baseText = meta.dataset.baseText || meta.textContent.trim();
        meta.dataset.baseText = baseText;
        meta.textContent = `${baseText} • ${distanceText}`;
      }

      card.dataset.distanceKm = String(distanceKm);
      card.dataset.preferenceCount = String(preferences.filter(preference => preference.met).length);
      const withinTravelRange = distanceKm <= sitter.travelKm;
      const availabilityPreference = preferences.find(preference => preference.key === 'availability');
      const availableForRequest = !state.answeredPreferences.availability ||
        !availabilityPreference || availabilityPreference.met;
      if (withinTravelRange && availableForRequest) sittersInRange += 1;
      card.style.display = withinTravelRange && availableForRequest && passesSitterFilter(card) ? 'flex' : 'none';
    });
    if (matchesNearbyState) {
      matchesNearbyState.style.display = sittersInRange ? 'none' : 'block';
    }
    sortTopMatches();
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', sortTopMatches);
  }

  if (matchesNearbyState) {
    matchesNearbyState.addEventListener('click', event => {
      if (!event.target.closest('#resetSitterFilters')) return;
      activeSitterFilter = 'all';
      filterChips.forEach(chip => {
        const isAll = chip.dataset.sitterFilter === 'all';
        chip.classList.toggle('active', isAll);
      });
      if (sortSelect) sortSelect.value = 'preferences';
      renderTopMatches();
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

  function renderActiveFindFilters() {
    const activeFilters = [];
    if (activeFindPostcode !== '50450') activeFilters.push(`Postcode ${activeFindPostcode}`);
    findFilters.forEach(filter => {
      if (filter.value !== '0' && filter.value !== 'all') {
        activeFilters.push(filter.options[filter.selectedIndex].textContent.trim());
      }
    });

    findActiveFilters.innerHTML = activeFilters.length ? `
      <div class="find-filter-chips">
        ${activeFilters.map(label => `
          <span class="find-filter-chip">
            <span class="check-icon" aria-hidden="true">✓</span>${escapeHtml(label)}
          </span>
        `).join('')}
      </div>
      <button type="button" class="clear-filters-link">Clear filters</button>
    ` : '';
  }

  function renderFindSitters() {
    if (!findSitterList) return;
    const minRating = Number(document.getElementById('filterRating').value);
    const maxPrice = Number(document.getElementById('filterPrice').value);
    const maxDistance = Number(document.getElementById('filterDistance').value);
    const availability = document.getElementById('filterAvailability').value;
    if (!postcodeLocations[activeFindPostcode]) {
      findSitterList.innerHTML = '';
      findSitterList.style.display = 'none';
      findResultsCount.textContent = '';
      findEmptyState.innerHTML = '<p role="alert">We could not find that postcode. Try 50450, 59000 or 50480.</p>';
      findEmptyState.style.display = 'block';
      renderActiveFindFilters();
      return;
    }

    const sitters = Object.values(sittersData).map(sitter => {
      const distanceKm = calculateDistanceKm(activeFindPostcode, sitter.postcode);
      if (distanceKm === null) {
        throw new Error(`Missing postcode coordinates for ${sitter.id}`);
      }
      return { ...sitter, distanceKm, preferences: getPreferencesForSitter(sitter) };
    });
    const withinTravelAndDistance = sitters.filter(sitter =>
      sitter.distanceKm <= sitter.travelKm && (!maxDistance || sitter.distanceKm <= maxDistance)
    );
    const filteredSitters = withinTravelAndDistance.filter(sitter => {
      const availabilityPreference = sitter.preferences.find(preference => preference.key === 'availability');
      const meetsAvailability = availability === 'all' || sitter.availability.some(slot =>
        slot.day.toLowerCase().includes(availability.toLowerCase()) ||
        (availability === 'Saturday' && slot.day === 'Weekends')
      );
      const availableForRequest = !state.answeredPreferences.availability ||
        !availabilityPreference || availabilityPreference.met;
      return sitter.ratingValue >= minRating &&
        (!maxPrice || sitter.price <= maxPrice) &&
        meetsAvailability &&
        availableForRequest;
    }).sort((a, b) =>
      b.preferences.filter(preference => preference.met).length -
        a.preferences.filter(preference => preference.met).length ||
      a.distanceKm - b.distanceKm
    );

    findSitterList.style.display = '';
    findSitterList.innerHTML = filteredSitters.map(sitter => {
      const certificateChips = sitter.certs.slice(0, 2).map(cert =>
        `<span class="chip"><span class="check-icon" aria-hidden="true">✓</span>${escapeHtml(cert.name)}</span>`
      ).join('');
      const stars = Array.from({ length: 5 }, () => '<span class="star-filled" aria-hidden="true">★</span>').join('');
      const initials = sitter.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
      return `
        <article class="card find-sitter-card" data-sitter-id="${sitter.id}" tabindex="0" role="group" aria-label="View ${escapeHtml(sitter.name)}'s profile">
          <div class="photo-placeholder find-sitter-photo" role="img" aria-label="Photo placeholder for ${escapeHtml(sitter.name)}">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span class="find-sitter-initials" aria-hidden="true">${escapeHtml(initials)}</span>
            <span class="photo-placeholder-caption">${escapeHtml(sitter.name)}</span>
          </div>
          <div class="find-sitter-content">
            <div class="find-sitter-details">
              <div class="find-sitter-heading">
                <h2 class="card-title">${escapeHtml(sitter.name)}</h2>
                <span class="badge badge-ease-trained">
                  <svg class="badge-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
                  Ease Trained
                </span>
              </div>
              <span class="preference-summary-slot">${renderPreferenceSummary(sitter, sitter.preferences)}</span>
              <p class="sitter-meta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${sitter.age} years old ·
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>${escapeHtml(sitter.exp)} experience ·
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>${escapeHtml(sitter.area)} · ${sitter.distanceKm.toFixed(1)} km away
              </p>
              <div class="stars-row" aria-label="Rating: ${sitter.ratingValue} out of 5 stars">
                <span class="find-stars">${stars}</span>
                <strong class="find-rating-value">${sitter.ratingValue.toFixed(1)}</strong>
                <span class="find-review-count">(${sitter.reviewsCount} reviews)</span>
              </div>
              <p class="sitter-languages"><strong>Languages:</strong> ${escapeHtml(sitter.languages)}</p>
              <div class="chips-row">${certificateChips}</div>
              ${renderPreferenceCardList(sitter.preferences)}
            </div>
            <div class="find-sitter-footer">
              <p class="find-price-tag"><strong>${escapeHtml(sitter.rateText)}</strong><span>/ hr</span></p>
              <button type="button" class="btn btn-primary find-view-button" data-view-profile="${sitter.id}">
                View profile
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B2A35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
              <label class="compare-label find-compare-label" for="find-compare-${sitter.id}">
                <input type="checkbox" class="find-compare-input" id="find-compare-${sitter.id}" data-sitter-id="${sitter.id}"${state.comparedSitters.has(sitter.id) ? ' checked' : ''}>
                <span>Compare</span>
              </label>
            </div>
          </div>
        </article>`;
    }).join('');

    findResultsCount.textContent = `${filteredSitters.length} ${filteredSitters.length === 1 ? 'babysitter' : 'babysitters'} found`;
    if (!filteredSitters.length && !withinTravelAndDistance.length) {
      findEmptyState.innerHTML = `
        <p>No babysitters nearby yet. Try a bigger distance.</p>
        <button type="button" class="btn btn-secondary reset-find-filters">Reset filters</button>
      `;
      findEmptyState.style.display = 'block';
    } else if (!filteredSitters.length) {
      findEmptyState.innerHTML = `
        <h2 class="card-title">No babysitters found</h2>
        <p>Try changing your postcode or filters.</p>
      `;
      findEmptyState.style.display = 'block';
    } else {
      findEmptyState.style.display = 'none';
    }
    renderActiveFindFilters();
  }

  if (findEmptyState) {
    findEmptyState.addEventListener('click', event => {
      if (!event.target.closest('.reset-find-filters')) return;
      findFilters.forEach(filter => {
        filter.value = filter.id === 'filterAvailability' ? 'all' : '0';
      });
      renderFindSitters();
    });
  }

  if (findForm && findPostcode) {
    findForm.addEventListener('submit', event => {
      event.preventDefault();
      const postcode = findPostcode.value.trim();
      if (!/^\d{5}$/.test(postcode)) {
        findPostcode.setCustomValidity('Enter a 5-digit postcode.');
        findPostcode.reportValidity();
        return;
      }
      findPostcode.setCustomValidity('');
      activeFindPostcode = postcode;
      state.postcode = postcode;
      state.answeredPreferences.distance = true;
      saveState();
      renderFindSitters();
    });
    findPostcode.addEventListener('input', () => findPostcode.setCustomValidity(''));
    findFilters.forEach(filter => filter.addEventListener('change', renderFindSitters));
  }

  if (findSitterList) {
    findSitterList.addEventListener('click', event => {
      if (event.target.closest('.preferences-expand-link, .preference-info')) return;
      if (event.target.closest('.find-compare-label')) return;
      const card = event.target.closest('.find-sitter-card');
      if (!card) return;
      state.selectedSitterId = card.dataset.sitterId;
      showScreen('profile');
    });
    findSitterList.addEventListener('change', event => {
      const input = event.target.closest('.find-compare-input');
      if (!input) return;
      const sitterId = input.dataset.sitterId;
      if (input.checked) state.comparedSitters.add(sitterId);
      else state.comparedSitters.delete(sitterId);
      saveState();
    });
    findSitterList.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.find-sitter-card')) {
        event.preventDefault();
        state.selectedSitterId = event.target.dataset.sitterId;
        showScreen('profile');
      }
    });

    if (findActiveFilters) {
      findActiveFilters.addEventListener('click', event => {
        if (!event.target.closest('.clear-filters-link')) return;
        findFilters.forEach(filter => {
          filter.value = filter.id === 'filterAvailability' ? 'all' : '0';
        });
        activeFindPostcode = '50450';
        state.postcode = activeFindPostcode;
        findPostcode.value = activeFindPostcode;
        saveState();
        renderFindSitters();
      });
    }
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

    const profileName = document.getElementById('profileName');
    const profileLocation = document.getElementById('profileLocation');
    const profilePhoto = document.getElementById('profilePhoto');
    const profileRatingText = document.getElementById('profileRatingText');
    const profileAge = document.getElementById('profileAge');
    const profileExp = document.getElementById('profileExp');
    const profileExpDetail = document.getElementById('profileExpDetail');
    const profileCertCount = document.getElementById('profileCertCount');
    const profileLanguages = document.getElementById('profileLanguages');
    const profileBio = document.getElementById('profileBio');
    const profileEduDegree = document.getElementById('profileEduDegree');
    const profileEduSchool = document.getElementById('profileEduSchool');
    const profileCertList = document.getElementById('profileCertList');
    const profileBookingName = document.getElementById('profileBookingName');
    const profileReviews = document.getElementById('profileReviews');
    const profileAvailability = document.getElementById('profileAvailability');
    const profilePreferencesSection = document.getElementById('profilePreferencesSection');
    const profilePreferencesHeading = document.getElementById('profilePreferencesHeading');
    const profilePreferencesList = document.getElementById('profilePreferencesList');

    if (profilePhoto) {
      profilePhoto.setAttribute('aria-label', `Photo placeholder for ${sitter.name}`);
      const caption = profilePhoto.querySelector('.photo-placeholder-caption');
      if (caption) caption.textContent = sitter.name;
    }
    if (profileName) profileName.textContent = sitter.name;
    if (profileLocation) {
      const distanceKm = calculateDistanceKm(state.postcode, sitter.postcode);
      profileLocation.textContent = distanceKm === null
        ? 'We could not find that postcode. Try 50450, 59000 or 50480.'
        : `${sitter.area} · ${distanceKm.toFixed(1)} km away`;
    }
    const isSarah = sitter.id === 'sarah-lim';
    if (profileRatingText) profileRatingText.textContent = isSarah ? '4.9 (87 reviews)' : sitter.rating;
    const profileRate = isSarah ? 'RM 20' : (sitter.rateText || 'RM 20');
    document.getElementById('stickyProfilePrice')?.replaceChildren(document.createTextNode(profileRate));
    document.getElementById('mobileProfilePrice')?.replaceChildren(document.createTextNode(profileRate));
    ['btnProfileStickyBook', 'btnProfileMobileBook'].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.textContent = `Book ${sitter.name.split(' ')[0]}`;
    });
    if (profileBookingName) profileBookingName.textContent = sitter.name.split(' ')[0];
    if (profileAge) profileAge.textContent = `${sitter.age} years old`;
    const experience = isSarah ? '6 years' : sitter.exp;
    if (profileExp) profileExp.textContent = experience;
    if (profileExpDetail) profileExpDetail.textContent = experience;
    if (profileLanguages) profileLanguages.textContent = sitter.languages;
    if (profileBio) profileBio.textContent = sitter.bio;
    if (profileEduDegree) profileEduDegree.textContent = sitter.degree;
    if (profileEduSchool) profileEduSchool.textContent = `${sitter.school} · 2020`;
    const initials = sitter.name.split(' ').map(part => part[0]).join('').slice(0, 2);
    const initialsElement = profilePhoto?.querySelector('.profile-initials');
    if (initialsElement) initialsElement.textContent = initials;

    const certificates = isSarah ? [
      { name: 'Pediatric First Aid & CPR', expiry: 'Malaysian Red Crescent · Expires 2027' },
      { name: 'Infant Care Specialist', expiry: 'Childcare Academy · Expires 2027' },
    ] : (sitter.certs || []).map(c => ({ name: c.name, expiry: c.expiry }));
    if (profileCertCount) profileCertCount.textContent = `${certificates.length} verified`;
    if (profileCertList) {
      profileCertList.innerHTML = certificates.map(c => `
        <div class="cert-item">
          <span class="cert-check">✓</span>
          <div class="cert-copy"><strong>${c.name}</strong><span>${c.expiry}</span></div>
          <span class="badge badge-verified">✓ Verified</span>
        </div>
      `).join('');
    }
    if (profileReviews) {
      const writtenReviews = state.writtenReviews && state.writtenReviews[sitter.id] || [];
      const reviews = [...sitter.reviews, ...writtenReviews];
      const reviewCards = isSarah ? [
        { initials: 'MT', name: 'Michelle', date: '12 Nov 2026 · 1 child, 10 months', text: 'Sarah was incredible with our 10-month-old daughter. She was punctual, so warm, and sent us photo check-ins throughout our dinner.' },
        { initials: 'KL', name: 'Kevin', date: '8 Nov 2026 · 2 children, 3 years', text: 'Our 3-year-old twins adore Sarah. She reads stories, plays creative games, and follows their bedtime routine.' },
      ] : reviews.map(review => ({
        initials: 'P',
        name: 'Parent',
        date: 'Verified booking',
        text: review.text,
      }));
      profileReviews.innerHTML = reviewCards.length ? reviewCards.map(review => `
        <div class="review-item">
          <div class="review-avatar${review.initials === 'KL' ? ' pink' : ''}">${review.initials}</div>
          <div class="review-content">
            <div class="review-head"><strong>${escapeHtml(review.name)}</strong><span>★★★★★</span></div>
            <span class="review-date">${escapeHtml(review.date)}</span>
            <p class="review-text">"${escapeHtml(review.text)}"</p>
          </div>
        </div>
      `).join('') : '<p class="no-written-reviews">No written reviews yet.</p>';
    }
    if (profileAvailability) {
      profileAvailability.innerHTML = `
        <div class="weekly-head"></div><div class="weekly-head">Mon</div><div class="weekly-head">Tue</div><div class="weekly-head">Wed</div><div class="weekly-head">Thu</div><div class="weekly-head">Fri</div><div class="weekly-head">Sat</div><div class="weekly-head">Sun</div>
        <div class="time-label">Morning</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell unavailable"></div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell unavailable"></div>
        <div class="time-label">Afternoon</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell unavailable"></div>
        <div class="time-label">Evening</div><div class="avail-cell available">✓</div><div class="avail-cell unavailable"></div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell available">✓</div><div class="avail-cell unavailable"></div>
        <div class="time-label">Overnight</div><div class="avail-cell unavailable"></div><div class="avail-cell unavailable"></div><div class="avail-cell unavailable"></div><div class="avail-cell unavailable"></div><div class="avail-cell unavailable"></div><div class="avail-cell available">✓</div><div class="avail-cell unavailable"></div>`;
    }
    const preferences = getPreferencesForSitter(sitter);
    if (profilePreferencesSection && profilePreferencesHeading && profilePreferencesList) {
      profilePreferencesSection.hidden = !preferences.length;
      profilePreferencesHeading.textContent = `How ${sitter.name.split(' ')[0]} fits your preferences`;
      profilePreferencesList.innerHTML = renderPreferenceItems(preferences);
    }
  }

  function prepareReviewForm() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const form = document.getElementById('reviewForm');
    const sitterName = document.getElementById('reviewSitterName');
    const sitterPhoto = document.getElementById('reviewSitterPhoto');
    if (sitterName) sitterName.textContent = sitter.name;
    if (sitterPhoto) sitterPhoto.setAttribute('aria-label', `Photo placeholder for ${sitter.name}`);
    if (form) {
      form.reset();
      form.querySelector('[name="reviewRating"][value="5"]').checked = true;
    }
    updateReviewRatingDisplay();
  }

  const btnWriteReview = document.getElementById('btnWriteReview');
  const reviewForm = document.getElementById('reviewForm');
  const reviewRatingDisplay = document.getElementById('reviewRatingDisplay');
  const reviewRatingInputs = document.querySelectorAll('[name="reviewRating"]');
  function updateReviewRatingDisplay() {
    const selectedRating = Number(document.querySelector('[name="reviewRating"]:checked')?.value || 5);
    if (reviewRatingDisplay) reviewRatingDisplay.textContent = `${selectedRating}.0`;
    document.querySelectorAll('.review-rating-options label').forEach((label, index) => {
      label.classList.toggle('is-filled', index < selectedRating);
    });
  }

  if (btnWriteReview) btnWriteReview.addEventListener('click', () => showScreen('review'));
  reviewRatingInputs.forEach(input => input.addEventListener('change', updateReviewRatingDisplay));
  if (reviewForm) {
    reviewForm.addEventListener('submit', event => {
      event.preventDefault();
      const rating = Number(reviewForm.querySelector('[name="reviewRating"]:checked')?.value || 5);
      const text = document.getElementById('reviewText').value.trim();
      if (!text) return;
      if (!state.writtenReviews) state.writtenReviews = {};
      const reviews = state.writtenReviews[state.selectedSitterId] || [];
      const endorsements = Array.from(reviewForm.querySelectorAll('[name="reviewEndorsements"]:checked'), input => input.value);
      reviews.push({ stars: `${rating}.0`, text, author: state.user.name, endorsements });
      state.writtenReviews[state.selectedSitterId] = reviews;
      saveState();
      showScreen('parentHome');
      showToast('Your review has been submitted.');
    });
  }

  function startBookingFlow(sitterId) {
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.bookingIntent = true;
    state.authReturnScreen = 'booking';
    saveState();

    if (!state.isLoggedIn) {
      setAuthMode('signup');
      showScreen('auth');
    } else if (!state.hasAddedChild) {
      showScreen('addChild');
    } else {
      showScreen('bookingDetails');
    }
  }

  function startProfileBookingFlow(sitterId) {
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.bookingIntent = true;
    state.authReturnScreen = 'booking';
    saveState();
    if (state.isLoggedIn) {
      showScreen('bookingDetails');
    } else {
      setAuthMode('signup');
      showScreen('auth');
    }
  }

  function startMessageFlow(sitterId) {
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.bookingIntent = false;
    state.authReturnScreen = 'chat';
    saveState();

    if (!state.isLoggedIn) {
      setAuthMode('signup');
      showScreen('auth');
    } else {
      showScreen('chat');
    }
  }

  const btnProfileCompare = document.getElementById('btnProfileCompare');
  const btnProfileStickyBook = document.getElementById('btnProfileStickyBook');
  const btnProfileStickyMessage = document.getElementById('btnProfileStickyMessage');
  const btnProfileMobileBook = document.getElementById('btnProfileMobileBook');

  [btnProfileStickyBook, btnProfileMobileBook].forEach(button => {
    if (button) button.addEventListener('click', () => startProfileBookingFlow(state.selectedSitterId));
  });

  if (btnProfileStickyMessage) {
    btnProfileStickyMessage.addEventListener('click', () => {
      startMessageFlow(state.selectedSitterId);
    });
  }

  if (btnProfileCompare) {
    btnProfileCompare.addEventListener('click', () => {
      state.comparedSitters = new Set([
        state.selectedSitterId,
        ...Array.from(state.comparedSitters).filter(id => id !== state.selectedSitterId),
      ].slice(0, 3));
      showScreen('compare');
    });
  }

  // --------------------------------------------------------------------------
  // 10. Screen 6: Compare Babysitters
  // --------------------------------------------------------------------------
  const compareFeatureIcons = {
    rating: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3z"></path>',
    experience: '<rect x="3" y="7" width="18" height="14" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"></path>',
    price: '<path d="M20 13 11 22l-9-9V2h11z"></path><circle cx="7.5" cy="7.5" r="1.5"></circle>',
    certificates: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline>',
    verification: '<circle cx="12" cy="12" r="9"></circle><path d="m8 12 2.5 2.5L16 9"></path><path d="m8.5 3.8 1.4-1.1 2.1 1 2.1-1 1.4 1.1"></path>',
    education: '<path d="m2 10 10-6 10 6-10 6-10-6z"></path><path d="M6 12.5V17c3.5 2.7 8.5 2.7 12 0v-4.5M22 10v6"></path>',
    languages: '<path d="M4 5h12a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 4V5z"></path><path d="M9 10h8M9 13h5"></path><path d="M16 3h4a2 2 0 0 1 2 2v7l-3-2"></path>',
    age: '<circle cx="12" cy="8" r="4"></circle><path d="M4 21a8 8 0 0 1 16 0"></path>',
    availability: '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18M8 14h2M14 14h2M8 17h2"></path>',
    preferences: '<path d="M9 6h11M9 12h11M9 18h11"></path><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"></path>',
  };
  const compareFeatureDefinitions = [
    { id: 'rating', title: 'Rating', score: sitter => sitter.ratingValue, value: sitter => sitter.ratingValue.toFixed(1), detail: sitter => `${sitter.reviewsCount} reviews` },
    { id: 'experience', title: 'Experience', score: sitter => Number.parseInt(sitter.exp, 10) || 0, value: sitter => sitter.exp },
    { id: 'price', title: 'Price', score: sitter => -sitter.price, value: sitter => `RM ${sitter.price} / hr` },
    {
      id: 'certificates',
      title: 'Certificates',
      score: sitter => sitter.certs.length,
      render: sitter => sitter.certs.map(cert => `
        <div class="compare-certificate">
          <span class="check-icon" aria-hidden="true">✓</span>
          <span><strong>${escapeHtml(cert.name)}</strong><small>${escapeHtml(cert.expiry)}</small></span>
        </div>
      `).join(''),
    },
    { id: 'verification', title: 'Verification', value: () => 'Verified', detail: () => 'Certificates' },
    { id: 'education', title: 'Education', value: sitter => sitter.degree, detail: sitter => sitter.school },
    { id: 'languages', title: 'Languages', value: sitter => sitter.languages },
    { id: 'age', title: 'Age', value: sitter => `${sitter.age}`, detail: () => 'years old' },
    {
      id: 'availability',
      title: 'Availability',
      render: sitter => sitter.availability.map(slot => `<span class="compare-detail-line">${escapeHtml(slot.day)}</span>`).join(''),
    },
  ];

  const compareHeaderColumns = document.getElementById('compareHeaderColumns');
  const compareFeatureSections = document.getElementById('compareFeatureSections');
  const compareCompactColumns = document.getElementById('compareCompactColumns');
  const compareExpandedHeader = document.getElementById('compareExpandedHeader');
  const compareCompactBar = document.getElementById('compareCompactBar');
  let compareCompactFrame = 0;

  function updateCompareCompactBar() {
    compareCompactFrame = 0;
    if (!compareExpandedHeader || !compareCompactBar || !screenCompare || screenCompare.style.display === 'none') return;

    const bottom = compareExpandedHeader.getBoundingClientRect().bottom;
    const mobileTopbar = window.matchMedia('(max-width: 640px)').matches;
    const mobileBar = window.matchMedia('(max-width: 767px)').matches;
    const top = mobileTopbar ? 56 : 64;
    const range = mobileBar ? 56 : 64;
    const progress = Math.min(1, Math.max(0, 1 - (bottom - top) / range));
    const showCompactBar = progress > 0.5;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      compareCompactBar.style.opacity = showCompactBar ? '1' : '0';
      compareCompactBar.style.transform = 'none';
    } else {
      compareCompactBar.style.opacity = String(progress);
      compareCompactBar.style.transform = `translateY(${(1 - progress) * -8}px)`;
    }
    compareCompactBar.style.pointerEvents = showCompactBar ? 'auto' : 'none';
    compareCompactBar.setAttribute('aria-hidden', String(!showCompactBar));
  }

  function scheduleCompareCompactBarUpdate() {
    if (!compareCompactFrame) compareCompactFrame = requestAnimationFrame(updateCompareCompactBar);
  }

  window.addEventListener('scroll', scheduleCompareCompactBarUpdate, { passive: true });
  window.addEventListener('resize', scheduleCompareCompactBarUpdate, { passive: true });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', scheduleCompareCompactBarUpdate);

  function populateCompareTable() {
    const selectedIds = Array.from(state.comparedSitters).filter(id => sittersData[id]).slice(0, 3);
    const getSitterPreferenceCount = id => getPreferencesForSitter(sittersData[id]).filter(preference => preference.met).length;
    const getSitterDistance = id => calculateDistanceKm(state.postcode, sittersData[id].postcode) ?? Number.POSITIVE_INFINITY;
    const preferredIds = [
      state.selectedSitterId,
      ...Object.keys(sittersData).sort((a, b) =>
        getSitterPreferenceCount(b) - getSitterPreferenceCount(a) ||
        getSitterDistance(a) - getSitterDistance(b)
      ),
    ].filter(id => sittersData[id]);
    const sitterIds = [...new Set([...selectedIds, ...preferredIds])].slice(0, Math.max(2, selectedIds.length));
    const sitterSlots = [...sitterIds.map(id => sittersData[id]), null, null].slice(0, 3);
    if (!compareHeaderColumns || !compareFeatureSections || !compareCompactColumns) return;

    state.comparedSitters = new Set(sitterIds);

    compareHeaderColumns.dataset.sitterCount = String(sitterSlots.filter(Boolean).length);
    compareCompactColumns.dataset.sitterCount = String(sitterSlots.filter(Boolean).length);
    compareHeaderColumns.innerHTML = sitterSlots.map((sitter, slot) => {
      const options = Object.values(sittersData).map(option => {
        const selectedElsewhere = sitterSlots.some((other, otherSlot) => otherSlot !== slot && other && other.id === option.id);
        return `<option value="${option.id}"${sitter && sitter.id === option.id ? ' selected' : ''}${selectedElsewhere ? ' disabled' : ''}>${escapeHtml(option.name)}</option>`;
      }).join('');
      const emptyOption = `<option value=""${slot < 2 ? ' disabled' : ''}${sitter ? '' : ' selected'}>Choose a babysitter</option>`;
      const selector = `
        <div class="compare-selector-wrap">
          <label class="sr-only" for="compareSitterSelect${slot}">Babysitter ${slot + 1}</label>
          <select class="compare-sitter-select" id="compareSitterSelect${slot}" data-slot="${slot}" aria-label="Babysitter ${slot + 1}">
            ${emptyOption}${options}
          </select>
          <svg class="compare-select-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B2A35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>`;
      if (!sitter) {
        return `<article class="compare-sitter-column">${selector}
          <button type="button" class="compare-add-placeholder" id="btnAddCompareSitter">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
            <span>Add a babysitter</span>
          </button>
        </article>`;
      }

      return `<article class="compare-sitter-column">${selector}
        <div class="compare-sitter-details">
          <div class="compare-header-identity" aria-label="${escapeHtml(sitter.name)}">
            <div class="photo-placeholder compare-header-photo" role="img" aria-label="Photo placeholder for ${escapeHtml(sitter.name)}">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>
          <div class="compare-header-extras">
            <span class="badge badge-ease-trained compare-trained-badge">
              <svg class="badge-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
              Ease Trained
            </span>
            <p class="compare-header-price">${escapeHtml(sitter.rateText)} / hr</p>
            <div class="preference-summary-slot">${renderPreferenceSummary(sitter)}</div>
            <div class="compare-header-actions">
              <button type="button" class="btn btn-primary compare-book-button" data-sitter-id="${sitter.id}" aria-label="Book ${escapeHtml(sitter.name)}">Book</button>
              <button type="button" class="compare-view-profile" data-sitter-id="${sitter.id}">
                View profile
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
      </article>`;
    }).join('');

    compareCompactColumns.innerHTML = sitterSlots.map(sitter => sitter
      ? `<div class="compare-compact-cell" aria-label="${escapeHtml(sitter.name)}">
          <div class="photo-placeholder compare-compact-photo" role="img" aria-label="Photo placeholder for ${escapeHtml(sitter.name)}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          </div>
          <span class="compare-compact-name" aria-label="${escapeHtml(sitter.name)}"><span class="compare-compact-full-name">${escapeHtml(sitter.name)}</span><span class="compare-compact-first-name">${escapeHtml(sitter.name.split(' ')[0])}</span></span>
        </div>`
      : '<div class="compare-compact-cell compare-compact-add">+ Add</div>').join('');

    const comparePreferences = sitterSlots.some(sitter => sitter && getPreferencesForSitter(sitter).length);
    const activeCompareFeatures = comparePreferences
      ? [...compareFeatureDefinitions, {
        id: 'preferences',
        title: 'Preferences',
        render: sitter => {
          const preferences = getPreferencesForSitter(sitter);
          return `<div class="compare-preferences-block">
            <h3>How ${escapeHtml(sitter.name.split(' ')[0])} fits your preferences</h3>
            ${renderPreferenceItems(preferences)}
          </div>`;
        },
      }]
      : compareFeatureDefinitions;
    compareFeatureSections.innerHTML = activeCompareFeatures.map(feature => {
      const scores = feature.score ? sitterSlots.filter(Boolean).map(feature.score) : [];
      const bestScore = scores.length ? Math.max(...scores) : null;
      const uniqueBest = feature.score && scores.filter(score => score === bestScore).length === 1;
      const values = sitterSlots.map(sitter => {
        if (!sitter) return '<div class="compare-empty-value" aria-label="No babysitter selected">—</div>';
        const value = feature.render ? feature.render(sitter) : escapeHtml(feature.value(sitter));
        const score = feature.score ? feature.score(sitter) : null;
        const isBest = uniqueBest && score === bestScore;
        const valueMarkup = isBest
          ? `<span class="compare-best-value"><span class="compare-best-check" aria-hidden="true">✓</span><span>${value}</span><small>Best</small></span>`
          : value;
        const detail = feature.detail ? `<p class="compare-value-detail">${escapeHtml(feature.detail(sitter))}</p>` : '';
        return `<div class="compare-value-column"><div class="compare-value-main">${valueMarkup}</div>${detail}</div>`;
      }).join('');
      return `<section class="compare-feature-section" aria-labelledby="compareFeatureTitle-${feature.id}">
        <div class="compare-feature-heading">
          <svg class="compare-feature-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${compareFeatureIcons[feature.id]}</svg>
          <h2 id="compareFeatureTitle-${feature.id}">${feature.title}</h2>
        </div>
        <div class="compare-feature-values">${values}</div>
      </section>`;
    }).join('');

    requestAnimationFrame(() => {
      scheduleCompareCompactBarUpdate();
    });
  }

  if (compareHeaderColumns) {
    compareHeaderColumns.addEventListener('change', event => {
      if (!(event.target instanceof HTMLSelectElement) || !event.target.matches('.compare-sitter-select')) return;
      const slot = Number(event.target.dataset.slot);
      const currentIds = [...state.comparedSitters];
      const slots = [...currentIds, null, null].slice(0, 3);
      const newId = event.target.value;
      if (slot < 2 && !newId) {
        populateCompareTable();
        return;
      }
      if (newId && slots.some((id, index) => index !== slot && id === newId)) {
        populateCompareTable();
        return;
      }
      slots[slot] = newId || null;
      state.comparedSitters = new Set(slots.filter(Boolean));
      saveState();
      populateCompareTable();
    });

    compareHeaderColumns.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const addButton = event.target.closest('#btnAddCompareSitter');
      if (addButton) {
        const currentIds = Array.from(state.comparedSitters).filter(id => sittersData[id]);
        if (currentIds.length >= 3) return;
        const nextId = Object.keys(sittersData).find(id => !currentIds.includes(id));
        if (!nextId) return;
        state.comparedSitters = new Set([...currentIds, nextId]);
        populateCompareTable();
        saveState();
        return;
      }

      const profileButton = event.target.closest('.compare-view-profile');
      if (profileButton) {
        state.selectedSitterId = profileButton.dataset.sitterId;
        showScreen('profile');
        return;
      }

      const bookButton = event.target.closest('.compare-book-button');
      if (bookButton) startProfileBookingFlow(bookButton.dataset.sitterId);
    });
  }

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
        if (!/^(?:\+?60|0)[0-9\s-]{8,12}$/.test(phoneVal)) {
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
        saveState();
        showScreen('verify');
      } else {
        state.user.email = emailVal;
        setLoggedIn(true);
        saveState();
        if (state.authReturnScreen === 'parentHome') {
          showScreen('parentHome');
        } else if (state.authReturnScreen === 'review') {
          showScreen('review');
        } else if (state.bookingIntent) {
          showScreen(state.hasAddedChild ? 'bookingDetails' : 'addChild');
        } else {
          showScreen('chat');
        }
      }
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
      setLoggedIn(true);
      saveState();
      showToast('Email verified successfully!');

      if (state.authReturnScreen === 'parentHome') {
        showScreen('parentHome');
      } else if (state.authReturnScreen === 'review') {
        showScreen('review');
      } else if (state.bookingIntent && !state.hasAddedChild) {
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

  function readChildForm() {
    return {
      name: document.getElementById('childName').value.trim(),
      gender: document.getElementById('childGender').value,
      birthDate: document.getElementById('childBirthDate').value,
      allergies: document.getElementById('childAllergies').value.trim() || 'None',
      medical: document.getElementById('childMedical').value.trim() || 'None',
      specialNeeds: document.getElementById('childSpecialNeeds').value.trim() || 'None',
      routine: document.getElementById('childRoutine').value.trim() || 'Standard routine',
      emergencyName: document.getElementById('childEmergencyName').value.trim(),
      emergencyPhone: document.getElementById('childEmergencyPhone').value.trim(),
      description: document.getElementById('childDescription').value.trim(),
    };
  }

  function clearChildForm() {
    addChildForm.reset();
    ['childName', 'childBirthDate', 'childEmergencyName', 'childEmergencyPhone'].forEach(id => {
      document.getElementById(id).value = '';
    });
    ['childAllergies', 'childMedical', 'childSpecialNeeds', 'childRoutine'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('childDescription').value = '';
    if (state.children.length) {
      ['childName', 'childBirthDate', 'childEmergencyName', 'childEmergencyPhone'].forEach(id => {
        document.getElementById(id).required = false;
      });
    }
  }

  function prepareAddChildForm() {
    if (state.hasAddedChild || state.children.length) clearChildForm();
  }

  ['childName', 'childBirthDate', 'childEmergencyName', 'childEmergencyPhone'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      if (state.children.length) {
        ['childName', 'childBirthDate', 'childEmergencyName', 'childEmergencyPhone'].forEach(fieldId => {
          document.getElementById(fieldId).required = true;
        });
      }
    });
  });

  if (btnAddAnotherChild) {
    btnAddAnotherChild.addEventListener('click', () => {
      if (!document.getElementById('childName').value.trim()) {
        document.getElementById('childName').required = true;
        addChildForm.reportValidity();
        return;
      }
      if (!addChildForm.checkValidity()) {
        addChildForm.reportValidity();
        return;
      }
      const child = readChildForm();
      state.children.push(child);
      saveState();
      showToast(`Child "${child.name}" saved. Add another child or continue.`);
      clearChildForm();
      document.getElementById('childName').focus();
    });
  }

  if (addChildForm) {
    addChildForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currentName = document.getElementById('childName').value.trim();
      if ((currentName || !state.children.length) && !addChildForm.checkValidity()) {
        addChildForm.reportValidity();
        return;
      }
      if (currentName) state.children.push(readChildForm());
      state.child = state.children[0];

      state.hasAddedChild = true;
      saveState();
      showToast('Child profile saved!');

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
  function setupBookingDetails() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];

    const bookingSitterTitle = document.getElementById('bookingSitterTitle');
    const bookingSitterRate = document.getElementById('bookingSitterRate');
    const bookingChildSelect = document.getElementById('bookingChildSelect');
    const bookingLocationInput = document.getElementById('bookingLocationInput');

    if (bookingSitterTitle) bookingSitterTitle.textContent = sitter.name;
    if (bookingSitterRate) bookingSitterRate.textContent = `${sitter.rateText} / hr • Ease Trained`;
    if (bookingLocationInput) bookingLocationInput.value = state.bookingData.location || `${state.postcode} Kuala Lumpur`;

    if (bookingChildSelect) {
      const children = state.children.length ? state.children : [state.child];
      bookingChildSelect.innerHTML = children.map(child => `
        <option value="${escapeHtml(child.name)}">${escapeHtml(child.name)} (${getChildAge(child.birthDate)} years old)</option>
      `).join('');
      bookingChildSelect.value = state.bookingData.childName || children[0].name;
    }
    document.getElementById('bookingDateInput').value = state.bookingData.date || '2026-11-20';
    document.getElementById('bookingTimeStart').value = state.bookingData.time || '14:00';
    document.getElementById('bookingHours').value = String(state.bookingData.hours || 4);
    document.getElementById('bookingSpecialReq').value = state.bookingData.specialReq || '';
    document.getElementById('bookingExtraNotes').value = state.bookingData.extraNotes || '';
    document.getElementById('bookingTrialOption').checked = Boolean(state.bookingData.isTrial);

    recalcBookingPrice();
  }

  function getChildAge(birthDate) {
    if (!birthDate) return 2;
    const birth = new Date(`${birthDate}T00:00:00`);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
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

      state.bookingData.date = document.getElementById('bookingDateInput').value || '2026-11-20';
      state.bookingData.time = document.getElementById('bookingTimeStart').value || '14:00';
      state.bookingData.childName = document.getElementById('bookingChildSelect').value;
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
    const waitingDescription = document.querySelector('#statusStateWaiting .section-subtext');

    if (sitterNameWaiting) sitterNameWaiting.textContent = sitter.name;
    if (waitingDescription) waitingDescription.innerHTML = `Waiting for <strong id="statusSitterNameWaiting">${escapeHtml(sitter.name)}</strong> to accept your booking for ${escapeHtml(formatBookingDate(state.bookingData.date))}.`;
    if (statusAcceptedHeadline) statusAcceptedHeadline.textContent = `${sitter.name.split(' ')[0]} accepted.`;

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
    paymentOptions.forEach(card => {
      const selected = card.getAttribute('data-pay-method') === state.selectedPaymentMethod;
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-checked', String(selected));
    });

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
    const booking = state.bookingData;
    const confirmedMessage = document.getElementById('confirmedMessage');
    const confirmedDate = document.getElementById('confirmedDate');
    const confirmedTime = document.getElementById('confirmedTime');
    const confirmedChild = document.getElementById('confirmedChild');
    const confirmedBookingId = document.getElementById('confirmedBookingId');
    if (confirmedSitterName) confirmedSitterName.textContent = sitter.name;
    if (confirmedMessage) confirmedMessage.textContent = `Your babysitter is locked in. We've notified ${sitter.name}.`;
    if (confirmedDate) confirmedDate.textContent = formatBookingDate(booking.date);
    if (confirmedTime) confirmedTime.textContent = formatBookingTime(booking.time, booking.hours + (booking.isTrial ? 1 : 0));
    if (confirmedChild) confirmedChild.textContent = booking.childName || state.child.name;
    if (confirmedBookingId) confirmedBookingId.textContent = 'BK001';
  }

  function formatBookingDate(dateValue) {
    if (!dateValue) return '20 Nov 2026';
    const date = new Date(`${dateValue}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatBookingTime(timeValue, duration) {
    const [hours, minutes] = (timeValue || '14:00').split(':').map(Number);
    const start = new Date(2000, 0, 1, hours, minutes);
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${start.toLocaleTimeString('en-US', options).toUpperCase()} – ${end.toLocaleTimeString('en-US', options).toUpperCase()} (${duration} hours)`;
  }

  const btnAddCalendar = document.getElementById('btnAddCalendar');
  const btnGoHome = document.getElementById('btnGoHome');

  if (btnAddCalendar) {
    btnAddCalendar.addEventListener('click', () => {
      const booking = state.bookingData;
      const date = booking.date || '2026-11-20';
      const time = booking.time || '14:00';
      const [hour, minute] = time.split(':');
      const start = `${date.replace(/-/g, '')}T${hour}${minute}00`;
      const endDate = new Date(`${date}T${time}:00`);
      endDate.setHours(endDate.getHours() + booking.hours + (booking.isTrial ? 1 : 0));
      const end = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, '0')}${String(endDate.getDate()).padStart(2, '0')}T${String(endDate.getHours()).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`;
      const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
      const calendarEvent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Ease//Booking//EN',
        'BEGIN:VEVENT',
        `UID:${Date.now()}@ease.local`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:Ease babysitting with ${sitter.name}`,
        `LOCATION:${(booking.location || '').replace(/[,;\\]/g, ' ')}`,
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\r\n');
      const calendarUrl = URL.createObjectURL(new Blob([calendarEvent], { type: 'text/calendar' }));
      const downloadLink = document.createElement('a');
      downloadLink.href = calendarUrl;
      downloadLink.download = 'ease-booking.ics';
      downloadLink.click();
      setTimeout(() => URL.revokeObjectURL(calendarUrl), 1000);
      showToast('Calendar event downloaded.');
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
    const homeChildDetails = document.getElementById('homeChildDetails');
    const homeChildSummary = document.getElementById('homeChildSummary');
    const homeBookingDate = document.getElementById('homeBookingDate');
    const homeBookingSitter = document.getElementById('homeBookingSitter');
    const homeBookingTime = document.getElementById('homeBookingTime');
    const homeBookingLocation = document.getElementById('homeBookingLocation');
    const homeRecentMsgName = document.getElementById('homeRecentMsgName');
    const homeBookAgainName = document.getElementById('homeBookAgainName');
    const bookingSitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const booking = state.bookingData;

    document.querySelectorAll('[data-preference-sitter]').forEach(slot => {
      const sitter = sittersData[slot.dataset.preferenceSitter];
      if (sitter) slot.innerHTML = renderPreferenceSummary(sitter);
    });

    const firstName = (state.user.name || 'Jessica').split(' ')[0];
    if (greeting) greeting.textContent = `Welcome back, ${firstName}`;
    if (homeChildName) homeChildName.textContent = state.child.name || 'Liam';
    if (homeChildDetails) homeChildDetails.textContent = `${getChildAge(state.child.birthDate)} years old • ${state.child.gender || 'Boy'}`;
    if (homeChildSummary) {
      homeChildSummary.textContent = `Allergies: ${state.child.allergies || 'None'} • Routine: ${state.child.routine || 'Standard routine'} • Emergency Contact: ${state.child.emergencyName || 'Not added'}`;
    }
    if (homeBookingDate) homeBookingDate.textContent = `Next Booking • ${formatBookingDate(booking.date)}`;
    if (homeBookingSitter) homeBookingSitter.textContent = bookingSitter.name;
    if (homeBookingTime) homeBookingTime.textContent = `${formatBookingTime(booking.time, booking.hours)} • ${booking.childName || state.child.name}`;
    if (homeBookingLocation) homeBookingLocation.textContent = `📍 ${booking.location || `${state.postcode} Kuala Lumpur`}`;
    if (btnHomeMessageSarah) btnHomeMessageSarah.textContent = `Message ${bookingSitter.name.split(' ')[0]}`;
    if (homeRecentMsgName) homeRecentMsgName.textContent = bookingSitter.name;
    if (homeBookAgainName) homeBookAgainName.textContent = bookingSitter.name;
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
      state.bookingIntent = false;
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
    const chatSitterAvatar = document.getElementById('chatSitterAvatar');
    const chatMessagesArea = document.getElementById('chatMessagesArea');

    if (chatSitterName) chatSitterName.textContent = sitter.name;
    if (chatSitterAvatar) chatSitterAvatar.setAttribute('aria-label', `Photo placeholder for ${sitter.name}`);
    if (chatMessagesArea) {
      chatMessagesArea.innerHTML = `
        <div class="chat-message chat-msg-parent"><p>Hello! Is Saturday free?</p><span class="chat-time">10:15 AM</span></div>
        <div class="chat-message chat-msg-sitter"><p>Yes, I am free all day.</p><span class="chat-time">10:18 AM</span></div>
        <div class="chat-message chat-msg-parent"><p>Great, can you do 9 am to 3 pm?</p><span class="chat-time">10:20 AM</span></div>
      `;
    }
    if (chatMessagesArea) chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
  }

  const btnChatBook = document.getElementById('btnChatBook');
  const chatForm = document.getElementById('chatForm');
  const chatInputText = document.getElementById('chatInputText');
  const chatMessagesArea = document.getElementById('chatMessagesArea');

  if (btnChatBook) {
    btnChatBook.addEventListener('click', () => {
      startProfileBookingFlow(state.selectedSitterId);
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
