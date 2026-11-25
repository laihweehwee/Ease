// Ease Babysitter - Comprehensive Application Logic (Phase 1 & Phase 2)
import { babysittersData as sittersData, careTypeLabels, getMatchingSitters, postcodeLocations } from './data/babysitters.js';

document.addEventListener('DOMContentLoaded', () => {
  const defaultBookingDate = new Date();
  defaultBookingDate.setDate(defaultBookingDate.getDate() + 1);
  const defaultBookingDateValue = [
    defaultBookingDate.getFullYear(),
    String(defaultBookingDate.getMonth() + 1).padStart(2, '0'),
    String(defaultBookingDate.getDate()).padStart(2, '0'),
  ].join('-');

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
    compareSelectionCustom: false,

    // User & Auth state
    isLoggedIn: false,
    writtenReviews: {},
    authReturnScreen: 'booking',
    user: {
      name: '',
      email: 'jessica@example.com',
      phone: '',
      dob: '1992-08-14',
      numChildren: 1,
      role: 'parent',         // 'parent' | 'babysitter'
      hourlyRate: 25,         // babysitter only
      experience: '3-5',      // babysitter only
      specialties: [],        // babysitter only
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
    activeBookingId: null,
    bookingIntent: true, // true if booking, false if messaging
    bookingData: {
      childName: 'Liam',
      date: '2026-11-20',
      time: '14:00',
      hours: 4,
      location: 'Bangsar, Kuala Lumpur',
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

  const sampleJobDateLabel = defaultBookingDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
  let savedJobStatuses = {};
  try {
    savedJobStatuses = JSON.parse(localStorage.getItem('ease_sitter_job_statuses') || '{}');
  } catch (error) {
    console.warn('Could not load sitter job statuses', error);
  }
  const sampleJobRequests = [
    {
      id: 'job-001',
      parent: 'Jessica Roberts',
      area: 'Bangsar, Kuala Lumpur',
      childrenCount: '1 child',
      childAges: '2 years old',
      date: sampleJobDateLabel,
      dateKey: defaultBookingDateValue,
      time: '9:00 AM – 1:00 PM',
      startTime: '09:00 AM',
      endTime: '01:00 PM',
      location: 'Bangsar, Kuala Lumpur',
      tasks: 'Prepare snacks, playtime, and follow the nap routine.',
      specialNeeds: 'No special needs noted.',
      pay: 25,
      status: savedJobStatuses['job-001'] || 'available',
    },
    {
      id: 'job-002',
      parent: 'Amir’s family',
      area: 'Mont Kiara, Kuala Lumpur',
      childrenCount: '2 children',
      childAges: '3 and 6 years old',
      date: sampleJobDateLabel,
      dateKey: defaultBookingDateValue,
      time: '11:00 AM – 3:00 PM',
      startTime: '11:00 AM',
      endTime: '03:00 PM',
      location: 'Mont Kiara, Kuala Lumpur',
      tasks: 'Prepare a light meal, supervise play, and help with reading.',
      specialNeeds: 'No special needs noted.',
      pay: 28,
      status: savedJobStatuses['job-002'] || 'available',
    },
  ];
  let selectedJobRequestId = null;

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
  ensureChildIds(state.children);

  const bookingStatuses = ['waiting', 'accepted', 'paid', 'confirmed', 'in_progress', 'completed', 'declined', 'cancelled'];
  let activeBookingsTab = 'upcoming';
  let bookings = [];
  try {
    const savedBookings = localStorage.getItem('easeBookings');
    if (savedBookings === null) {
      localStorage.setItem('easeBookings', '[]');
    } else {
      const parsedBookings = JSON.parse(savedBookings);
      if (Array.isArray(parsedBookings)) {
        bookings = parsedBookings.filter(booking =>
          booking &&
          typeof booking.id === 'string' &&
          typeof booking.babysitterName === 'string' &&
          typeof booking.date === 'string' &&
          typeof booking.startTime === 'string' &&
          typeof booking.endTime === 'string' &&
          typeof booking.location === 'string' &&
          typeof booking.price === 'number' &&
          typeof booking.child === 'string' &&
          bookingStatuses.includes(booking.status)
        );
      } else {
        console.warn('Could not load bookings: stored value is not a list');
      }
    }
  } catch (e) {
    console.warn('Could not load bookings', e);
  }

  function saveBookings() {
    try {
      localStorage.setItem('easeBookings', JSON.stringify(bookings));
    } catch (e) {
      console.warn('Could not save bookings', e);
    }
  }

  function getTodayDateValue() {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  }

  function getSearchPostcode() {
    try {
      const postcode = sessionStorage.getItem('searchPostcode') || '';
      return /^\d{5}$/.test(postcode) ? postcode : '';
    } catch (e) {
      console.warn('Could not load search postcode', e);
      return '';
    }
  }

  function saveSearchPostcode(postcode) {
    try {
      sessionStorage.setItem('searchPostcode', postcode);
    } catch (e) {
      console.warn('Could not save search postcode', e);
    }
  }

  function getSearchCareType() {
    try {
      const careType = sessionStorage.getItem('findCareType');
      return careType === null || careType === '' || careTypeLabels.includes(careType)
        ? careType
        : null;
    } catch (e) {
      console.warn('Could not load Find care type', e);
      return null;
    }
  }

  function saveSearchCareType(careType) {
    try {
      sessionStorage.setItem('findCareType', careType);
    } catch (e) {
      console.warn('Could not save Find care type', e);
    }
  }

  function getRequestedAvailabilityFilter() {
    if (!state.answeredPreferences.availability) return null;
    if ((state.when === 'Pick a date' || state.when === 'Custom date') && !state.customDate) return null;
    return {
      when: state.when,
      customDate: state.customDate,
      time: state.bookingData && state.bookingData.time,
    };
  }

  function readEaseFilters() {
    try {
      const saved = localStorage.getItem('easeFilters');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
      return {
        postcode: /^\d{5}$/.test(String(parsed.postcode || '')) ? String(parsed.postcode) : '',
        minRating: Number.isFinite(Number(parsed.minRating)) ? Math.max(0, Number(parsed.minRating)) : 0,
        maxPrice: Number.isFinite(Number(parsed.maxPrice)) ? Math.max(0, Number(parsed.maxPrice)) : 0,
        maxDistance: Number.isFinite(Number(parsed.maxDistance)) ? Math.max(0, Number(parsed.maxDistance)) : 0,
        careType: careTypeLabels.includes(parsed.careType) ? parsed.careType : '',
        availability: typeof parsed.availability === 'string' ||
          (parsed.availability && typeof parsed.availability === 'object')
          ? parsed.availability
          : null,
      };
    } catch (e) {
      console.warn('Could not load Ease filters', e);
      return null;
    }
  }

  function writeEaseFilters(filters) {
    try {
      localStorage.setItem('easeFilters', JSON.stringify(filters));
    } catch (e) {
      console.warn('Could not save Ease filters', e);
    }
  }

  function getDateValueOffset(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
  }

  function generateBookingId() {
    const highestId = bookings.reduce((highest, booking) => {
      const match = /^BK(\d+)$/.exec(booking.id);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    return `BK${String(highestId + 1).padStart(3, '0')}`;
  }

  function getUpcomingBookings() {
    const today = getTodayDateValue();
    return bookings
      .filter(booking =>
        ['waiting', 'accepted', 'paid', 'confirmed', 'in_progress'].includes(booking.status) &&
        booking.date >= today
      )
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }

  function getPastBookings() {
    return bookings
      .filter(booking => ['completed', 'cancelled', 'declined'].includes(booking.status))
      .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }

  function getActiveBooking() {
    return bookings.find(booking => booking.id === state.activeBookingId) || null;
  }

  function getLatestBooking() {
    return bookings.length ? bookings[bookings.length - 1] : null;
  }

  function syncBookingToState(booking) {
    if (!booking) return;
    state.activeBookingId = booking.id;
    if (booking.babysitterId && sittersData[booking.babysitterId]) {
      state.selectedSitterId = booking.babysitterId;
    }
    state.bookingData = {
      ...state.bookingData,
      date: booking.date,
      time: booking.startTime,
      hours: booking.baseHours || booking.hours || 4,
      isTrial: Boolean(booking.isTrial),
      rate: booking.rate || state.bookingData.rate,
      subtotal: booking.subtotal || booking.price,
      fee: booking.fee || 0,
      total: booking.price,
      location: booking.location,
      childName: booking.child,
    };
    state.bookingStatusState = ['waiting', 'accepted', 'declined'].includes(booking.status)
      ? booking.status
      : 'declined';
  }

  function updateActiveBookingStatus(status) {
    const booking = getActiveBooking();
    if (!booking || !bookingStatuses.includes(status)) return;
    booking.status = status;
    saveBookings();
  }

  function loadSampleBookings() {
    if (!demoModeEnabled) return;
    const upcomingSitter = sittersData['sarah-lim'];
    const pastSitter = sittersData['nur-ain'];
    bookings = [
      {
        id: 'BK001',
        babysitterId: 'sarah-lim',
        babysitterName: upcomingSitter.name,
        date: getDateValueOffset(7),
        startTime: '14:00',
        endTime: '18:00',
        location: '50450 Kuala Lumpur',
        price: 105,
        child: 'Liam',
        status: 'confirmed',
        baseHours: 4,
        hours: 4,
        rate: 25,
        subtotal: 100,
        fee: 5,
        isTrial: false,
        isDemo: true,
      },
      {
        id: 'BK002',
        babysitterId: 'nur-ain',
        babysitterName: pastSitter ? pastSitter.name : 'Nur Ain',
        date: getDateValueOffset(-7),
        startTime: '09:00',
        endTime: '12:00',
        location: '50450 Kuala Lumpur',
        price: 71,
        child: 'Liam',
        status: 'completed',
        baseHours: 3,
        hours: 3,
        rate: 22,
        subtotal: 66,
        fee: 5,
        isTrial: false,
        isDemo: true,
      },
    ];
    state.activeBookingId = 'BK001';
    syncBookingToState(bookings[0]);
    saveBookings();
    saveState();
    renderBookingsPage();
  }

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

  function getListedPreferences(preferences) {
    return preferences.filter(preference => preference.key !== 'distance');
  }

  function renderPreferenceItems(preferences, className = 'preferences-full-list') {
    const listedPreferences = getListedPreferences(preferences);
    if (!listedPreferences.length) return '';
    return `<ul class="${className}">${listedPreferences.map(preference => `
      <li class="${preference.met ? 'is-met' : 'is-unmet'}">
        <span class="preference-item-icon" aria-hidden="true">${preference.met ? '✓' : '—'}</span>
        <span>${escapeHtml(preference.text)}</span>
      </li>
    `).join('')}</ul>`;
  }

  function renderCareTypeChips(sitter) {
    return careTypeLabels
      .filter(careType => (sitter.careTypes || []).includes(careType))
      .map(careType => `<span class="care-type-chip">${escapeHtml(careType)}</span>`)
      .join('');
  }

  function renderPreferenceCardList(preferences) {
    const listedPreferences = getListedPreferences(preferences);
    if (!listedPreferences.length) return '';
    const preview = listedPreferences.filter(preference => preference.met).slice(0, 3);
    const hasMore = listedPreferences.length > preview.length;
    return `
      <div class="preference-card-list">
        ${renderPreferenceItems(preview, 'preferences-preview-list')}
        ${hasMore ? `
          <div class="preferences-expanded-list" hidden>${renderPreferenceItems(listedPreferences)}</div>
          <button type="button" class="preferences-expand-link" aria-expanded="false">See all ${listedPreferences.length} ${listedPreferences.length === 1 ? 'preference' : 'preferences'}</button>
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

  state.user = state.user || {};
  state.user.email = state.user.email || 'jessica@example.com';
  state.user.dob = state.user.dob || '1992-08-14';
  state.user.role = state.user.role || 'parent';
  state.user.hourlyRate = state.user.hourlyRate || 25;
  state.user.experience = state.user.experience || '3-5';
  state.user.specialties = state.user.specialties || [];
  state.user.numChildren = state.children.length;

  function createChildId() {
    let id;
    do {
      id = `child_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    } while (state.children.some(child => child && child.id === id));
    return id;
  }

  function ensureChildIds(children) {
    const ids = new Set();
    children.forEach(child => {
      if (!child || typeof child !== 'object') return;
      if (typeof child.id !== 'string' || !child.id.trim() || ids.has(child.id)) {
        child.id = createChildId();
      }
      ids.add(child.id);
    });
  }

  function syncChildCount() {
    state.user.numChildren = state.children.length;
    const numChildrenInput = document.getElementById('parentProfileNumChildren');
    if (numChildrenInput) numChildrenInput.value = String(state.children.length);
  }

  function saveState() {
    try {
      ensureChildIds(state.children);
      syncChildCount();
      state.hasAddedChild = state.children.length > 0;
      if (state.children && state.children.length > 0) {
        state.child = state.children[0];
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
    bookings: document.getElementById('screenBookings'),
    parentProfile: document.getElementById('screenParentProfile'),
    addChild: document.getElementById('screenAddChild'),
    bookingDetails: document.getElementById('screenBookingDetails'),
    bookingStatus: document.getElementById('screenBookingStatus'),
    payment: document.getElementById('screenPayment'),
    bookingConfirmed: document.getElementById('screenBookingConfirmed'),
    reschedule: document.getElementById('screenReschedule'),
    parentHome: document.getElementById('screenParentHome'),
    myChildren: document.getElementById('screenMyChildren'),
    babysitterHome: document.getElementById('screenBabysitterHome'),
    availableJobs: document.getElementById('screenAvailableJobs'),
    requestDetail: document.getElementById('screenRequestDetail'),
    parentProfile: document.getElementById('screenParentProfile'),
    chat: document.getElementById('screenChat'),
    ...(window.easeAdditionalScreens || {}),
  };
  const combinedPaymentCard = document.querySelector('#screenPayment .payment-card');
  const acceptedStatusPanel = document.getElementById('statusStateAccepted');
  if (combinedPaymentCard && acceptedStatusPanel) acceptedStatusPanel.appendChild(combinedPaymentCard);

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const prototypeNav = document.getElementById('prototypeNav');
  const prototypePageBanner = document.getElementById('prototypePageBanner');
  const prototypePageTitle = document.getElementById('prototypePageTitle');
  const prototypeScreens = ['bookingDetails', 'bookingStatus', 'payment', 'bookingConfirmed', 'reschedule', 'parentHome', 'matches'];
  const prototypeScreenTitles = {
    bookingDetails: 'Booking Details',
    bookingStatus: 'Booking Status',
    payment: 'Payment',
    bookingConfirmed: "You're all set!",
    reschedule: 'Reschedule / Cancel',
    parentHome: 'Parent Home',
    matches: 'Top Matches',
  };
  const navDrawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const drawerMenu = document.getElementById('drawerMenu');
  const drawerPanels = document.getElementById('drawerPanels');
  const drawerMemberLinks = document.getElementById('drawerMemberLinks');
  const drawerMenuDivider = document.getElementById('drawerMenuDivider');
  const drawerAboutLabel = document.getElementById('drawerAboutLabel');
  const drawerFindItem = document.querySelector('#drawerMenu [data-drawer-route="find"]');
  const drawerBookingsItem = document.getElementById('drawerBookingsItem');
  const drawerBookingsCount = document.getElementById('drawerBookingsCount');
  const drawerMessagesItem = document.getElementById('drawerMessagesItem');
  const drawerProfileItem = document.getElementById('drawerProfileItem');
  const drawerChildrenItem = document.getElementById('drawerChildrenItem');
  const drawerLogoutBtn = document.getElementById('drawerLogoutBtn');
  const bookingDemoActions = document.getElementById('bookingDemoActions');
  const demoControls = document.querySelector('.demo-controls-box');
  const demoModeBadge = document.getElementById('demoModeBadge');
  const demoModeStorageKey = 'ease_demo_mode';
  const demoModeFromUrl = new URLSearchParams(window.location.search).get('demo') === '1';
  let demoModeEnabled = demoModeFromUrl;

  try {
    demoModeEnabled = demoModeFromUrl || sessionStorage.getItem(demoModeStorageKey) === 'true';
    sessionStorage.setItem(demoModeStorageKey, String(demoModeEnabled));
  } catch (e) {
    console.warn('Could not load demo mode state', e);
  }

  function updateDemoModeUI() {
    if (!demoModeEnabled && bookings.some(booking => booking.isDemo)) {
      const activeBookingWasDemo = bookings.some(booking => booking.id === state.activeBookingId && booking.isDemo);
      bookings = bookings.filter(booking => !booking.isDemo);
      if (activeBookingWasDemo) {
        state.activeBookingId = null;
        saveState();
      }
      saveBookings();
    }
    if (demoControls) demoControls.hidden = false;
    if (demoModeBadge) demoModeBadge.hidden = !demoModeEnabled;
    const sampleButton = document.getElementById('btnLoadSampleBookings');
    if (demoModeEnabled && bookingDemoActions && !sampleButton) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-secondary';
      button.id = 'btnLoadSampleBookings';
      button.textContent = 'Load sample bookings';
      button.addEventListener('click', loadSampleBookings);
      bookingDemoActions.appendChild(button);
    } else if (!demoModeEnabled && sampleButton) {
      sampleButton.remove();
    }
  }

  function setDemoMode(enabled) {
    demoModeEnabled = enabled;
    try {
      sessionStorage.setItem(demoModeStorageKey, String(demoModeEnabled));
    } catch (e) {
      console.warn('Could not save demo mode state', e);
    }
    updateDemoModeUI();
    if (!demoModeEnabled) {
      if (['bookingStatus', 'payment', 'bookingConfirmed'].includes(currentScreen) && !getActiveBooking() && !getLatestBooking()) {
        showScreen('bookings');
      } else if (currentScreen === 'bookings') renderBookingsPage();
      else if (currentScreen === 'parentHome') setupParentHome();
      else if (currentScreen === 'parentProfile') setupParentProfile();
    }
  }

  updateDemoModeUI();

  let currentScreen = 'welcome';
  let compareProfileSitterId = null;
  let waitingCountdownInterval = null;

  function updateDrawerNavigation(screenId) {
    const loggedIn = state.isLoggedIn;
    if (drawerMemberLinks) drawerMemberLinks.hidden = !loggedIn;
    if (drawerMenuDivider) drawerMenuDivider.hidden = !loggedIn;
    if (drawerAboutLabel) drawerAboutLabel.hidden = !loggedIn;
    if (drawerLogoutBtn) drawerLogoutBtn.hidden = !loggedIn;

    const bookingCount = getUpcomingBookings().length;
    if (drawerBookingsCount) {
      drawerBookingsCount.textContent = String(bookingCount);
      drawerBookingsCount.hidden = !loggedIn || bookingCount === 0;
    }

    const bookingScreens = ['bookings', 'bookingDetails', 'bookingStatus', 'payment', 'bookingConfirmed'];
    const isBookingsCurrent = loggedIn && bookingScreens.includes(screenId);
    const isMessagesCurrent = loggedIn && screenId === 'chat';
    const isProfileCurrent = loggedIn && screenId === 'parentProfile';
    const isChildrenCurrent = loggedIn && screenId === 'myChildren';
    const isFindCurrent = screenId === 'find';
    [
      [drawerFindItem, isFindCurrent],
      [drawerBookingsItem, isBookingsCurrent],
      [drawerMessagesItem, isMessagesCurrent],
      [drawerProfileItem, isProfileCurrent],
      [drawerChildrenItem, isChildrenCurrent],
    ].forEach(([item, isCurrent]) => {
      if (!item) return;
      item.classList.toggle('active', isCurrent);
      if (isCurrent) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
  }

  function updateDemoBadgePosition() {
    if (!demoModeBadge) return;
    let bottomOffset = 16;
    if (currentScreen === 'profile' && window.innerWidth < 1024) {
      bottomOffset += document.querySelector('#screenProfile .mobile-profile-bar')?.getBoundingClientRect().height || 0;
    } else if (currentScreen === 'chat') {
      bottomOffset += document.getElementById('chatForm')?.getBoundingClientRect().height || 0;
    } else if (currentScreen === 'compare') {
      const compareBar = document.querySelector('.compare-bar');
      if (compareBar && getComputedStyle(compareBar).display !== 'none') {
        bottomOffset += compareBar.getBoundingClientRect().height;
      }
    }
    demoModeBadge.style.bottom = `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px))`;
  }

  window.addEventListener('resize', updateDemoBadgePosition);

  function syncQuestionOptions(screenSelector, selectedValues) {
    const values = new Set(Array.isArray(selectedValues) ? selectedValues : [selectedValues]);
    document.querySelectorAll(`${screenSelector} .option-card`).forEach(card => {
      const selected = values.has(card.getAttribute('data-value'));
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-checked', String(selected));
    });
  }

  function showScreen(screenId) {
    if (!screens[screenId]) return;
    if (currentScreen === 'compare' && screenId !== 'compare') compareProfileSitterId = null;
    if (screenId === 'payment') {
      state.bookingStatusState = 'accepted';
      screenId = 'bookingStatus';
    }
    if (['bookingStatus', 'payment', 'bookingConfirmed'].includes(screenId)) {
      const activeBooking = getActiveBooking() || getLatestBooking();
      if (activeBooking) {
        syncBookingToState(activeBooking);
      }
    }

    const loggedInOnlyScreens = [
      'addChild',
      'bookingDetails',
      'bookingStatus',
      'payment',
      'bookingConfirmed',
      'parentHome',
      'parentProfile',
      'myChildren',
      'chat',
      'review',
      'sitterDocuments',
      'sitterApplication',
      'sitterSchedule',
      'sitterEarnings'
    ];

    const roleRequired = {
      bookings: 'parent',
      addChild: 'parent',
      parentHome: 'parent',
      parentProfile: 'parent',
      myChildren: 'parent',
      reschedule: 'parent',
      review: 'parent',
      sitterDocuments: 'babysitter',
      sitterApplication: 'babysitter',
      sitterHome: 'babysitter',
      babysitterHome: 'babysitter',
      sitterSchedule: 'babysitter',
      sitterEarnings: 'babysitter',
      availableJobs: 'babysitter',
      requestDetail: 'babysitter',
      adminDashboard: 'admin',
      adminReview: 'admin',
    }[screenId];

    if (roleRequired && (!state.isLoggedIn || state.user.role !== roleRequired)) {
      state.authReturnScreen = screenId;
      state.bookingIntent = false;
      if (roleRequired === 'admin' && !state.isLoggedIn) {
        screenId = 'adminLogin';
      } else if (state.isLoggedIn) {
        showToast(`Please log in as a ${roleRequired === 'admin' ? 'platform admin' : 'babysitter'} to continue.`);
        screenId = 'welcome';
      } else {
        setAuthMode('signup', roleRequired === 'babysitter' ? 'babysitter' : null);
        screenId = 'auth';
      }
    }

    if (!state.isLoggedIn && loggedInOnlyScreens.includes(screenId)) {
      state.bookingIntent = !['parentHome', 'parentProfile', 'chat', 'review'].includes(screenId);
      state.authReturnScreen = ['addChild', 'parentHome', 'parentProfile', 'myChildren', 'chat', 'review'].includes(screenId) ? screenId : 'booking';
      setAuthMode('signup');
      screenId = 'auth';
    }

    // Hide all screens
    Object.values(screens).forEach(el => {
      if (el) el.style.display = 'none';
    });

    // Show target screen
    screens[screenId].style.display = 'block';

    currentScreen = screenId;

    window.location.hash = screenId === 'welcome' ? '#/' : `#/${screenId}`;
    const isPrototypeScreen = prototypeScreens.includes(screenId);
    document.body.classList.toggle('prototype-flow-active', isPrototypeScreen);
    if (prototypeNav) prototypeNav.hidden = !isPrototypeScreen;
    if (prototypePageBanner) prototypePageBanner.hidden = !isPrototypeScreen;
    if (prototypePageTitle && isPrototypeScreen) prototypePageTitle.textContent = prototypeScreenTitles[screenId];
    document.querySelectorAll('[data-prototype-screen]').forEach(button => {
      button.classList.toggle('active', button.dataset.prototypeScreen === screenId);
      if (button.dataset.prototypeScreen === screenId) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    hamburgerBtn.style.display = 'flex';
    if (topbarLoginBtn) topbarLoginBtn.style.display = state.isLoggedIn ? 'none' : '';
    if (topbarGetStartedBtn) topbarGetStartedBtn.style.display = state.isLoggedIn ? 'none' : '';
    if (profileBtn) profileBtn.hidden = !state.isLoggedIn;
    updateDrawerNavigation(screenId);

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
      renderFindSitters();
      updateFindDraftStatus();
    } else if (screenId === 'matches') {
      renderTopMatches();
    } else if (screenId === 'availableJobs') {
      renderAvailableJobs();
    } else if (screenId === 'profile') {
      populateProfile(state.selectedSitterId);
    } else if (screenId === 'compare') {
      populateCompareTable();
    } else if (screenId === 'review') {
      prepareReviewForm();
    } else if (screenId === 'addChild') {
      setupEmergencyContactToggle();
      renderSavedChildrenList();
    } else if (screenId === 'myChildren') {
      renderSavedChildrenList();
    } else if (screenId === 'bookingDetails') {
      setupBookingDetails();
    } else if (screenId === 'bookings') {
      renderBookingsPage();
    } else if (screenId === 'parentProfile') {
      setupParentProfile();
    } else if (screenId === 'bookingStatus') {
      renderBookingStatus(state.bookingStatusState);
    } else if (screenId === 'payment') {
      setupPaymentScreen();
    } else if (screenId === 'bookingConfirmed') {
      setupBookingConfirmed();
    } else if (screenId === 'reschedule') {
      setupRescheduleScreen();
    } else if (screenId === 'parentHome') {
      setupParentHome();
    } else if (screenId === 'parentProfile') {
      setupParentProfile();
    } else if (screenId === 'chat') {
      setupChatScreen();
    } else if (screenId === 'verify') {
      const verifyEmail = document.getElementById('verifyEmailDisplay');
      if (verifyEmail) verifyEmail.textContent = state.user.email;
    }

    updateDemoBadgePosition();
    window.dispatchEvent(new CustomEvent('ease:screenchange', {
      detail: { screenId, role: state.user.role, isLoggedIn: state.isLoggedIn },
    }));
    saveState();
  }

  if (prototypeNav) {
    prototypeNav.addEventListener('click', event => {
      const button = event.target.closest('[data-prototype-screen]');
      if (button) showScreen(button.dataset.prototypeScreen);
    });
  }

  const prototypeBackButton = document.getElementById('prototypeBackButton');
  if (prototypeBackButton) {
    prototypeBackButton.addEventListener('click', () => {
      if (currentScreen === 'reschedule') showScreen('parentHome');
      else if (currentScreen === 'bookingStatus') showScreen('bookingDetails');
      else if (currentScreen === 'payment') showScreen('bookingStatus');
      else if (currentScreen === 'bookingConfirmed') showScreen('payment');
      else showScreen('bookingDetails');
    });
  }

  const btnMatchesBackToBooking = document.getElementById('btnMatchesBackToBooking');
  if (btnMatchesBackToBooking) {
    btnMatchesBackToBooking.addEventListener('click', () => showScreen('bookingDetails'));
  }

  // Topbar Logo goes to Welcome / Home
  const topbarLogo = document.getElementById('topbarLogo');
  if (topbarLogo) {
    topbarLogo.addEventListener('click', (e) => {
      e.preventDefault();
      showScreen('welcome');
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
    updateDrawerNavigation(currentScreen);
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
    if (event.shiftKey && event.key.toLowerCase() === 'd' && !event.repeat) {
      event.preventDefault();
      setDemoMode(!demoModeEnabled);
    }
    if (event.key === 'Escape' && navDrawer.classList.contains('active')) {
      event.preventDefault();
      closeDrawer();
    }
  });

  if (demoModeBadge) {
    demoModeBadge.addEventListener('click', () => setDemoMode(false));
  }

  // --------------------------------------------------------------------------
  // 5. Screen 1: Welcome Actions
  // --------------------------------------------------------------------------
  const roleNeedSitterCard = document.getElementById('roleNeedSitterCard');
  const roleAmSitterCard = document.getElementById('roleAmSitterCard');
  const topbarLoginBtn = document.getElementById('loginBtn');
  const topbarGetStartedBtn = document.getElementById('getStartedBtn');
  const profileBtn = document.getElementById('profileBtn');

  function activateRoleCard(card) {
    if (!card) return;
    card.addEventListener('click', () => {
      if (card.id === 'roleNeedSitterCard') {
        showScreen('q1');
      } else {
        if (state.isLoggedIn) {
          if (state.user.role === 'babysitter') showScreen('sitterHome');
          else showToast('Log out of your current account to start a babysitter profile.');
        } else {
          state.user.role = 'babysitter';
          showScreen('sitterQ1');
        }
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

  function renderAvailableJobs() {
    const jobsList = document.getElementById('availableJobsList');
    const emptyState = document.getElementById('availableJobsEmpty');
    const availableCount = document.getElementById('availableJobCount');
    if (!jobsList || !emptyState) return;

    const availableJobs = sampleJobRequests.filter(request => request.status === 'available').length;
    if (availableCount) availableCount.textContent = String(availableJobs);
    emptyState.hidden = availableJobs > 0;
    jobsList.innerHTML = sampleJobRequests.map(request => {
      const status = request.status !== 'available'
        ? `<span class="job-status-tag">${escapeHtml(request.status)}</span>`
        : '';
      const action = request.status === 'available'
        ? `<button type="button" class="btn btn-primary" data-view-job="${escapeHtml(request.id)}">View details</button>`
        : '';
      return `
        <article class="card available-job-card">
          <div class="available-job-header">
            <div>
              <p class="eyebrow">${escapeHtml(request.area)}</p>
              <h2 class="card-title">${escapeHtml(request.parent)}</h2>
            </div>
            ${status}
          </div>
          <dl class="available-job-facts">
            <div><dt>Date</dt><dd>${escapeHtml(request.date)}</dd></div>
            <div><dt>Time</dt><dd>${escapeHtml(request.time)}</dd></div>
            <div><dt>Children</dt><dd>${escapeHtml(request.childrenCount)}</dd></div>
            <div><dt>Pay</dt><dd>RM ${request.pay} / hr</dd></div>
          </dl>
          ${action}
        </article>`;
    }).join('');
  }

  function showJobRequest(requestId) {
    const request = sampleJobRequests.find(item => item.id === requestId);
    if (!request || request.status !== 'available') {
      showToast('This request is no longer available.');
      showScreen('availableJobs');
      return;
    }

    selectedJobRequestId = request.id;
    document.getElementById('requestParentName').textContent = request.parent;
    document.getElementById('requestParentArea').textContent = request.area;
    document.getElementById('requestPay').textContent = `RM ${request.pay} / hour`;
    document.getElementById('requestChildAges').textContent = request.childAges;
    document.getElementById('requestDateTime').textContent = `${request.date}, ${request.time}`;
    document.getElementById('requestLocation').textContent = request.location;
    document.getElementById('requestTasks').textContent = request.tasks;
    document.getElementById('requestSpecialNeeds').textContent = request.specialNeeds;
    showScreen('requestDetail');
  }

  const btnOpenAvailableJobs = document.getElementById('btnOpenAvailableJobs');
  const btnBackToBabysitterHome = document.getElementById('btnBackToBabysitterHome');
  const btnBackToAvailableJobs = document.getElementById('btnBackToAvailableJobs');
  const availableJobsList = document.getElementById('availableJobsList');
  const btnAcceptRequest = document.getElementById('btnAcceptRequest');
  const btnDeclineRequest = document.getElementById('btnDeclineRequest');

  if (btnOpenAvailableJobs) {
    btnOpenAvailableJobs.addEventListener('click', () => showScreen('availableJobs'));
  }
  if (btnBackToBabysitterHome) {
    btnBackToBabysitterHome.addEventListener('click', () => showScreen('babysitterHome'));
  }
  if (btnBackToAvailableJobs) {
    btnBackToAvailableJobs.addEventListener('click', () => showScreen('availableJobs'));
  }
  if (availableJobsList) {
    availableJobsList.addEventListener('click', event => {
      const button = event.target.closest('[data-view-job]');
      if (button) showJobRequest(button.dataset.viewJob);
    });
  }
  [btnAcceptRequest, btnDeclineRequest].forEach(button => {
    if (!button) return;
    button.addEventListener('click', () => {
      const request = sampleJobRequests.find(item => item.id === selectedJobRequestId);
      if (!request || request.status !== 'available') {
        showToast('This request is no longer available.');
        showScreen('availableJobs');
        return;
      }
      if (button.id === 'btnAcceptRequest' && (!state.isLoggedIn || state.user.role !== 'babysitter')) {
        state.authReturnScreen = 'requestDetail';
        state.bookingIntent = false;
        if (state.isLoggedIn) {
          showToast('Log in with a babysitter account to accept this job.');
          return;
        }
        setAuthMode('signup', 'babysitter');
        showScreen('auth');
        return;
      }
      if (button.id === 'btnAcceptRequest') {
        const toMinutes = value => {
          if (!value) return null;
          const text = String(value).trim();
          const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
          if (!match) return null;
          let hour = Number(match[1]);
          const minute = Number(match[2]);
          if (match[3]) {
            const meridiem = match[3].toUpperCase();
            if (meridiem === 'PM' && hour < 12) hour += 12;
            if (meridiem === 'AM' && hour === 12) hour = 0;
          }
          return hour * 60 + minute;
        };
        let acceptedJobs = [];
        let storedBookings = [];
        try {
          acceptedJobs = JSON.parse(localStorage.getItem('ease_sitter_jobs') || '[]');
          storedBookings = JSON.parse(localStorage.getItem('easeBookings') || '[]');
        } catch (error) {
          console.error('Could not check the sitter schedule', error);
          showToast('We could not check your schedule. Please try again.');
          return;
        }
        const proposedStart = toMinutes(request.startTime);
        const proposedEnd = toMinutes(request.endTime);
        const overlaps = item => {
          if (item.dateKey !== request.dateKey && item.date !== request.dateKey) return false;
          const start = toMinutes(item.startTime || item.time);
          const end = toMinutes(item.endTime) ?? (start == null ? null : start + Number(item.hours || 4) * 60);
          return start != null && end != null && proposedStart < end && proposedEnd > start;
        };
        if (acceptedJobs.some(item => item.status === 'accepted' && overlaps(item)) ||
          storedBookings.some(item => ['confirmed', 'paid'].includes(item.status) && overlaps(item))) {
          window.alert('Schedule Conflict: You already have a confirmed booking on this date and time. You cannot accept overlapping jobs.');
          return;
        }
        acceptedJobs.push({
          id: request.id,
          dateKey: request.dateKey,
          startTime: request.startTime,
          endTime: request.endTime,
          time: request.time,
          parent: request.parent,
          location: request.location,
          child: request.childAges,
          amount: Number(request.pay) * 4,
          status: 'accepted',
        });
        try {
          localStorage.setItem('ease_sitter_jobs', JSON.stringify(acceptedJobs));
        } catch (error) {
          console.error('Could not save accepted sitter job', error);
          showToast('We could not save this job. Please try again.');
          return;
        }
      }
      request.status = button.id === 'btnAcceptRequest' ? 'accepted' : 'declined';
      savedJobStatuses[request.id] = request.status;
      try {
        localStorage.setItem('ease_sitter_job_statuses', JSON.stringify(savedJobStatuses));
      } catch (error) {
        console.error('Could not save sitter job status', error);
        showToast('We could not save this request status.');
        return;
      }
      renderAvailableJobs();
      showScreen('availableJobs');
      showToast(`Request ${request.status}.`);
    });
  });

  if (topbarLoginBtn) {
    topbarLoginBtn.addEventListener('click', () => {
      state.bookingIntent = false;
      state.authReturnScreen = 'parentHome';
      setAuthMode('login');
      showScreen('auth');
    });
  }
  if (topbarGetStartedBtn) {
    topbarGetStartedBtn.addEventListener('click', () => {
      state.bookingIntent = false;
      state.authReturnScreen = 'parentHome';
      setAuthMode('signup', null);
      showScreen('auth');
    });
  }
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      if (state.user.role === 'babysitter') showScreen('sitterHome');
      else if (state.user.role === 'admin') showScreen('adminDashboard');
      else showScreen('parentProfile');
    });
  }
  if (drawerLogoutBtn) {
    drawerLogoutBtn.addEventListener('click', () => {
      closeDrawer(false);
      setLoggedIn(false);
      state.bookingIntent = false;
      state.authReturnScreen = 'parentHome';
      showScreen('welcome');
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
      saveSearchPostcode(val);
      if (findPostcode) findPostcode.value = val;
      updateFindDraftStatus();
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
      syncAvailabilityFilterFromState();
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
      syncAvailabilityFilterFromState();
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
      if (findCareTypeFilter) {
        findCareTypeFilter.value = careTypeLabels.includes(state.careType) ? state.careType : '';
        updateFindDraftStatus();
      }
      saveState();
    });
  });

  if (btnNextQ3) {
    btnNextQ3.addEventListener('click', () => {
      state.answeredPreferences.careType = true;
      if (findCareTypeFilter && !careTypeLabels.includes(findCareTypeFilter.value) &&
        careTypeLabels.includes(state.careType)) {
        findCareTypeFilter.value = state.careType;
      }
      updateFindDraftStatus();
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
  const matchScores = {
    'sarah-lim': 98,
    'nur-ain': 95,
    aisyah: 93,
  };
  const findSitterList = document.getElementById('findSitterList');
  const findForm = document.getElementById('findForm');
  const findPostcode = document.getElementById('findPostcode');
  const homeSearchForm = document.getElementById('homeSearchForm');
  const homeSearchPostcode = document.getElementById('homeSearchPostcode');
  const homeSearchError = document.getElementById('homeSearchError');
  const findActiveFilters = document.getElementById('findActiveFilters');
  const findResultsCount = document.getElementById('findResultsCount');
  const findEmptyState = document.getElementById('findEmptyState');
  const findFiltersChangedMessage = document.getElementById('findFiltersChangedMessage');
  const findCareTypeFilter = document.getElementById('filterCareType');
  const matchesPostcodeError = document.getElementById('matchesPostcodeError');
  const matchesNearbyState = document.getElementById('matchesNearbyState');
  const findFilters = ['filterRating', 'filterPrice', 'filterDistance', 'filterCareType']
    .map(id => document.getElementById(id));
  const savedEaseFilters = readEaseFilters();
  const savedSearchPostcode = getSearchPostcode();
  const savedCareType = getSearchCareType();
  const questionCareType = state.answeredPreferences.careType && careTypeLabels.includes(state.careType)
    ? state.careType
    : '';
  let activeFindPostcode = (savedEaseFilters && savedEaseFilters.postcode) ||
    savedSearchPostcode || state.postcode || '50450';
  let appliedEaseFilters = savedEaseFilters
    ? { ...savedEaseFilters, postcode: activeFindPostcode }
    : {
      postcode: activeFindPostcode,
      minRating: 0,
      maxPrice: 0,
      maxDistance: 0,
      careType: '',
      availability: null,
    };
  let draftAvailabilityFilter = savedEaseFilters
    ? appliedEaseFilters.availability
    : getRequestedAvailabilityFilter();
  if (findCareTypeFilter) {
    findCareTypeFilter.innerHTML = `
      <option value="">Any care type</option>
      ${careTypeLabels.map(careType => `<option value="${escapeHtml(careType)}">${escapeHtml(careType)}</option>`).join('')}
    `;
    findCareTypeFilter.value = savedEaseFilters
      ? appliedEaseFilters.careType
      : savedCareType ?? questionCareType;
  }
  document.getElementById('filterRating').value = String(appliedEaseFilters.minRating);
  document.getElementById('filterPrice').value = String(appliedEaseFilters.maxPrice);
  document.getElementById('filterDistance').value = String(appliedEaseFilters.maxDistance);
  if (activeFindPostcode) state.postcode = activeFindPostcode;
  if (findPostcode) findPostcode.value = activeFindPostcode;
  function collectDraftEaseFilters() {
    return {
      postcode: findPostcode ? findPostcode.value.trim() : activeFindPostcode,
      minRating: Number(document.getElementById('filterRating').value) || 0,
      maxPrice: Number(document.getElementById('filterPrice').value) || 0,
      maxDistance: Number(document.getElementById('filterDistance').value) || 0,
      careType: findCareTypeFilter ? findCareTypeFilter.value : '',
      availability: draftAvailabilityFilter,
    };
  }

  function saveAppliedEaseFilters() {
    writeEaseFilters(appliedEaseFilters);
  }

  function applyEaseFilters(filters) {
    appliedEaseFilters = { ...filters };
    activeFindPostcode = filters.postcode || activeFindPostcode || '50450';
    draftAvailabilityFilter = filters.availability;
    state.postcode = activeFindPostcode;
    if (findPostcode) findPostcode.value = activeFindPostcode;
    document.getElementById('filterRating').value = String(filters.minRating);
    document.getElementById('filterPrice').value = String(filters.maxPrice);
    document.getElementById('filterDistance').value = String(filters.maxDistance);
    if (findCareTypeFilter) findCareTypeFilter.value = filters.careType;
    updateFindDraftStatus();
  }

  function clearEaseFilters() {
    const findContainer = findResultsCount && findResultsCount.closest('.find-container');
    if (findContainer) findContainer.style.paddingBottom = '';
    applyEaseFilters({
      postcode: '50450',
      minRating: 0,
      maxPrice: 0,
      maxDistance: 0,
      careType: '',
      availability: null,
    });
    saveAppliedEaseFilters();
    saveSearchPostcode(appliedEaseFilters.postcode);
    saveSearchCareType('');
    saveState();
  }

  function syncAvailabilityFilterFromState() {
    draftAvailabilityFilter = getRequestedAvailabilityFilter();
    updateFindDraftStatus();
  }

  function updateFindDraftStatus() {
    if (!findFiltersChangedMessage) return;
    const draft = collectDraftEaseFilters();
    const isUnchanged = draft.postcode === appliedEaseFilters.postcode &&
      draft.minRating === appliedEaseFilters.minRating &&
      draft.maxPrice === appliedEaseFilters.maxPrice &&
      draft.maxDistance === appliedEaseFilters.maxDistance &&
      draft.careType === appliedEaseFilters.careType &&
      JSON.stringify(draft.availability || null) === JSON.stringify(appliedEaseFilters.availability || null);
    findFiltersChangedMessage.hidden = isUnchanged;
  }

  let activeSitterFilter = 'all';

  function scrollFindResults() {
    if (!findResultsCount) return;
    const findContainer = findResultsCount.closest('.find-container');
    const scrollElement = document.scrollingElement;
    if (findContainer && scrollElement) {
      findContainer.style.paddingBottom = '';
      const heading = findResultsCount.getBoundingClientRect();
      const minimumScrollToShowHeading = heading.bottom + window.scrollY - window.innerHeight + 8;
      const maximumScroll = scrollElement.scrollHeight - window.innerHeight;
      const extraSpace = Math.max(0, minimumScrollToShowHeading - maximumScroll);
      if (extraSpace) findContainer.style.paddingBottom = `${extraSpace}px`;
    }
    findResultsCount.focus({ preventScroll: true });
    findResultsCount.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }

  function clearHomeSearchError() {
    if (!homeSearchError || !homeSearchPostcode) return;
    homeSearchError.hidden = true;
    homeSearchError.textContent = '';
    homeSearchPostcode.removeAttribute('aria-invalid');
  }

  if (homeSearchForm && homeSearchPostcode && homeSearchError) {
    homeSearchForm.addEventListener('submit', event => {
      event.preventDefault();
      const postcode = homeSearchPostcode.value.trim();
      if (!/^\d{5}$/.test(postcode)) {
        homeSearchError.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>Enter a 5-digit postcode, for example 50450.</span>
        `;
        homeSearchError.hidden = false;
        homeSearchPostcode.setAttribute('aria-invalid', 'true');
        homeSearchPostcode.focus();
        return;
      }

      clearHomeSearchError();
      state.postcode = postcode;
      if (findPostcode) findPostcode.value = postcode;
      findFilters.forEach(filter => {
        if (filter.id !== 'filterCareType') filter.value = '0';
      });
      applyEaseFilters(collectDraftEaseFilters());
      saveAppliedEaseFilters();
      saveSearchPostcode(postcode);
      saveSearchCareType(appliedEaseFilters.careType);
      saveState();
      showScreen('find');
      scrollFindResults();
    });

    homeSearchPostcode.addEventListener('input', clearHomeSearchError);
  }

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
      if (mode === 'match') {
        return (matchScores[b.dataset.sitterId] || 0) - (matchScores[a.dataset.sitterId] || 0) ||
          Number(b.dataset.preferenceCount) - Number(a.dataset.preferenceCount) ||
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
      const preferenceList = card.querySelector('[data-preference-list]');
      const careTypeChips = card.querySelector('[data-care-types]');
      const matchScore = card.querySelector('[data-match-score]');
      let whyRecommended = card.querySelector('[data-why-recommended]');
      if (!whyRecommended) {
        const recommendationBox = document.createElement('div');
        recommendationBox.className = 'why-recommended-box';
        const title = document.createElement('strong');
        title.className = 'why-rec-title';
        title.textContent = 'Why recommended';
        whyRecommended = document.createElement('ul');
        whyRecommended.className = 'why-rec-list';
        whyRecommended.dataset.whyRecommended = '';
        recommendationBox.append(title, whyRecommended);
        card.querySelector('.sitter-bottom')?.before(recommendationBox);
      }
      if (preferenceList) preferenceList.innerHTML = renderPreferenceCardList(preferences);
      if (careTypeChips) careTypeChips.innerHTML = renderCareTypeChips(sitter);
      if (matchScore) {
        const score = matchScores[sitter.id];
        matchScore.textContent = score ? `${score}% match` : '';
        matchScore.style.display = score ? 'inline-flex' : 'none';
      }
      if (whyRecommended) {
        const availability = (sitter.availability || []).map(item => item.day).join(', ');
        const availabilityPreference = preferences.find(preference => preference.key === 'availability');
        const reasons = [
          { met: sitter.cpr, text: sitter.cpr ? 'CPR certified' : 'CPR certification not listed' },
          {
            met: availabilityPreference ? availabilityPreference.met : Boolean(availability),
            text: availabilityPreference
              ? (availabilityPreference.met ? 'Available for your requested schedule' : availabilityPreference.text)
              : `Regular availability: ${availability || 'Contact for schedule'}`,
          },
          { met: sitter.newborn, text: sitter.newborn ? 'Newborn experience' : 'No newborn experience listed' },
        ];
        whyRecommended.innerHTML = reasons.map(reason => `
          <li><span class="check-icon${reason.met ? '' : ' reason-not-met'}" aria-hidden="true">${reason.met ? '✓' : '–'}</span>${escapeHtml(reason.text)}</li>
        `).join('');
      }

      const meta = card.querySelector('.sitter-meta');
      if (meta) {
        const baseText = meta.dataset.baseText || meta.textContent.trim();
        meta.dataset.baseText = baseText;
        meta.textContent = `${baseText} • ${distanceText}`;
      }

      card.dataset.distanceKm = String(distanceKm);
      card.dataset.preferenceCount = String(preferences.filter(preference => preference.met).length);
      const withinTravelRange = distanceKm <= sitter.travelKm;
      const isFeaturedMatch = matchScores[sitter.id] !== undefined;
      if (withinTravelRange || isFeaturedMatch) sittersInRange += 1;
      card.style.display = (withinTravelRange || isFeaturedMatch) && passesSitterFilter(card) ? 'flex' : 'none';
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
      if (sortSelect) sortSelect.value = 'match';
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
    state.compareSelectionCustom = true;

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
    const activeFilters = getEaseFilterLabels(appliedEaseFilters);

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
    const filters = appliedEaseFilters;
    const filteredSitters = getMatchingSitters(filters)
      .map(sitter => ({ ...sitter, preferences: getPreferencesForSitter(sitter) }));

    findSitterList.style.display = filteredSitters.length ? '' : 'none';
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
              <p class="sitter-meta">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>${sitter.age} years old ·
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="14" rx="2"></rect><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>${escapeHtml(sitter.exp)} experience ·
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>${escapeHtml(sitter.area)} · ${Number.isFinite(sitter.distanceKm) ? `${sitter.distanceKm.toFixed(1)} km away` : 'distance unavailable'}
              </p>
              <div class="stars-row" aria-label="Rating: ${sitter.ratingValue} out of 5 stars">
                <span class="find-stars">${stars}</span>
                <strong class="find-rating-value">${sitter.ratingValue.toFixed(1)}</strong>
                <span class="find-review-count">(${sitter.reviewsCount} reviews)</span>
              </div>
              <p class="sitter-languages"><strong>Languages:</strong> ${escapeHtml(sitter.languages)}</p>
              <div class="care-type-chips" aria-label="Care types offered">${renderCareTypeChips(sitter)}</div>
              <div class="chips-row">${certificateChips}</div>
              ${renderPreferenceCardList(sitter.preferences)}
            </div>
            <div class="find-sitter-footer">
              <p class="find-price-tag"><strong>${escapeHtml(sitter.rateText)}</strong><span>/ hr</span></p>
              <button type="button" class="btn btn-primary find-view-button" data-view-profile="${sitter.id}">
                View profile
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3B2A35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>
            </div>
          </div>
        </article>`;
    }).join('');

    findResultsCount.textContent = `${filteredSitters.length} ${filteredSitters.length === 1 ? 'babysitter' : 'babysitters'} found`;
    if (!filteredSitters.length) {
      findEmptyState.innerHTML = `
        <svg class="find-empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="16" y1="16" x2="21" y2="21"></line>
        </svg>
        <h2 class="card-title">No babysitters match your filters</h2>
        <p>Try changing your filters to see more.</p>
        <button type="button" class="clear-filters-link reset-find-filters">Clear filters</button>
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
      clearEaseFilters();
      renderFindSitters();
    });
  }

  if (findForm && findPostcode) {
    findForm.addEventListener('submit', event => {
      event.preventDefault();
      const filters = collectDraftEaseFilters();
      const postcode = filters.postcode;
      if (!/^\d{5}$/.test(postcode)) {
        findPostcode.setCustomValidity('Enter a 5-digit postcode.');
        findPostcode.reportValidity();
        return;
      }
      findPostcode.setCustomValidity('');
      filters.postcode = postcode;
      applyEaseFilters(filters);
      saveSearchPostcode(postcode);
      saveSearchCareType(filters.careType);
      state.answeredPreferences.distance = true;
      saveState();
      saveAppliedEaseFilters();
      renderFindSitters();
      scrollFindResults();
    });
    findPostcode.addEventListener('input', () => {
      findPostcode.setCustomValidity('');
      updateFindDraftStatus();
    });
    findFilters.forEach(filter => filter.addEventListener('change', updateFindDraftStatus));
  }

  if (findSitterList) {
    findSitterList.addEventListener('click', event => {
      if (event.target.closest('.preferences-expand-link')) return;
      const card = event.target.closest('.find-sitter-card');
      if (!card) return;
      state.selectedSitterId = card.dataset.sitterId;
      showScreen('profile');
    });
    findSitterList.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.find-sitter-card')) {
        event.preventDefault();
        state.selectedSitterId = event.target.dataset.sitterId;
        showScreen('profile');
      }
    });

  }

  if (findActiveFilters) {
    findActiveFilters.addEventListener('click', event => {
      if (!event.target.closest('.clear-filters-link')) return;
      clearEaseFilters();
      renderFindSitters();
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

    const profileName = document.getElementById('profileName');
    const profileLocation = document.getElementById('profileLocation');
    const profilePhoto = document.getElementById('profilePhoto');
    const profileRatingText = document.getElementById('profileRatingText');
    const profileAge = document.getElementById('profileAge');
    const profileExp = document.getElementById('profileExp');
    const profileExpDetail = document.getElementById('profileExpDetail');
    const profileCertCount = document.getElementById('profileCertCount');
    const profileLanguages = document.getElementById('profileLanguages');
    const profileCareTypeChips = document.getElementById('profileCareTypeChips');
    const profileCareTypes = document.querySelector('#profileCareTypes .profile-care-types-list');
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
    ['btnProfileStickyMessage', 'btnProfileMobileMessage'].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.setAttribute('aria-label', `Message ${sitter.name.split(' ')[0]}`);
    });
    if (profileBookingName) profileBookingName.textContent = sitter.name.split(' ')[0];
    if (profileAge) profileAge.textContent = `${sitter.age} years old`;
    const experience = isSarah ? '6 years' : sitter.exp;
    if (profileExp) profileExp.textContent = experience;
    if (profileExpDetail) profileExpDetail.textContent = experience;
    if (profileLanguages) profileLanguages.textContent = sitter.languages;
    if (profileCareTypeChips) profileCareTypeChips.innerHTML = renderCareTypeChips(sitter);
    if (profileCareTypes) {
      profileCareTypes.innerHTML = careTypeLabels.map(careType => {
        const offered = (sitter.careTypes || []).includes(careType);
        return `
          <span class="profile-care-type ${offered ? 'is-offered' : 'is-not-offered'}">
            <span class="care-type-icon" aria-hidden="true">${offered ? '✓' : '—'}</span>
            <span>${escapeHtml(careType)}${offered ? '' : ' not offered'}</span>
          </span>`;
      }).join('');
    }
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
      profilePreferencesSection.hidden = !getListedPreferences(preferences).length;
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

  function saveMessageIntent(sitterId) {
    try {
      sessionStorage.setItem('ease_auth_intent', 'message');
      sessionStorage.setItem('ease_auth_babysitter_id', sitterId);
    } catch (e) {
      console.warn('Could not save message intent', e);
    }
  }

  function clearSavedMessageIntent() {
    try {
      sessionStorage.removeItem('ease_auth_intent');
      sessionStorage.removeItem('ease_auth_babysitter_id');
    } catch (e) {
      console.warn('Could not clear message intent', e);
    }
  }

  function completeSavedMessageIntent() {
    try {
      if (sessionStorage.getItem('ease_auth_intent') !== 'message') return false;
      const sitterId = sessionStorage.getItem('ease_auth_babysitter_id');
      if (sitterId && sittersData[sitterId]) state.selectedSitterId = sitterId;
    } catch (e) {
      console.warn('Could not load message intent', e);
      return false;
    }

    state.bookingIntent = false;
    state.authReturnScreen = 'chat';
    saveState();
    showScreen('chat');
    clearSavedMessageIntent();
    return true;
  }

  function startBookingFlow(sitterId) {
    clearSavedMessageIntent();
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.activeBookingId = null;
    if (state.bookingData.date < getTodayDateValue()) state.bookingData.date = defaultBookingDateValue;
    state.bookingIntent = true;
    state.authReturnScreen = 'booking';
    saveState();

    const hasChildren = Array.isArray(state.children) && state.children.length > 0;

    if (!state.isLoggedIn) {
      setAuthMode('signup');
      showScreen('auth');
    } else if (!hasChildren) {
      showToast('Please add your child\'s profile before booking.');
      showScreen('addChild');
    } else {
      showScreen('bookingDetails');
    }
  }

  function startProfileBookingFlow(sitterId) {
    clearSavedMessageIntent();
    state.selectedSitterId = sitterId || state.selectedSitterId || 'sarah-lim';
    state.activeBookingId = null;
    if (state.bookingData.date < getTodayDateValue()) state.bookingData.date = defaultBookingDateValue;
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
    saveMessageIntent(state.selectedSitterId);
    saveState();

    if (!state.isLoggedIn) {
      setAuthMode('signup');
      showScreen('auth');
    } else {
      showScreen('chat');
      clearSavedMessageIntent();
    }
  }

  const btnProfileCompare = document.getElementById('btnProfileCompare');
  const btnProfileMobileCompare = document.getElementById('btnProfileMobileCompare');
  const btnProfileStickyBook = document.getElementById('btnProfileStickyBook');
  const btnProfileStickyMessage = document.getElementById('btnProfileStickyMessage');
  const btnProfileMobileBook = document.getElementById('btnProfileMobileBook');
  const btnProfileMobileMessage = document.getElementById('btnProfileMobileMessage');

  [btnProfileStickyBook, btnProfileMobileBook].forEach(button => {
    if (button) button.addEventListener('click', () => startProfileBookingFlow(state.selectedSitterId));
  });

  [btnProfileStickyMessage, btnProfileMobileMessage].forEach(button => {
    if (button) button.addEventListener('click', () => startMessageFlow(state.selectedSitterId));
  });

  [btnProfileCompare, btnProfileMobileCompare].forEach(button => {
    if (button) button.addEventListener('click', () => {
      compareProfileSitterId = state.selectedSitterId;
      state.comparedSitters = new Set([
        state.selectedSitterId,
        ...Array.from(state.comparedSitters).filter(id => id !== state.selectedSitterId),
      ].slice(0, 3));
      showScreen('compare');
    });
  });

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
    careTypes: '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    preferences: '<path d="M9 6h11M9 12h11M9 18h11"></path><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17"></path>',
  };
  const compareFeatureDefinitions = [
    { id: 'rating', title: 'Rating', score: sitter => sitter.ratingValue, value: sitter => sitter.ratingValue.toFixed(1), detail: sitter => `${sitter.reviewsCount} reviews` },
    { id: 'experience', title: 'Experience', score: sitter => Number.parseInt(sitter.exp, 10) || 0, value: sitter => sitter.exp },
    { id: 'price', title: 'Price', score: sitter => -sitter.price, value: sitter => `RM ${sitter.price} / hr` },
    {
      id: 'careTypes',
      title: 'Care offered',
      score: sitter => careTypeLabels.filter(careType => (sitter.careTypes || []).includes(careType)).length,
      render: sitter => `<span class="care-type-chips compare-care-type-chips">${renderCareTypeChips(sitter)}</span>`,
    },
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
  ];

  const compareHeaderColumns = document.getElementById('compareHeaderColumns');
  const compareFeatureSections = document.getElementById('compareFeatureSections');
  const compareCompactColumns = document.getElementById('compareCompactColumns');
  const compareExpandedHeader = document.getElementById('compareExpandedHeader');
  const compareCompactBar = document.getElementById('compareCompactBar');
  const compareScreenContainer = document.querySelector('#screenCompare .compare-screen-container');
  const compareFilterSummary = document.getElementById('compareFilterSummary');
  const compareEmptyState = document.getElementById('compareEmptyState');
  const compareLimitedState = document.getElementById('compareLimitedState');
  const compareLimitedMessage = document.getElementById('compareLimitedMessage');
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

  function getEaseFilterLabels(filters) {
    const labels = [];
    if (filters.minRating) labels.push(`${filters.minRating} stars & up`);
    if (filters.maxPrice) labels.push(`Up to RM ${filters.maxPrice}`);
    if (filters.maxDistance) labels.push(`Within ${filters.maxDistance} km`);
    if (filters.careType) labels.push(filters.careType);
    if (filters.availability) {
      const availability = typeof filters.availability === 'string'
        ? filters.availability
        : filters.availability.customDate || filters.availability.day ||
        (filters.availability.when ? filters.availability.when.toLowerCase() : '');
      if (availability) labels.push(`Available ${availability}`);
    }
    return labels;
  }

  function renderCompareFilterSummary(filters, matchingCount) {
    const labels = getEaseFilterLabels(filters);
    const chips = labels.length
      ? labels.map(label => `
          <span class="compare-filter-chip">
            <span class="check-icon" aria-hidden="true">✓</span>${escapeHtml(label)}
          </span>`).join('')
      : '<span class="compare-filter-all">All babysitters</span>';
    const countLabel = `${matchingCount} babysitter${matchingCount === 1 ? '' : 's'} ${matchingCount === 1 ? 'matches' : 'match'}`;
    compareFilterSummary.innerHTML = `
      <div class="compare-filter-summary-label">
        <strong>Showing babysitters that match:</strong>
        <div class="compare-filter-chips">${chips}</div>
      </div>
      <div class="compare-filter-summary-actions">
        <strong class="compare-match-count">${escapeHtml(countLabel)}</strong>
        <button type="button" class="compare-filter-link" data-compare-action="edit">Edit filters</button>
        <button type="button" class="compare-filter-link" data-compare-action="clear">Clear filters</button>
      </div>`;
  }

  function renderCompareEmptyState() {
    compareEmptyState.innerHTML = `
      <svg class="find-empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7"></circle>
        <line x1="16" y1="16" x2="21" y2="21"></line>
      </svg>
      <h2 class="card-title">No babysitters match your filters</h2>
      <p>Try changing your filters to see more.</p>
      <button type="button" class="btn btn-primary compare-edit-filters">Edit filters</button>`;
  }

  function populateCompareTable() {
    if (!compareHeaderColumns || !compareFeatureSections || !compareCompactColumns) return;

    const filters = appliedEaseFilters;
    const matchingSitters = getMatchingSitters(filters);
    const matchingIds = matchingSitters.map(sitter => sitter.id);
    const matchingIdSet = new Set(matchingIds);
    const profileSitter = compareProfileSitterId && sittersData[compareProfileSitterId]
      ? sittersData[compareProfileSitterId]
      : null;
    const showProfileOverride = Boolean(profileSitter &&
      !matchingIdSet.has(profileSitter.id) && getEaseFilterLabels(filters).length);
    const candidateIds = [
      ...(profileSitter ? [profileSitter.id] : []),
      ...matchingIds.filter(id => !profileSitter || id !== profileSitter.id),
    ];
    const savedIds = (state.compareSelectionCustom ? Array.from(state.comparedSitters) : []).filter(id =>
      matchingIdSet.has(id) || (showProfileOverride && profileSitter && id === profileSitter.id)
    );
    const orderedIds = [...new Set([
      ...(profileSitter ? [profileSitter.id] : []),
      ...savedIds,
      ...candidateIds,
    ])];
    const selectedCount = orderedIds.length >= 3 && state.comparedSitters.size >= 3
      ? 3
      : Math.min(2, orderedIds.length);
    const selectedIds = orderedIds.slice(0, selectedCount);
    const needsThirdSlot = candidateIds.length >= 3 && selectedIds.length < 3;
    const slotCount = Math.min(3, Math.max(selectedIds.length, needsThirdSlot ? 3 : 0));
    const sitterSlots = Array.from({ length: slotCount }, (_, index) => {
      const id = selectedIds[index];
      if (!id) return null;
      return matchingSitters.find(sitter => sitter.id === id) || sittersData[id];
    });

    renderCompareFilterSummary(filters, matchingSitters.length);
    compareHeaderColumns.style.display = slotCount ? '' : 'none';
    compareExpandedHeader.style.display = slotCount ? '' : 'none';
    compareFeatureSections.style.display = slotCount ? '' : 'none';
    compareCompactColumns.style.display = slotCount ? '' : 'none';
    compareCompactBar.style.display = slotCount ? '' : 'none';
    compareEmptyState.hidden = matchingSitters.length !== 0;
    if (!matchingSitters.length) renderCompareEmptyState();
    compareLimitedState.hidden = matchingSitters.length !== 1;
    if (matchingSitters.length === 1) {
      compareLimitedMessage.textContent = 'Only one babysitter matches your filters.';
    }

    if (!slotCount) {
      compareHeaderColumns.innerHTML = '';
      compareCompactColumns.innerHTML = '';
      compareFeatureSections.innerHTML = '';
      state.comparedSitters = new Set();
      return;
    }

    state.comparedSitters = new Set(selectedIds);
    saveState();

    compareHeaderColumns.dataset.sitterCount = String(sitterSlots.filter(Boolean).length);
    compareCompactColumns.dataset.sitterCount = String(sitterSlots.filter(Boolean).length);
    if (compareScreenContainer) compareScreenContainer.style.setProperty('--cols', String(Math.max(1, slotCount)));
    compareHeaderColumns.innerHTML = sitterSlots.map((sitter, slot) => {
      const optionIds = [
        ...matchingIds,
        ...(showProfileOverride && slot === 0 && profileSitter ? [profileSitter.id] : []),
      ];
      const options = optionIds.map(id => {
        const option = sittersData[id];
        const selectedElsewhere = sitterSlots.some((other, otherSlot) =>
          otherSlot !== slot && other && other.id === option.id
        );
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

      const isProfileMismatch = showProfileOverride && sitter.id === profileSitter.id;
      return `<article class="compare-sitter-column">${selector}
        ${isProfileMismatch ? '<p class="compare-filter-mismatch-note">Does not match your filters</p>' : ''}
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
            <div class="compare-header-actions">
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

    const comparePreferences = sitterSlots.some(sitter => sitter &&
      getListedPreferences(getPreferencesForSitter(sitter)).length
    );
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
          ? `<span class="compare-best-value"><small>Best</small><span>${value}</span></span>`
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
    }).join('') + `
      <section class="compare-feature-section compare-book-section" aria-label="Book a babysitter">
        <div class="compare-feature-values">
          ${sitterSlots.map(sitter => sitter ? `
            <div class="compare-value-column">
              <button type="button" class="btn btn-primary compare-book-button" data-sitter-id="${sitter.id}" aria-label="Book ${escapeHtml(sitter.name)}">Book ${escapeHtml(sitter.name)}</button>
            </div>` : '<div class="compare-value-column"></div>').join('')}
        </div>
      </section>`;

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
      const filters = appliedEaseFilters;
      const matchingIds = new Set(getMatchingSitters(filters).map(sitter => sitter.id));
      const isAllowedProfileOverride = slot === 0 && compareProfileSitterId === newId &&
        !matchingIds.has(newId);
      if (newId && !matchingIds.has(newId) && !isAllowedProfileOverride) {
        populateCompareTable();
        return;
      }
      if (slot < 2 && !newId) {
        populateCompareTable();
        return;
      }
      if (newId && slots.some((id, index) => index !== slot && id === newId)) {
        populateCompareTable();
        return;
      }
      if (slot === 0 && compareProfileSitterId && newId !== compareProfileSitterId) {
        compareProfileSitterId = null;
      }
      slots[slot] = newId || null;
      state.comparedSitters = new Set(slots.filter(id =>
        id && (matchingIds.has(id) || (compareProfileSitterId === id && isAllowedProfileOverride))
      ));
      state.compareSelectionCustom = true;
      saveState();
      populateCompareTable();
    });

    compareHeaderColumns.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const addButton = event.target.closest('#btnAddCompareSitter');
      if (addButton) {
        const currentIds = Array.from(state.comparedSitters).filter(id => sittersData[id]);
        if (currentIds.length >= 3) return;
        const filters = appliedEaseFilters;
        const nextId = getMatchingSitters(filters).find(sitter => !currentIds.includes(sitter.id))?.id;
        if (!nextId) return;
        state.comparedSitters = new Set([...currentIds, nextId]);
        state.compareSelectionCustom = true;
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

    });
  }

  if (compareFilterSummary) {
    compareFilterSummary.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest('[data-compare-action]')?.dataset.compareAction;
      if (action === 'edit') {
        showScreen('find');
      } else if (action === 'clear') {
        clearEaseFilters();
        renderFindSitters();
        populateCompareTable();
      }
    });
  }

  const compareScreen = document.getElementById('screenCompare');
  if (compareScreen) {
    compareScreen.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('.compare-edit-filters')) {
        showScreen('find');
      }
    });
  }

  if (compareFeatureSections) {
    compareFeatureSections.addEventListener('click', event => {
      if (!(event.target instanceof Element)) return;
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
  const authSubtext = document.getElementById('authSubtext');
  const authIntentMessage = document.getElementById('authIntentMessage');
  const groupName = document.getElementById('groupName');
  const groupPhone = document.getElementById('groupPhone');
  const groupPrivacy = document.getElementById('groupPrivacy');
  const btnAuthSubmit = document.getElementById('btnAuthSubmit');
  const authForm = document.getElementById('authForm');

  const authRoleGroup = document.getElementById('authRoleGroup');
  const authRoleHint = document.getElementById('authRoleHint');
  const authDetails = document.getElementById('authDetails');
  const authDetailsSidebar = document.getElementById('authDetailsSidebar');
  const authRegistrationTitle = document.getElementById('authRegistrationTitle');
  const roleSelectParent = document.getElementById('roleSelectParent');
  const roleSelectSitter = document.getElementById('roleSelectSitter');
  const groupParentChildren = document.getElementById('groupParentChildren');
  const groupAuthDob = document.getElementById('groupAuthDob');
  const authDob = document.getElementById('authDob');

  let authMode = 'signup';
  let signupRole = null;

  function setSignupRole(role) {
    signupRole = role;
    const isParent = role === 'parent';
    const isSitter = role === 'babysitter';
    const roleLabel = isParent ? 'parent' : 'babysitter';

    authDetails.hidden = !role;
    authRoleHint.hidden = Boolean(role);
    roleSelectParent.classList.toggle('active', isParent);
    roleSelectSitter.classList.toggle('active', isSitter);
    roleSelectParent.setAttribute('aria-pressed', String(isParent));
    roleSelectSitter.setAttribute('aria-pressed', String(isSitter));
    groupParentChildren.style.display = isParent ? 'flex' : 'none';
    authForm.classList.toggle('sitter-mode', isSitter);

    authHeadline.textContent = role === 'parent'
      ? 'Create an account to book'
      : role === 'babysitter'
        ? 'Create an account to submit your profile'
        : 'Create your Ease account';
    authSubtext.hidden = !role;
    authSubtext.textContent = role === 'parent'
      ? 'Set up your account to book trusted care.'
      : role === 'babysitter'
        ? 'Set up your account to submit your profile for review.'
        : '';
    authRegistrationTitle.textContent = role
      ? `${isParent ? 'Parent' : 'Babysitter'} registration`
      : 'Create your account';
    btnAuthSubmit.textContent = 'Continue to Verification';
    clearAuthErrors();
  }

  roleSelectParent.addEventListener('click', () => setSignupRole('parent'));
  roleSelectSitter.addEventListener('click', () => setSignupRole('babysitter'));

  function updateAuthIntentMessage() {
    if (!authIntentMessage) return;
    const isMessageIntent = state.authReturnScreen === 'chat' && !state.bookingIntent;
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    authIntentMessage.hidden = !isMessageIntent;
    if (isMessageIntent) {
      authIntentMessage.textContent = `Create an account to message ${sitter.name.split(' ')[0]}.`;
    }
  }

  function setAuthMode(mode, role = ['addChild', 'parentHome', 'myChildren'].includes(state.authReturnScreen) ? null : 'parent') {
    authMode = mode;
    const isSignup = mode === 'signup';
    authDetailsSidebar.hidden = !isSignup;
    authDetails.classList.toggle('auth-details-login', !isSignup);
    groupAuthDob.style.display = isSignup ? 'flex' : 'none';
    updateAuthIntentMessage();
    if (authForm) {
      authForm.classList.toggle('login-mode', mode === 'login');
      authForm.classList.toggle('sitter-mode', mode === 'signup' && signupRole === 'babysitter');
    }
    if (mode === 'signup') {
      tabSignUp.classList.add('active');
      tabLogIn.classList.remove('active');
      groupName.style.display = 'flex';
      groupPhone.style.display = 'flex';
      groupPrivacy.style.display = 'block';
      // Show role selection and apply current role
      if (authRoleGroup) authRoleGroup.style.display = 'block';
      setSignupRole(role);
    } else {
      authDetails.hidden = false;
      authRoleHint.hidden = true;
      tabLogIn.classList.add('active');
      tabSignUp.classList.remove('active');
      authHeadline.textContent = 'Log in to your account';
      authSubtext.hidden = false;
      authSubtext.textContent = 'Welcome back! Log in to manage your sessions.';
      groupName.style.display = 'none';
      groupPhone.style.display = 'none';
      groupPrivacy.style.display = 'none';
      btnAuthSubmit.textContent = 'Log In';
      // Hide all role-specific UI
      if (authRoleGroup) authRoleGroup.style.display = 'none';
      if (groupParentChildren) groupParentChildren.style.display = 'none';
    }
    clearAuthErrors();
  }

  window.easeApp = {
    navigate: showScreen,
    setRoleSession(role, user = {}) {
      state.user = { ...state.user, ...user, role };
      setLoggedIn(true);
      saveState();
    },
    beginSignup(role, returnScreen) {
      if (state.isLoggedIn && state.user.role !== role) setLoggedIn(false);
      state.authReturnScreen = returnScreen;
      state.bookingIntent = role === 'parent';
      state.user.role = role;
      setAuthMode('signup', role);
      showScreen('auth');
    },
    beginLogin(returnScreen = 'parentHome') {
      state.authReturnScreen = returnScreen;
      state.bookingIntent = false;
      setAuthMode('login');
      showScreen('auth');
    },
    logout() {
      setLoggedIn(false);
      state.bookingIntent = false;
      state.authReturnScreen = 'welcome';
      saveState();
      showScreen('welcome');
    },
    updateBookingStatus(bookingId, status) {
      const booking = bookings.find(item => item.id === bookingId);
      if (!booking) return false;
      booking.status = status;
      saveBookings();
      if (currentScreen === 'bookings') renderBookingsPage();
      if (currentScreen === 'parentHome') setupParentHome();
      return true;
    },
    getSession() {
      return { isLoggedIn: state.isLoggedIn, role: state.user.role, user: { ...state.user } };
    },
    toast: showToast,
  };

  if (tabSignUp) tabSignUp.addEventListener('click', () => setAuthMode('signup'));
  if (tabLogIn) tabLogIn.addEventListener('click', () => setAuthMode('login'));

  function clearAuthErrors() {
    ['authName', 'authEmail', 'authPhone', 'authDob', 'authPassword', 'authParentChildren'].forEach(id => {
      const input = document.getElementById(id);
      if (input) input.classList.remove('input-error');
    });
    ['errorAuthName', 'errorAuthEmail', 'errorAuthPhone', 'errorAuthPassword', 'errorAuthPrivacy',
      'errorAuthParentChildren', 'errorAuthDob'].forEach(id => {
        const err = document.getElementById(id);
        if (err) err.style.display = 'none';
      });
  }

  // Clear single error on typing
  ['authName', 'authEmail', 'authPhone', 'authDob', 'authPassword', 'authParentChildren'].forEach(id => {
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
      if (authMode === 'signup' && !signupRole) return;
      clearAuthErrors();

      const nameVal = document.getElementById('authName').value.trim();
      const emailVal = document.getElementById('authEmail').value.trim();
      const phoneVal = document.getElementById('authPhone').value.trim();
      const passwordVal = document.getElementById('authPassword').value;
      const privacyChecked = document.getElementById('authPrivacy').checked;

      let hasError = false;

      if (authMode === 'signup') {
        if (!authDob.value || authDob.value >= getTodayDateValue()) {
          authDob.classList.add('input-error');
          document.getElementById('errorAuthDob').style.display = 'flex';
          hasError = true;
        }
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

        // Role-specific validation: Parent only needs number of children
        if (signupRole === 'parent') {
          const childrenVal = document.getElementById('authParentChildren').valueAsNumber;
          if (!Number.isInteger(childrenVal) || childrenVal < 1 || childrenVal > 10) {
            document.getElementById('authParentChildren').classList.add('input-error');
            document.getElementById('errorAuthParentChildren').style.display = 'flex';
            hasError = true;
          }
        }
        // Babysitter: no extra fields at signup — additional details collected on Babysitter Profile page
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
        state.user.dob = authDob.value;
        state.user.role = signupRole;

        // Save role-specific data
        if (signupRole === 'parent') {
          state.user.numChildren = document.getElementById('authParentChildren').valueAsNumber;
        }
        // Babysitter extra details (rate, experience, specialties) are collected
        // on the Babysitter Profile page — handled by the responsible team member.

        saveState();
        showScreen('verify');
      } else {
        state.user.email = emailVal;
        setLoggedIn(true);
        saveState();
        if (completeSavedMessageIntent()) {
          return;
        } else if (state.user.role === 'babysitter') {
          const sitterReturn = ['requestDetail', 'availableJobs', 'sitterHome', 'babysitterHome', 'sitterSchedule', 'sitterEarnings', 'sitterApplication', 'sitterDocuments'];
          showScreen(sitterReturn.includes(state.authReturnScreen) ? state.authReturnScreen : 'sitterHome');
        } else if (state.authReturnScreen === 'parentHome') {
          showScreen('parentHome');
        } else if (state.authReturnScreen === 'parentProfile') {
          showScreen('parentProfile');
        } else if (state.authReturnScreen === 'myChildren') {
          showScreen('myChildren');
        } else if (state.authReturnScreen === 'addChild') {
          showScreen('addChild');
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

  setAuthMode('signup', null);

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

      const firstName = (state.user.name || 'there').split(' ')[0];
      if (state.user.role === 'babysitter') {
        showToast(`Welcome to Ease Caregivers, ${firstName}! Your application is under review.`);
      } else {
        showToast(`Email verified! Welcome to Ease, ${firstName}!`);
      }

      if (completeSavedMessageIntent()) {
        return;
      } else if (state.user.role === 'babysitter') {
        showScreen('sitterDocuments');
      } else if (state.authReturnScreen === 'parentHome') {
        showScreen('parentHome');
      } else if (state.authReturnScreen === 'parentProfile') {
        showScreen('parentProfile');
      } else if (state.authReturnScreen === 'myChildren') {
        showScreen('myChildren');
      } else if (state.authReturnScreen === 'addChild') {
        showScreen('addChild');
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
  const btnCancelChildEdit = document.getElementById('btnCancelChildEdit');
  let editingChildId = null;
  let editingReturnScreen = null;

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

  function getChildFormData(childId = null) {
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
      id: childId || createChildId(),
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

  function setChildFormMode(isEditing) {
    const heading = document.getElementById('addChildHeading');
    const submitButton = addChildForm && addChildForm.querySelector('button[type="submit"]');
    if (heading) heading.textContent = isEditing ? 'Edit Child Profile' : 'Add Your Child';
    if (submitButton) submitButton.textContent = isEditing ? 'Save changes' : 'Save and continue';
    if (btnAddAnotherChild) btnAddAnotherChild.style.display = isEditing ? 'none' : '';
    if (btnCancelChildEdit) btnCancelChildEdit.style.display = isEditing ? '' : 'none';
  }

  function getChildChipValues(gridId, savedValue) {
    const grid = document.getElementById(gridId);
    if (!grid) return { selected: [], unknown: [] };
    const options = new Set(Array.from(grid.querySelectorAll('.form-chip'), chip => chip.dataset.value));
    const values = Array.isArray(savedValue)
      ? savedValue
      : (typeof savedValue === 'string' && savedValue.trim() ? savedValue.split(/\s*,\s*/) : []);
    const selected = [];
    const unknown = [];
    values.forEach(value => {
      if (options.has(value)) selected.push(value);
      else if (value) unknown.push(value);
    });
    if (unknown.length && options.has('Other') && !selected.includes('Other')) selected.push('Other');
    return { selected, unknown };
  }

  function populateChildForm(child) {
    const setValue = (id, value) => {
      const input = document.getElementById(id);
      if (input) input.value = value || '';
    };
    setValue('childName', child.name);
    setValue('childGender', child.gender || 'Boy');
    setValue('childBirthDate', child.birthDate);
    setValue('childAllergiesDetails', child.allergiesDetails);
    setValue('childMedicalDetails', child.medicalDetails);
    setValue('childSpecialNeedsDetails', child.specialNeedsDetails);
    setValue('childRoutineNotes', child.routineNotes ||
      (!Array.isArray(child.routineSleep) && !Array.isArray(child.routineFeeding) ? child.routine : ''));
    setValue('childEmergencyName', child.emergencyName);
    setValue('childEmergencyPhone', child.emergencyPhone);

    const chipFields = [
      { gridId: 'chipsAllergies', value: child.allergies, otherId: 'childAllergiesOther', other: child.allergiesOther },
      { gridId: 'chipsMedical', value: child.medical, otherId: 'childMedicalOther', other: child.medicalOther },
      { gridId: 'chipsSpecialNeeds', value: child.specialNeeds, otherId: 'childSpecialNeedsOther', other: child.specialNeedsOther },
      { gridId: 'chipsPersonality', value: child.personality, otherId: 'childPersonalityOther', other: child.personalityOther },
      { gridId: 'chipsInterests', value: child.interests, otherId: 'childInterestsOther', other: child.interestsOther },
      { gridId: 'chipsRoutineSleep', value: child.routineSleep },
      { gridId: 'chipsRoutineFeeding', value: child.routineFeeding },
    ];

    chipFields.forEach(({ gridId, value, otherId, other }) => {
      const grid = document.getElementById(gridId);
      if (!grid) return;
      const { selected, unknown } = getChildChipValues(gridId, value);
      grid.querySelectorAll('.form-chip').forEach(chip => {
        chip.classList.toggle('active', selected.includes(chip.dataset.value));
      });
      if (otherId) {
        const otherValues = [other, ...unknown].filter(Boolean);
        setValue(otherId, Array.from(new Set(otherValues)).join(', '));
      }
      updateConditionalInputs(grid.dataset.field, grid);
    });

    if (!Array.isArray(child.personality) && !Array.isArray(child.interests) &&
      child.description && child.description !== 'Friendly and curious.' &&
      !child.personalityOther && !child.interestsOther) {
      const personalityGrid = document.getElementById('chipsPersonality');
      const otherChip = personalityGrid && personalityGrid.querySelector('[data-value="Other"]');
      if (otherChip) {
        otherChip.classList.add('active');
        setValue('childPersonalityOther', child.description);
        updateConditionalInputs('personality', personalityGrid);
      }
    }

    const useParentContact = Boolean(
      child.isParentEmergencyContact &&
      state.user.name && state.user.phone &&
      child.emergencyName === state.user.name &&
      child.emergencyPhone === state.user.phone
    );
    const radioParent = document.getElementById('radioParentEmergency');
    const radioManual = document.getElementById('radioManualEmergency');
    if (radioParent) radioParent.checked = useParentContact;
    if (radioManual) radioManual.checked = !useParentContact;
    setChildFormMode(true);
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
    syncChildCount();
    const cards = state.children.map(c => {
      const ageStr = formatChildAge(c.birthDate);
      const allergiesText = formatAllergiesSummary(c);
      const medicalText = formatMedicalSummary(c);
      const avatar = c.gender === 'Girl' ? '👧' : '👦';
      const birthDateText = c.birthDate
        ? new Date(`${c.birthDate}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Date of birth not provided';

      return `
        <div class="saved-child-card" data-child-id="${escapeHtml(c.id)}">
          <div class="saved-child-avatar">${avatar}</div>
          <div class="saved-child-info">
            <div class="saved-child-header">
              <strong class="saved-child-name">${escapeHtml(c.name)}</strong>
              <span class="saved-child-meta">${escapeHtml(c.gender || 'Gender not provided')}${ageStr ? ' • ' + escapeHtml(ageStr) : ''}</span>
            </div>
            <p class="saved-child-details">
              <span>Date of birth: ${escapeHtml(birthDateText)}</span> •
              <span>Allergies: ${escapeHtml(allergiesText)}</span>
              ${medicalText ? ` • <span>Medical: ${escapeHtml(medicalText)}</span>` : ''}
            </p>
          </div>
          <div class="saved-child-actions">
            <button type="button" class="btn btn-secondary saved-child-action"
              data-child-action="edit" data-child-id="${escapeHtml(c.id)}">Edit</button>
            <button type="button" class="btn saved-child-action saved-child-remove"
              data-child-action="remove" data-child-id="${escapeHtml(c.id)}">Remove</button>
          </div>
        </div>
      `;
    }).join('');

    ['savedChildrenList', 'parentProfileChildrenList', 'myChildrenList'].forEach(id => {
      const list = document.getElementById(id);
      if (list) list.innerHTML = cards;
    });

    const hasChildren = state.children.length > 0;
    const addChildSection = document.getElementById('savedChildrenSection');
    if (addChildSection) addChildSection.style.display = hasChildren ? 'block' : 'none';
    const savedCount = document.getElementById('savedChildrenCount');
    if (savedCount) savedCount.textContent = String(state.children.length);
    const profileEmpty = document.getElementById('parentProfileChildrenEmpty');
    if (profileEmpty) profileEmpty.hidden = hasChildren;
    const myChildrenEmpty = document.getElementById('myChildrenEmpty');
    if (myChildrenEmpty) myChildrenEmpty.hidden = hasChildren;
    ['savedChildrenList', 'parentProfileChildrenList', 'myChildrenList'].forEach(id => {
      const list = document.getElementById(id);
      if (list) list.hidden = !hasChildren;
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('button[data-child-action][data-child-id]');
    if (!button) return;
    const list = button.closest('#savedChildrenList, #parentProfileChildrenList, #myChildrenList');
    if (!list) return;
    const childId = button.dataset.childId;
    const child = state.children.find(savedChild => savedChild.id === childId);
    if (!child) return;

    if (button.dataset.childAction === 'edit') {
      editingChildId = child.id;
      editingReturnScreen = currentScreen;
      populateChildForm(child);
      showScreen('addChild');
      document.getElementById('addChildForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (button.dataset.childAction !== 'remove' ||
      !window.confirm(`Remove ${child.name}'s saved profile? This cannot be undone.`)) return;

    state.children = state.children.filter(savedChild => savedChild.id !== childId);
    if (state.bookingData.childId === childId) {
      const nextChild = state.children[0] || null;
      state.bookingData.childId = nextChild ? nextChild.id : null;
      state.bookingData.childName = nextChild ? nextChild.name : '';
      state.bookingData.child = nextChild;
    }
    if (!state.children.length) state.child = null;
    if (editingChildId === childId) {
      editingChildId = null;
      resetChildForm();
      setChildFormMode(false);
      if (editingReturnScreen && editingReturnScreen !== 'addChild') {
        const returnScreen = editingReturnScreen;
        editingReturnScreen = null;
        showScreen(returnScreen);
      }
    }
    saveState();
    renderSavedChildrenList();
    showToast(`Removed "${child.name}".`);
  });

  ['btnParentAddChild', 'btnMyChildrenAddChild'].forEach(id => {
    const button = document.getElementById(id);
    if (button) button.addEventListener('click', () => {
      state.bookingIntent = false;
      showScreen('addChild');
    });
  });

  if (btnCancelChildEdit) {
    btnCancelChildEdit.addEventListener('click', () => {
      editingChildId = null;
      resetChildForm();
      setChildFormMode(false);
      if (editingReturnScreen && editingReturnScreen !== 'addChild') {
        const returnScreen = editingReturnScreen;
        editingReturnScreen = null;
        showScreen(returnScreen);
      }
    });
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
      setChildFormMode(false);
      showToast(`Saved "${newChild.name}"! You can add another child now.`);
      const nameInput = document.getElementById('childName');
      if (nameInput) nameInput.focus();
    });
  }

  if (addChildForm) {
    addChildForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (editingChildId) {
        if (!validateChildForm()) {
          showToast('Please fill in all required fields marked with *');
          return;
        }
        const childIndex = state.children.findIndex(child => child.id === editingChildId);
        if (childIndex === -1) {
          editingChildId = null;
          editingReturnScreen = null;
          resetChildForm();
          setChildFormMode(false);
          renderSavedChildrenList();
          showToast('This child profile could not be found. Please try again.');
          return;
        }

        const updatedChild = getChildFormData(editingChildId);
        state.children[childIndex] = updatedChild;
        if (state.bookingData.childId === updatedChild.id) {
          state.bookingData.child = updatedChild;
          state.bookingData.childName = updatedChild.name;
        }
        saveState();
        renderSavedChildrenList();
        const returnScreen = editingReturnScreen;
        editingChildId = null;
        editingReturnScreen = null;
        resetChildForm();
        setChildFormMode(false);
        showToast(`"${updatedChild.name}" updated successfully.`);
        if (returnScreen && returnScreen !== 'addChild') showScreen(returnScreen);
        return;
      }

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
        setChildFormMode(false);
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
  const sampleBookingChildren = [
    { id: 'sample-aiden', name: 'Aiden', gender: 'Boy', birthDate: '2023-11-24', displayAge: '3 yrs', allergies: 'None', medical: 'None', routine: 'Loves building blocks and bedtime stories.' },
    { id: 'sample-maya', name: 'Maya', gender: 'Girl', birthDate: '2025-11-24', displayAge: '1 yr', allergies: 'None', medical: 'None', routine: 'Enjoys quiet play and an early bedtime.' },
  ];

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
    if (!hasChildren && !prototypeScreens.includes(currentScreen)) {
      showToast('Please add your child\'s profile before booking.');
      showScreen('addChild');
      return;
    }
    const children = hasChildren ? state.children : sampleBookingChildren;

    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];

    const bookingSitterTitle = document.getElementById('bookingSitterTitle');
    const bookingSitterRate = document.getElementById('bookingSitterRate');
    const bookingChildSelect = document.getElementById('bookingChildSelect');
    const bookingLocationInput = document.getElementById('bookingLocationInput');

    if (bookingSitterTitle) bookingSitterTitle.textContent = sitter.name;
    if (bookingSitterRate) bookingSitterRate.textContent = `${sitter.rateText} / hr • Ease Trained`;
    if (bookingLocationInput) bookingLocationInput.value = state.bookingData.location || `${state.postcode} Kuala Lumpur`;

    if (bookingChildSelect) {
      let selectedChild = children.find(child => child.id === state.bookingData.childId);
      if (!selectedChild) {
        selectedChild = children.find(child => child.name === state.bookingData.childName) || children[0];
        state.bookingData.childId = selectedChild.id;
        state.bookingData.childName = selectedChild.name;
        state.bookingData.child = selectedChild;
      }

      bookingChildSelect.innerHTML = children.map(child => {
        const ageLabel = child.displayAge || formatChildAge(child.birthDate);
        const isSelected = child.id === selectedChild.id ? 'selected' : '';
        return `<option value="${escapeHtml(child.id)}" ${isSelected}>${escapeHtml(child.name)} (${escapeHtml(ageLabel || child.gender)})</option>`;
      }).join('');

      updateBookingChildSummaryCard(selectedChild);

      bookingChildSelect.onchange = () => {
        const chosenId = bookingChildSelect.value;
        const chosenChild = children.find(child => child.id === chosenId) || children[0];
        if (chosenChild) {
          state.bookingData.childId = chosenChild.id;
          state.bookingData.childName = chosenChild.name;
          state.bookingData.child = chosenChild;
          if (hasChildren) state.child = chosenChild;
          updateBookingChildSummaryCard(chosenChild);
          saveState();
        }
      };
    }
    document.getElementById('bookingDateInput').value = state.bookingData.date || defaultBookingDateValue;
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
    if (Number.isNaN(birth.getTime())) return 0;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return Math.max(0, age);
  }

  const btnBookingAddChild = document.getElementById("btnBookingAddChild");
  if (btnBookingAddChild) {
    btnBookingAddChild.addEventListener("click", () => {
      state.bookingIntent = true;
      saveState();
      showScreen("addChild");
    });
  }

  function recalcBookingPrice() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const hoursSelect = document.getElementById('bookingHours');
    const trialOption = document.getElementById('bookingTrialOption');

    const hours = hoursSelect ? Number(hoursSelect.value) : 4;
    const isTrial = trialOption ? trialOption.checked : false;
    const rate = sitter.price;

    const baseSubtotal = hours * rate;
    const trialAmount = isTrial ? rate : 0;
    const subtotal = baseSubtotal + trialAmount;
    const fee = 5;
    const total = subtotal + fee;

    state.bookingData.hours = hours;
    state.bookingData.isTrial = isTrial;
    state.bookingData.rate = rate;
    state.bookingData.subtotal = subtotal;
    state.bookingData.fee = fee;
    state.bookingData.total = total;

    const priceBreakdownHours = document.getElementById('priceBreakdownHours');
    const priceBreakdownBase = document.getElementById('priceBreakdownBase');
    const priceBreakdownTrial = document.getElementById('priceBreakdownTrial');
    const priceBreakdownTrialAmount = document.getElementById('priceBreakdownTrialAmount');
    const priceBreakdownTotal = document.getElementById('priceBreakdownTotal');

    if (priceBreakdownHours) priceBreakdownHours.textContent = `${hours} hours × RM ${rate}/hr`;
    if (priceBreakdownBase) priceBreakdownBase.textContent = `RM ${baseSubtotal}`;
    if (priceBreakdownTrial) priceBreakdownTrial.hidden = !isTrial;
    if (priceBreakdownTrialAmount) priceBreakdownTrialAmount.textContent = `RM ${trialAmount}`;
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
      const bookingChildren = state.children.length ? state.children : sampleBookingChildren;
      const selectedChild = bookingChildren.find(child => child.id === selectedId) || bookingChildren[0] || state.child;

      if (selectedChild) {
        state.bookingData.childId = selectedChild.id;
        state.bookingData.childName = selectedChild.name;
        state.bookingData.child = selectedChild;
        if (state.children.length) state.child = selectedChild;
      }

      state.bookingData.date = document.getElementById('bookingDateInput').value || defaultBookingDateValue;
      state.bookingData.time = document.getElementById('bookingTimeStart').value || '14:00';
      state.bookingData.location = document.getElementById('bookingLocationInput').value || '50450 Kuala Lumpur';
      state.bookingData.specialReq = document.getElementById('bookingSpecialReq').value;
      state.bookingData.extraNotes = document.getElementById('bookingExtraNotes').value;

      if (!state.isLoggedIn || state.user.role !== 'parent') {
        state.bookingIntent = true;
        state.authReturnScreen = 'booking';
        saveState();
        if (state.isLoggedIn) {
          showToast('A parent account is required to send a booking request.');
          return;
        }
        setAuthMode('signup', 'parent');
        showScreen('auth');
        showToast('Create an account or log in to send your booking request.');
        return;
      }

      const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
      const bookingHours = state.bookingData.hours + (state.bookingData.isTrial ? 1 : 0);
      const [startHour, startMinute] = state.bookingData.time.split(':').map(Number);
      const end = new Date(2000, 0, 1, startHour, startMinute);
      end.setHours(end.getHours() + bookingHours);
      const newBooking = {
        id: generateBookingId(),
        babysitterId: state.selectedSitterId,
        babysitterName: sitter.name,
        date: state.bookingData.date,
        startTime: state.bookingData.time,
        endTime: `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`,
        location: state.bookingData.location,
        price: state.bookingData.total,
        child: state.bookingData.childName,
        status: 'waiting',
        baseHours: state.bookingData.hours,
        hours: bookingHours,
        isTrial: state.bookingData.isTrial,
        rate: state.bookingData.rate,
        subtotal: state.bookingData.subtotal,
        fee: state.bookingData.fee,
      };
      bookings.push(newBooking);
      state.activeBookingId = newBooking.id;
      state.bookingStatusState = 'waiting';
      saveBookings();
      saveState();

      showScreen('bookingStatus');
    });
  }

  // --------------------------------------------------------------------------
  // 15. Screen 11: Booking Status (3 States with Demo Switcher)
  // --------------------------------------------------------------------------
  function renderBookingStatus(statusState) {
    state.bookingStatusState = statusState;
    const activeBooking = getActiveBooking();
    if (!(statusState === 'declined' && activeBooking && activeBooking.status === 'cancelled')) {
      updateActiveBookingStatus(statusState);
    }
    saveState();

    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];

    const panelWaiting = document.getElementById('statusStateWaiting');
    const panelAccepted = document.getElementById('statusStateAccepted');
    const panelDeclined = document.getElementById('statusStateDeclined');

    const sitterNameWaiting = document.getElementById('statusSitterNameWaiting');
    const statusAcceptedHeadline = document.getElementById('statusAcceptedHeadline');
    const waitingDescription = document.querySelector('#statusStateWaiting .section-subtext');
    const statusSummarySitter = document.getElementById('statusSummarySitter');
    const statusSummaryDate = document.getElementById('statusSummaryDate');
    const statusSummaryTotal = document.getElementById('statusSummaryTotal');

    if (sitterNameWaiting) sitterNameWaiting.textContent = sitter.name;
    if (waitingDescription) waitingDescription.innerHTML = `Waiting for <strong id="statusSitterNameWaiting">${escapeHtml(sitter.name)}</strong> to accept your booking for ${escapeHtml(formatBookingDate(state.bookingData.date))}.`;
    if (statusSummarySitter) statusSummarySitter.textContent = sitter.name;
    if (statusSummaryDate) statusSummaryDate.textContent = formatBookingDate(state.bookingData.date);
    if (statusSummaryTotal) statusSummaryTotal.textContent = `RM ${state.bookingData.total || 105}`;
    if (statusAcceptedHeadline) statusAcceptedHeadline.textContent = `${sitter.name.split(' ')[0]} accepted.`;

    if (panelWaiting) panelWaiting.style.display = statusState === 'waiting' ? 'flex' : 'none';
    if (panelAccepted) panelAccepted.style.display = statusState === 'accepted' ? 'flex' : 'none';
    if (panelDeclined) panelDeclined.style.display = statusState === 'declined' ? 'flex' : 'none';
    if (statusState === 'accepted') setupPaymentScreen();

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
      showScreen('bookingStatus');
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
        updateActiveBookingStatus('cancelled');
        showToast('Booking request cancelled.');
        showScreen('find');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 16. Screen 12: Payment (First Attempt Fails, Second Succeeds)
  // --------------------------------------------------------------------------
  function setupPaymentScreen() {
    const totalAmountDisplay = document.querySelector('.payment-total-amount');
    const sitterSummaryDisplay = document.getElementById('paymentSitterSummary');
    const btnSubmitPayment = document.getElementById('btnSubmitPayment');
    const btnSimulatePaymentFailure = document.getElementById('btnSimulatePaymentFailure');
    const btnRetryPayment = document.getElementById('btnRetryPayment');
    const paymentErrorBox = document.getElementById('paymentErrorBox');

    const total = state.bookingData.total || 105;
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    if (totalAmountDisplay) totalAmountDisplay.textContent = `RM ${total}`;
    if (sitterSummaryDisplay) sitterSummaryDisplay.textContent = `${sitter.name} · ${formatBookingDate(state.bookingData.date)}`;
    if (btnSubmitPayment) {
      btnSubmitPayment.textContent = `Confirm & Pay RM ${total}`;
      btnSubmitPayment.style.display = 'block';
    }
    if (btnSimulatePaymentFailure) btnSimulatePaymentFailure.style.display = 'block';
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
    card.addEventListener('keydown', event => {
      if (event.target !== card) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        card.click();
      }
    });
  });

  const btnSubmitPayment = document.getElementById('btnSubmitPayment');
  const btnSimulatePaymentFailure = document.getElementById('btnSimulatePaymentFailure');
  const btnRetryPayment = document.getElementById('btnRetryPayment');
  const paymentErrorBox = document.getElementById('paymentErrorBox');

  if (btnSubmitPayment) {
    btnSubmitPayment.addEventListener('click', () => {
      state.paymentAttempts += 1;
      updateActiveBookingStatus('paid');
      showScreen('bookingConfirmed');
    });
  }

  if (btnSimulatePaymentFailure) {
    btnSimulatePaymentFailure.addEventListener('click', () => {
      state.paymentAttempts = 1;
      if (paymentErrorBox) paymentErrorBox.style.display = 'flex';
      if (btnSubmitPayment) btnSubmitPayment.style.display = 'none';
      if (btnSimulatePaymentFailure) btnSimulatePaymentFailure.style.display = 'none';
      if (btnRetryPayment) btnRetryPayment.style.display = 'block';
    });
  }

  if (btnRetryPayment) {
    btnRetryPayment.addEventListener('click', () => {
      if (paymentErrorBox) paymentErrorBox.style.display = 'none';
      if (btnRetryPayment) btnRetryPayment.style.display = 'none';
      if (btnSubmitPayment) btnSubmitPayment.style.display = 'block';
      if (btnSimulatePaymentFailure) btnSimulatePaymentFailure.style.display = 'block';
    });
  }

  // --------------------------------------------------------------------------
  // 17. Screen 13: Booking Confirmed
  // --------------------------------------------------------------------------
  function setupBookingConfirmed() {
    const sitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const activeBooking = getActiveBooking();
    if (activeBooking && activeBooking.status === 'paid') {
      activeBooking.status = 'confirmed';
      saveBookings();
    }
    const confirmedSitterName = document.getElementById('confirmedSitterName');
    const booking = state.bookingData;
    const confirmedMessage = document.getElementById('confirmedMessage');
    const confirmedDate = document.getElementById('confirmedDate');
    const confirmedTime = document.getElementById('confirmedTime');
    const confirmedChild = document.getElementById('confirmedChild');
    const confirmedBookingId = document.getElementById('confirmedBookingId');
    const confirmedStatus = document.getElementById('confirmedStatus');
    if (confirmedSitterName) confirmedSitterName.textContent = sitter.name;
    if (confirmedMessage) {
      confirmedMessage.textContent = activeBooking && activeBooking.status === 'completed'
        ? `Your booking with ${sitter.name} has been completed.`
        : `Your babysitter is locked in. We've notified ${sitter.name}.`;
    }
    if (confirmedDate) confirmedDate.textContent = formatBookingDate(booking.date);
    if (confirmedTime) confirmedTime.textContent = formatBookingTime(booking.time, booking.hours + (booking.isTrial ? 1 : 0));
    if (confirmedChild) confirmedChild.textContent = booking.childName || (state.child && state.child.name) || '';
    if (confirmedBookingId) confirmedBookingId.textContent = activeBooking ? activeBooking.id : 'BK001';
    const confirmedAmountPaid = document.getElementById('confirmedAmountPaid');
    if (confirmedAmountPaid) confirmedAmountPaid.textContent = `RM ${booking.total || 105}`;
    if (confirmedStatus) confirmedStatus.textContent = activeBooking
      ? activeBooking.status === 'confirmed' ? 'Confirmed' : activeBooking.status
      : '';
  }

  function formatBookingDate(dateValue) {
    if (!dateValue) dateValue = defaultBookingDateValue || getTodayDateValue();
    const date = new Date(`${dateValue}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getBookingStatusMarkup(status) {
    const labels = {
      waiting: 'Waiting',
      accepted: 'Accepted',
      declined: 'Declined',
      paid: 'Paid',
      confirmed: 'Confirmed',
      in_progress: 'In progress',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    const check = status === 'confirmed'
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '';
    return `<span class="booking-status-chip status-${status}">${check}${labels[status] || escapeHtml(status)}</span>`;
  }

  function getBookingAction(booking) {
    if (booking.status === 'waiting') return { label: 'View request', screen: 'bookingStatus' };
    if (booking.status === 'accepted') return { label: 'Pay now', screen: 'payment' };
    if (['declined', 'cancelled'].includes(booking.status)) return { label: 'View booking', screen: 'bookingStatus' };
    if (['confirmed', 'paid'].includes(booking.status)) return { label: 'Edit', screen: 'reschedule' };
    return { label: 'View booking', screen: 'bookingConfirmed' };
  }

  function renderBookingList(container, list, emptyMessage) {
    if (!container) return;
    if (!list.length) {
      container.innerHTML = `
        <div class="bookings-empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--deep-rose)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <line x1="16" y1="3" x2="16" y2="7"></line>
            <line x1="8" y1="3" x2="8" y2="7"></line>
            <line x1="3" y1="11" x2="21" y2="11"></line>
            <path d="m9 16 2 2 4-4"></path>
          </svg>
          <p class="bookings-empty-title">${emptyMessage}</p>
          <p class="bookings-empty-copy">Find a trusted babysitter and send your first request.</p>
          <button type="button" class="btn btn-primary booking-empty-find">Find a babysitter</button>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(booking => {
      const action = getBookingAction(booking);
      return `
        <article class="card booking-list-card">
          <div class="booking-list-details">
            <div class="booking-list-title-row">
              <h2 class="card-title">${escapeHtml(booking.babysitterName)}</h2>
              ${getBookingStatusMarkup(booking.status)}
            </div>
            <p class="booking-list-time">${escapeHtml(formatBookingDate(booking.date))} · ${escapeHtml(formatBookingTime(booking.startTime, booking.hours || 4))}</p>
            <p class="booking-list-meta">${escapeHtml(booking.child)} · ${escapeHtml(booking.location)}</p>
          </div>
          <div class="booking-list-action">
            <strong>RM ${escapeHtml(String(booking.price))}</strong>
            <button type="button" class="btn btn-secondary booking-card-action" data-booking-id="${escapeHtml(booking.id)}" data-booking-screen="${action.screen}">${action.label}</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderBookingsPage() {
    const bookingsList = document.getElementById('bookingsList');
    const upcomingButton = document.getElementById('btnUpcomingBookings');
    const pastButton = document.getElementById('btnPastBookings');
    const isUpcoming = activeBookingsTab === 'upcoming';
    if (upcomingButton) {
      upcomingButton.classList.toggle('active', isUpcoming);
      upcomingButton.setAttribute('aria-selected', String(isUpcoming));
    }
    if (pastButton) {
      pastButton.classList.toggle('active', !isUpcoming);
      pastButton.setAttribute('aria-selected', String(!isUpcoming));
    }
    renderBookingList(
      bookingsList,
      isUpcoming ? getUpcomingBookings() : getPastBookings(),
      isUpcoming ? 'No upcoming bookings yet.' : 'No past bookings yet.'
    );
  }

  function openBookingById(bookingId, targetScreen) {
    const booking = bookings.find(item => item.id === bookingId);
    if (!booking) return;
    syncBookingToState(booking);
    saveState();
    showScreen(targetScreen || getBookingAction(booking).screen);
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
      const date = booking.date || defaultBookingDateValue;
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
      showToast('Added to your calendar!');
    });
  }

  if (btnGoHome) {
    btnGoHome.addEventListener('click', () => {
      showScreen('parentHome');
    });
  }

  function setupRescheduleScreen() {
    const activeBooking = getActiveBooking() || getLatestBooking();
    const sitter = activeBooking
      ? sittersData[activeBooking.babysitterId] || sittersData[state.selectedSitterId] || sittersData['sarah-lim']
      : sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const date = activeBooking ? activeBooking.date : state.bookingData.date;
    const id = document.getElementById('rescheduleBookingId');
    const summary = document.getElementById('rescheduleBookingSummary');
    const dateInput = document.getElementById('rescheduleDate');
    const timeSelect = document.getElementById('rescheduleTime');

    if (id) id.textContent = activeBooking ? activeBooking.id : 'BK001';
    if (summary) summary.textContent = `${sitter.name} · ${formatBookingDate(date)}`;
    if (dateInput) dateInput.value = date || '2026-11-20';
    if (timeSelect) timeSelect.value = activeBooking ? activeBooking.startTime : state.bookingData.time || '14:00';
  }

  const rescheduleForm = document.getElementById('rescheduleForm');
  if (rescheduleForm) {
    rescheduleForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!rescheduleForm.reportValidity()) return;

      const newDate = document.getElementById('rescheduleDate').value;
      const newTime = document.getElementById('rescheduleTime').value;
      const activeBooking = getActiveBooking();
      const duration = activeBooking ? activeBooking.baseHours || activeBooking.hours || 4 : state.bookingData.hours || 4;
      const [hour, minute] = newTime.split(':').map(Number);
      const end = new Date(2000, 0, 1, hour, minute);
      end.setHours(end.getHours() + duration);

      state.bookingData.date = newDate;
      state.bookingData.time = newTime;
      if (activeBooking) {
        activeBooking.date = newDate;
        activeBooking.startTime = newTime;
        activeBooking.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
        saveBookings();
      }
      saveState();
      showToast('Booking updated successfully.');
      setupRescheduleScreen();
    });
  }

  const cancelBookingModal = document.getElementById('cancelBookingModal');
  const btnOpenCancelBooking = document.getElementById('btnOpenCancelBooking');
  const btnKeepBooking = document.getElementById('btnKeepBooking');
  const btnConfirmCancelBooking = document.getElementById('btnConfirmCancelBooking');

  if (btnOpenCancelBooking && cancelBookingModal) {
    btnOpenCancelBooking.addEventListener('click', () => {
      cancelBookingModal.hidden = false;
      btnKeepBooking?.focus();
    });
  }
  if (btnKeepBooking && cancelBookingModal) {
    btnKeepBooking.addEventListener('click', () => {
      cancelBookingModal.hidden = true;
      btnOpenCancelBooking?.focus();
    });
  }
  if (btnConfirmCancelBooking && cancelBookingModal) {
    btnConfirmCancelBooking.addEventListener('click', () => {
      updateActiveBookingStatus('cancelled');
      cancelBookingModal.hidden = true;
      showToast('Booking cancelled.');
      showScreen('parentHome');
    });
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && cancelBookingModal && !cancelBookingModal.hidden) {
      cancelBookingModal.hidden = true;
      btnOpenCancelBooking?.focus();
    }
  });

  // --------------------------------------------------------------------------
  // 18. Screen 14: Parent Home (Logged In Dashboard)
  // --------------------------------------------------------------------------
  function setupParentHome() {
    const greeting = document.getElementById('homeGreetingTitle');
    const homeChildName = document.getElementById('homeChildName');
    const activeChild = state.children.find(child => child.id === state.bookingData.childId) || state.child || state.children[0] || null;
    const activeChildName = activeChild && activeChild.name ? activeChild.name : "No child added";
    const homeNextBookingChild = document.getElementById("homeNextBookingChild");
    const homeChildDetails = document.getElementById('homeChildDetails');
    const homeChildSummary = document.getElementById('homeChildSummary');
    const homeBookingDate = document.getElementById('homeBookingDate');
    const homeBookingSitter = document.getElementById('homeBookingSitter');
    const homeBookingTime = document.getElementById('homeBookingTime');
    const homeBookingLocation = document.getElementById('homeBookingLocation');
    const homeBookingStatus = document.getElementById('homeBookingStatus');
    const homeBookingId = document.getElementById('homeBookingId');
    const homeNextBookingCard = document.getElementById('homeNextBookingCard');
    const homeNoBooking = document.getElementById('homeNoBooking');
    const homeRecentMsgName = document.getElementById('homeRecentMsgName');
    const homeBookAgainName = document.getElementById('homeBookAgainName');
    const bookingSitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];
    const nextBooking = getUpcomingBookings()[0] || bookings.find(booking =>
      booking.id === state.activeBookingId && ['waiting', 'accepted', 'paid', 'confirmed', 'in_progress'].includes(booking.status)
    ) || null;

    document.querySelectorAll('.home-sitter-card[data-sitter-id]').forEach(card => {
      const sitter = sittersData[card.dataset.sitterId];
      if (!sitter) return;
      const languages = card.querySelector('[data-sitter-languages]');
      const careTypeChips = card.querySelector('[data-care-types]');
      if (languages) languages.textContent = `Languages: ${sitter.languages}`;
      if (careTypeChips) careTypeChips.innerHTML = renderCareTypeChips(sitter);
    });

    const firstName = (state.user.name || 'Mei Ling').split(' ')[0];
    if (greeting) greeting.textContent = `Hello, ${firstName}`;
    if (homeChildName) homeChildName.textContent = activeChildName;
    if (homeChildDetails) homeChildDetails.textContent = `${getChildAge(activeChild && activeChild.birthDate)} years old • ${(activeChild && activeChild.gender) || ''}`;
    if (homeChildSummary) {
      homeChildSummary.textContent = `Allergies: ${(activeChild && activeChild.allergies) || 'Not added'} • Routine: ${(activeChild && activeChild.routine) || 'Not added'} • Emergency Contact: ${(activeChild && activeChild.emergencyName) || 'Not added'}`;
    }
    if (homeNextBookingCard) homeNextBookingCard.hidden = !nextBooking;
    if (homeNoBooking) homeNoBooking.hidden = Boolean(nextBooking);
    if (nextBooking) {
      if (homeBookingId) homeBookingId.textContent = `Booking ID: ${nextBooking.id}`;
      if (homeBookingDate) homeBookingDate.textContent = `Next Booking • ${formatBookingDate(nextBooking.date)}`;
      if (homeBookingSitter) homeBookingSitter.textContent = nextBooking.babysitterName;
      if (homeBookingTime) homeBookingTime.textContent = `${formatBookingTime(nextBooking.startTime, nextBooking.hours || 4)} • ${nextBooking.child}`;
      if (homeBookingLocation) homeBookingLocation.textContent = `📍 ${nextBooking.location}`;
      if (homeBookingStatus) homeBookingStatus.textContent = nextBooking.status === 'confirmed' ? 'Confirmed' : nextBooking.status;
      if (btnHomeViewDetails) btnHomeViewDetails.textContent = getBookingAction(nextBooking).label;
      if (btnHomeMessageSarah) btnHomeMessageSarah.textContent = `Message ${nextBooking.babysitterName.split(' ')[0]}`;
    }
    if (btnHomeManageBooking) {
      btnHomeManageBooking.hidden = !nextBooking || !['confirmed', 'paid'].includes(nextBooking.status);
      btnHomeManageBooking.textContent = 'Edit booking';
    }
    if (homeRecentMsgName) homeRecentMsgName.textContent = bookingSitter.name;
    if (homeBookAgainName) homeBookAgainName.textContent = bookingSitter.name;
    if (homeNextBookingChild) homeNextBookingChild.textContent = (nextBooking && nextBooking.child) || state.bookingData.childName || activeChildName;
  }

  const btnHomeViewDetails = document.getElementById('btnHomeViewDetails');
  const btnHomeManageBooking = document.getElementById('btnHomeManageBooking');
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
      const booking = getUpcomingBookings()[0] || getActiveBooking();
      if (booking) openBookingById(booking.id);
    });
  }

  if (btnHomeManageBooking) {
    btnHomeManageBooking.addEventListener('click', () => {
      showScreen('bookings');
    });
  }

  if (btnHomeMessageSarah) {
    btnHomeMessageSarah.addEventListener('click', () => {
      const booking = getUpcomingBookings()[0];
      if (booking && booking.babysitterId) state.selectedSitterId = booking.babysitterId;
      showScreen('chat');
    });
  }

  const btnHomeNoBookingFindSitter = document.getElementById('btnHomeNoBookingFindSitter');
  if (btnHomeNoBookingFindSitter) {
    btnHomeNoBookingFindSitter.addEventListener('click', () => showScreen('find'));
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
    const isBabysitter = state.user.role === 'babysitter';

    if (chatSitterName) chatSitterName.textContent = isBabysitter ? 'Mei Ling' : sitter.name;
    if (chatSitterAvatar) chatSitterAvatar.setAttribute('aria-label', `Photo placeholder for ${sitter.name}`);
    if (chatMessagesArea) {
      const ownRole = isBabysitter ? 'sitter' : 'parent';
      const otherRole = isBabysitter ? 'parent' : 'sitter';
      chatMessagesArea.innerHTML = `
        <div class="chat-message chat-msg-${ownRole}"><p>${isBabysitter ? 'Hello Mei Ling, I am ready for today’s session.' : 'Hello Sarah! How is Aiden doing?'}</p><span class="chat-time">Today</span></div>
        <div class="chat-message chat-msg-${otherRole}"><p>${isBabysitter ? 'Thank you. Aiden’s routine is in his profile.' : 'He is enjoying story time. I will keep you updated.'}</p><span class="chat-time">Today</span></div>
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

      const ownRole = state.user.role === 'babysitter' ? 'sitter' : 'parent';
      const otherRole = ownRole === 'sitter' ? 'parent' : 'sitter';
      const ownBubble = document.createElement('div');
      ownBubble.className = `chat-message chat-msg-${ownRole}`;
      ownBubble.innerHTML = `
        <p>${escapeHtml(text)}</p>
        <span class="chat-time">${timeStr}</span>
      `;
      chatMessagesArea.appendChild(ownBubble);
      chatInputText.value = '';
      chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;

      // Simulated auto-reply from sitter after 900ms
      setTimeout(() => {
        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const replyBubble = document.createElement('div');
        replyBubble.className = `chat-message chat-msg-${otherRole}`;
        replyBubble.innerHTML = `
          <p>Thanks for your message! Looking forward to our session.</p>
          <span class="chat-time">${replyTime}</span>
        `;
        chatMessagesArea.appendChild(replyBubble);
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

  const btnUpcomingBookings = document.getElementById('btnUpcomingBookings');
  const btnPastBookings = document.getElementById('btnPastBookings');
  const bookingsList = document.getElementById('bookingsList');
  const parentProfileBookingHistory = document.getElementById('parentProfileBookingHistory');

  if (btnUpcomingBookings) {
    btnUpcomingBookings.addEventListener('click', () => {
      activeBookingsTab = 'upcoming';
      renderBookingsPage();
    });
  }

  if (btnPastBookings) {
    btnPastBookings.addEventListener('click', () => {
      activeBookingsTab = 'past';
      renderBookingsPage();
    });
  }

  function handleBookingListClick(event) {
    if (event.target.closest('.booking-empty-find')) {
      showScreen('find');
      return;
    }
    const action = event.target.closest('.booking-card-action');
    if (action) openBookingById(action.dataset.bookingId, action.dataset.bookingScreen);
  }

  if (bookingsList) bookingsList.addEventListener('click', handleBookingListClick);
  if (parentProfileBookingHistory) parentProfileBookingHistory.addEventListener('click', handleBookingListClick);

  // --------------------------------------------------------------------------
  // 20B. Screen 16: Parent Profile
  // --------------------------------------------------------------------------
  function getInitials(name) {
    if (!name) return 'P';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }

  function clearParentProfileErrors() {
    ['parentProfileName', 'parentProfileDob', 'parentProfilePhone', 'parentProfileEmail'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('input-error');
    });
    ['errorParentProfileName', 'errorParentProfileDob', 'errorParentProfilePhone', 'errorParentProfileEmail'].forEach(id => {
      const err = document.getElementById(id);
      if (err) err.style.display = 'none';
    });
    const errorAlert = document.getElementById('parentProfileErrorAlert');
    if (errorAlert) errorAlert.style.display = 'none';
  }

  function setupParentProfile() {
    const nameInput = document.getElementById('parentProfileName');
    const dobInput = document.getElementById('parentProfileDob');
    const phoneInput = document.getElementById('parentProfilePhone');
    const emailInput = document.getElementById('parentProfileEmail');
    const numChildrenInput = document.getElementById('parentProfileNumChildren');
    const displayName = document.getElementById('parentProfileDisplayName');
    const avatarInitials = document.getElementById('parentProfileAvatarInitials');
    const emailDisplay = document.getElementById('parentProfileEmailDisplay');
    const successAlert = document.getElementById('parentProfileSuccessAlert');
    const errorAlert = document.getElementById('parentProfileErrorAlert');

    state.user.email = state.user.email || 'jessica@example.com';
    state.user.dob = state.user.dob || '1992-08-14';
    syncChildCount();

    if (displayName) displayName.textContent = state.user.name;
    if (avatarInitials) avatarInitials.textContent = getInitials(state.user.name);
    if (emailDisplay) emailDisplay.textContent = state.user.email;

    if (nameInput) nameInput.value = state.user.name;
    if (dobInput) dobInput.value = state.user.dob;
    if (phoneInput) phoneInput.value = state.user.phone;
    if (emailInput) emailInput.value = state.user.email;
    if (numChildrenInput) numChildrenInput.value = String(state.children.length);

    if (successAlert) successAlert.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';
    clearParentProfileErrors();

    const historyEl = document.getElementById('parentProfileBookingHistory');
    if (historyEl && typeof renderBookingList === 'function' && Array.isArray(bookings)) {
      renderBookingList(historyEl, bookings.slice().reverse(), 'No past bookings yet.');
    }
    renderSavedChildrenList();
  }

  // Clear validation error on typing
  ['parentProfileName', 'parentProfileDob', 'parentProfilePhone', 'parentProfileEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const clearFieldError = () => {
        el.classList.remove('input-error');
        const errId = `error${id.charAt(0).toUpperCase() + id.slice(1)}`;
        const err = document.getElementById(errId);
        if (err) err.style.display = 'none';
        const errorAlert = document.getElementById('parentProfileErrorAlert');
        if (errorAlert) errorAlert.style.display = 'none';
      };
      el.addEventListener('input', clearFieldError);
      el.addEventListener('change', clearFieldError);
    }
  });

  const parentProfileForm = document.getElementById('parentProfileForm');
  if (parentProfileForm) {
    parentProfileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      clearParentProfileErrors();

      const nameInput = document.getElementById('parentProfileName');
      const dobInput = document.getElementById('parentProfileDob');
      const phoneInput = document.getElementById('parentProfilePhone');
      const emailInput = document.getElementById('parentProfileEmail');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const dobVal = dobInput ? dobInput.value : '';
      const phoneVal = phoneInput ? phoneInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      let hasError = false;

      // Validate Full Name
      if (!nameVal || nameVal.length < 2) {
        if (nameInput) nameInput.classList.add('input-error');
        const err = document.getElementById('errorParentProfileName');
        if (err) err.style.display = 'flex';
        hasError = true;
      }

      // Validate Date of Birth
      if (!dobVal) {
        if (dobInput) dobInput.classList.add('input-error');
        const err = document.getElementById('errorParentProfileDob');
        if (err) {
          err.querySelector('span') ? null : null;
          err.style.display = 'flex';
        }
        hasError = true;
      } else {
        const birthDate = new Date(dobVal);
        const today = new Date();
        if (isNaN(birthDate.getTime()) || birthDate >= today) {
          if (dobInput) dobInput.classList.add('input-error');
          const err = document.getElementById('errorParentProfileDob');
          if (err) err.style.display = 'flex';
          hasError = true;
        }
      }

      // Validate Phone Number
      const phoneRegex = /^(?:\+?60|0)[0-9\s-]{8,12}$/;
      if (!phoneVal || !phoneRegex.test(phoneVal)) {
        if (phoneInput) phoneInput.classList.add('input-error');
        const err = document.getElementById('errorParentProfilePhone');
        if (err) err.style.display = 'flex';
        hasError = true;
      }

      // Validate Email Address
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailVal || !emailRegex.test(emailVal)) {
        if (emailInput) emailInput.classList.add('input-error');
        const err = document.getElementById('errorParentProfileEmail');
        if (err) err.style.display = 'flex';
        hasError = true;
      }

      if (hasError) {
        const errorAlert = document.getElementById('parentProfileErrorAlert');
        if (errorAlert) errorAlert.style.display = 'flex';
        const successAlert = document.getElementById('parentProfileSuccessAlert');
        if (successAlert) successAlert.style.display = 'none';
        return;
      }

      // Save changes to state
      state.user.name = nameVal;
      state.user.dob = dobVal;
      state.user.phone = phoneVal;
      state.user.email = emailVal;
      saveState();

      // Update Parent Profile Header
      const displayName = document.getElementById('parentProfileDisplayName');
      const avatarInitials = document.getElementById('parentProfileAvatarInitials');
      const emailDisplay = document.getElementById('parentProfileEmailDisplay');
      if (displayName) displayName.textContent = nameVal;
      if (avatarInitials) avatarInitials.textContent = getInitials(nameVal);
      if (emailDisplay) emailDisplay.textContent = emailVal;

      // Update Parent Home Greeting if it exists
      const homeGreeting = document.getElementById('homeGreetingTitle');
      if (homeGreeting) {
        const firstName = nameVal.split(' ')[0];
        homeGreeting.textContent = `Welcome back, ${firstName}`;
      }

      // Show success alert and toast
      const successAlert = document.getElementById('parentProfileSuccessAlert');
      if (successAlert) successAlert.style.display = 'flex';
      const errorAlert = document.getElementById('parentProfileErrorAlert');
      if (errorAlert) errorAlert.style.display = 'none';

      showToast('Profile updated successfully!');
    });
  }

  // Log Out Button
  const btnParentLogout = document.getElementById('btnParentLogout');
  if (btnParentLogout) {
    btnParentLogout.addEventListener('click', () => {
      setLoggedIn(false);
      state.authReturnScreen = 'welcome';
      state.bookingIntent = false;
      saveState();

      if (topbarLoginBtn) topbarLoginBtn.style.display = '';
      if (topbarGetStartedBtn) topbarGetStartedBtn.style.display = '';

      navBackBtn.style.display = 'none';
      hamburgerBtn.style.display = 'flex';

      showScreen('welcome');
      showToast('Logged out successfully');
    });
  }

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
  updateAuthIntentMessage();
  const hash = window.location.hash.replace('#/', '');
  if (hash && screens[hash]) {
    showScreen(hash);
  } else {
    showScreen('welcome');
  }

  // Handle browser native Back/Forward buttons
  window.addEventListener('hashchange', () => {
    const h = window.location.hash.replace('#/', '');
    const target = h && screens[h] ? h : 'welcome';
    if (target !== currentScreen) {
      showScreen(target);
    }
  });
});
