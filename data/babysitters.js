export const postcodeLocations = {
  '50450': { area: 'Kuala Lumpur city centre', latitude: 3.159, longitude: 101.716 },
  '59000': { area: 'Bangsar', latitude: 3.130, longitude: 101.671 },
  '50480': { area: 'Mont Kiara', latitude: 3.171, longitude: 101.651 },
  '58000': { area: 'Brickfields', latitude: 3.133, longitude: 101.686 },
  '53300': { area: 'Setapak', latitude: 3.200, longitude: 101.720 },
  '47301': { area: 'Petaling Jaya', latitude: 3.107, longitude: 101.607 },
};

export const careTypeLabels = ['Full day', 'Half day', 'Live-in'];

export const babysittersData = {
  'sarah-lim': {
    id: 'sarah-lim',
    name: 'Sarah Lim',
    postcode: '59000',
    area: 'Bangsar',
    travelKm: 10,
    age: 28,
    exp: '5 years',
    languages: 'English and Mandarin',
    rating: '4.9 (126 reviews)',
    ratingValue: 4.9,
    reviewsCount: 126,
    price: 25,
    rateText: 'RM 25',
    cpr: true,
    firstAid: true,
    newborn: true,
    specialNeeds: false,
    verifiedIdAndBackground: true,
    careTypes: ['Full day', 'Half day', 'Live-in'],
    ageGroups: ['newborn', 'toddler', 'preschool', 'school-age'],
    degree: 'Diploma in Early Childhood Education',
    school: 'Sunway College',
    bio: 'Calm, kind, and experienced in caring for young children.',
    certs: [
      { name: 'CPR', expiry: 'Expires 2027' },
      { name: 'Infant care course', expiry: 'Expires 2027' },
    ],
    reviews: [
      { stars: '5.0', text: 'Calm and kind with our toddler.', author: 'Parent review' },
      { stars: '5.0', text: 'Always on time and very careful.', author: 'Parent review' },
    ],
    availability: [
      { day: 'Weekdays', times: 'Available on weekdays', startTime: '09:00', endTime: '17:00' },
      { day: 'Saturday', times: 'Available on Saturday', startTime: '09:00', endTime: '17:00' },
    ],
  },
  'nur-ain': {
    id: 'nur-ain',
    name: 'Nur Ain',
    postcode: '50480',
    area: 'Mont Kiara',
    travelKm: 5,
    age: 31,
    exp: '4 years',
    languages: 'Malay and English',
    rating: '4.8 (84 reviews)',
    ratingValue: 4.8,
    reviewsCount: 84,
    price: 22,
    rateText: 'RM 22',
    cpr: true,
    firstAid: false,
    newborn: false,
    specialNeeds: true,
    verifiedIdAndBackground: true,
    careTypes: ['Full day', 'Half day'],
    ageGroups: ['toddler', 'preschool', 'school-age'],
    degree: 'Diploma in Child Development',
    school: "Taylor's College",
    bio: 'A dependable babysitter with four years of childcare experience.',
    certs: [
      { name: 'CPR', expiry: 'Expires 2027' },
    ],
    reviews: [],
    availability: [
      { day: 'Weekdays', times: 'Available on weekdays', startTime: '09:00', endTime: '18:00' },
    ],
  },
  aisyah: {
    id: 'aisyah',
    name: 'Aisyah',
    postcode: '58000',
    area: 'Brickfields',
    travelKm: 20,
    age: 24,
    exp: '2 years',
    languages: 'Malay and English',
    rating: '4.7 (51 reviews)',
    ratingValue: 4.7,
    reviewsCount: 51,
    price: 20,
    rateText: 'RM 20',
    cpr: false,
    firstAid: true,
    newborn: false,
    specialNeeds: false,
    verifiedIdAndBackground: true,
    careTypes: ['Half day'],
    ageGroups: ['toddler', 'preschool', 'school-age'],
    degree: 'Certificate in Childcare',
    school: 'KDU College',
    bio: 'A friendly babysitter with two years of childcare experience.',
    certs: [
      { name: 'First aid', expiry: 'Expires 2026' },
    ],
    reviews: [],
    availability: [
      { day: 'Weekends', times: 'Available on weekends', startTime: '10:00', endTime: '18:00' },
    ],
  },
  'mei-chen': {
    id: 'mei-chen',
    name: 'Mei Chen',
    postcode: '53300',
    area: 'Setapak',
    travelKm: 10,
    age: 29,
    exp: '3 years',
    languages: 'English and Mandarin',
    rating: '4.8 (62 reviews)',
    ratingValue: 4.8,
    reviewsCount: 62,
    price: 24,
    rateText: 'RM 24',
    cpr: true,
    firstAid: false,
    newborn: true,
    specialNeeds: false,
    verifiedIdAndBackground: true,
    careTypes: ['Full day', 'Live-in'],
    ageGroups: ['newborn', 'toddler', 'preschool'],
    degree: 'Diploma in Early Childhood Education',
    school: 'Tunku Abdul Rahman University of Management and Technology',
    bio: 'A patient babysitter with three years of experience caring for infants and toddlers.',
    certs: [
      { name: 'CPR', expiry: 'Expires 2027' },
      { name: 'Infant care course', expiry: 'Expires 2027' },
    ],
    reviews: [],
    availability: [
      { day: 'Weekdays', times: 'Available on weekdays', startTime: '08:00', endTime: '16:00' },
      { day: 'Weekends', times: 'Available on weekends', startTime: '10:00', endTime: '18:00' },
    ],
  },
  'kavitha-rao': {
    id: 'kavitha-rao',
    name: 'Kavitha Rao',
    postcode: '47301',
    area: 'Petaling Jaya',
    travelKm: 20,
    age: 32,
    exp: '6 years',
    languages: 'English and Tamil',
    rating: '4.7 (39 reviews)',
    ratingValue: 4.7,
    reviewsCount: 39,
    price: 21,
    rateText: 'RM 21',
    cpr: true,
    firstAid: true,
    newborn: false,
    specialNeeds: false,
    verifiedIdAndBackground: true,
    careTypes: ['Half day', 'Full day'],
    ageGroups: ['toddler', 'preschool', 'school-age'],
    degree: 'Certificate in Early Childhood Care',
    school: 'SEGi College',
    bio: 'A reliable babysitter who enjoys creative play and supporting school-age children.',
    certs: [
      { name: 'First aid', expiry: 'Expires 2027' },
    ],
    reviews: [],
    availability: [
      { day: 'Weekdays', times: 'Available on weekdays', startTime: '10:00', endTime: '18:00' },
      { day: 'Saturday', times: 'Available on Saturday', startTime: '09:00', endTime: '17:00' },
    ],
  },
};

function calculateDistanceKm(parentPostcode, sitterPostcode) {
  const origin = postcodeLocations[String(parentPostcode || '').trim()];
  const destination = postcodeLocations[String(sitterPostcode || '').trim()];
  if (!origin || !destination) return null;

  const toRadians = degrees => degrees * Math.PI / 180;
  const latitudeDifference = toRadians(destination.latitude - origin.latitude);
  const longitudeDifference = toRadians(destination.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) *
    Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function dateMatchesAvailabilityDay(date, day) {
  const weekday = date.getDay();
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  if (day === dayName) return true;
  if (day === 'Weekdays') return weekday >= 1 && weekday <= 5;
  if (day === 'Weekends') return weekday === 0 || weekday === 6;
  return false;
}

function availabilityMatches(sitter, filter) {
  if (!filter) return true;

  const availability = typeof filter === 'string' ? { day: filter } : filter;
  const requestedTime = availability.time || '';
  let requestedDates = [];

  if (availability.date) {
    const date = new Date(`${availability.date}T00:00:00`);
    if (!Number.isNaN(date.getTime())) requestedDates = [date];
  } else if (availability.when === 'Today') {
    requestedDates = [new Date()];
  } else if (availability.when === 'This week') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    requestedDates = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(start);
      date.setDate(date.getDate() + offset);
      return date;
    });
  } else if ((availability.when === 'Pick a date' || availability.when === 'Custom date') && availability.customDate) {
    const date = new Date(`${availability.customDate}T00:00:00`);
    if (!Number.isNaN(date.getTime())) requestedDates = [date];
  }

  const requestedDays = [
    ...(availability.day ? [availability.day] : []),
    ...(Array.isArray(availability.days) ? availability.days : []),
  ];
  if (!requestedDates.length && !requestedDays.length) return false;

  let requestedMinutes = null;
  if (requestedTime) {
    if (!/^\d{2}:\d{2}$/.test(requestedTime)) return false;
    const [hour, minute] = requestedTime.split(':').map(Number);
    if (hour > 23 || minute > 59) return false;
    requestedMinutes = hour * 60 + minute;
  }

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const weekendDays = ['Saturday', 'Sunday'];
  return (sitter.availability || []).some(slot => {
    const matchesDay = requestedDates.some(date => dateMatchesAvailabilityDay(date, slot.day)) ||
      requestedDays.some(day => {
        if (day === slot.day) return true;
        if (day === 'Weekdays') return slot.day === 'Weekdays' || weekdays.includes(slot.day);
        if (day === 'Weekends') return slot.day === 'Weekends' || weekendDays.includes(slot.day);
        if (slot.day === 'Weekdays') return weekdays.includes(day);
        if (slot.day === 'Weekends') return weekendDays.includes(day);
        return false;
      });
    if (!matchesDay) return false;
    if (requestedMinutes === null) return true;

    const [startHour, startMinute] = (slot.startTime || '').split(':').map(Number);
    const [endHour, endMinute] = (slot.endTime || '').split(':').map(Number);
    if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return false;
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    return requestedMinutes >= startMinutes && requestedMinutes < endMinutes;
  });
}

export function getMatchingSitters(filters = {}) {
  const minRating = Number(filters.minRating) || 0;
  const maxPrice = Number(filters.maxPrice) || 0;
  const maxDistance = Number(filters.maxDistance) || 0;
  const careType = String(filters.careType || '');

  return Object.values(babysittersData)
    .map((sitter, order) => ({
      ...sitter,
      distanceKm: calculateDistanceKm(filters.postcode, sitter.postcode),
      order,
    }))
    .filter(sitter =>
      sitter.ratingValue >= minRating &&
      (!maxPrice || sitter.price <= maxPrice) &&
      (!maxDistance || (sitter.distanceKm !== null && sitter.distanceKm <= maxDistance)) &&
      (!careType || (sitter.careTypes || []).includes(careType)) &&
      availabilityMatches(sitter, filters.availability)
    )
    .sort((a, b) =>
      b.ratingValue - a.ratingValue ||
      (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY) ||
      a.price - b.price ||
      a.order - b.order
    )
    .map(({ order, ...sitter }) => sitter);
}
