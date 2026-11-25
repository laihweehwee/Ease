const app = document.getElementById('appContainer');
const pageSpecs = {
  sitterQ1: ['Babysitter profile · 1 of 5', 'Where do you provide care?', '<label class="role-label" for="sitterPostcode">Postcode</label><input id="sitterPostcode" class="input-field" inputmode="numeric" maxlength="5" value="50450"><label class="role-label" for="sitterRadius">Travel radius</label><select id="sitterRadius" class="input-field"><option>5 km</option><option selected>10 km</option><option>20 km</option></select>', 'Continue'],
  sitterQ2: ['Babysitter profile · 2 of 5', 'Your experience and age groups', '<label class="role-label" for="sitterExperience">Years of experience</label><select id="sitterExperience" class="input-field"><option>New to childcare</option><option selected>3–5 years</option><option>6–10 years</option><option>10+ years</option></select><fieldset class="role-fieldset"><legend>Age groups you support</legend><label><input type="checkbox" name="ageGroup" value="Baby"> Baby</label><label><input type="checkbox" name="ageGroup" value="Toddler"> Toddler</label><label><input type="checkbox" name="ageGroup" value="School age"> School age</label></fieldset>', 'Continue'],
  sitterQ3: ['Babysitter profile · 3 of 5', 'Care you can offer', '<fieldset class="role-fieldset"><legend>Care types</legend><label><input type="checkbox" name="careType" value="Live-in"> Live-in</label><label><input type="checkbox" name="careType" value="Full day"> Full day</label><label><input type="checkbox" name="careType" value="Half day"> Half day</label><label><input type="checkbox" name="careType" value="One-time"> One-time</label><label><input type="checkbox" name="careType" value="Recurring"> Recurring</label></fieldset><label class="role-label"><input id="sitterOvernight" type="checkbox"> Available overnight</label><label class="role-label" for="sitterAvailability">Weekly availability</label><input id="sitterAvailability" class="input-field" placeholder="e.g. Mon–Fri, 9 AM–5 PM">', 'Continue'],
  sitterQ4: ['Babysitter profile · 4 of 5', 'Set your hourly rate', '<label class="role-label" for="sitterRate">Hourly rate (RM)</label><input id="sitterRate" class="input-field" type="number" min="10" max="200" value="25"><div class="role-note">Average nearby: RM 22–28/hr</div>', 'Continue'],
  sitterQ5: ['Babysitter profile · 5 of 5', 'Tell families about yourself', '<label class="role-label" for="sitterLanguages">Languages spoken</label><input id="sitterLanguages" class="input-field" placeholder="English, Bahasa Melayu"><label class="role-label" for="sitterPhoto">Profile photo</label><input id="sitterPhoto" class="input-field" type="file" accept="image/*"><label class="role-label" for="sitterBio">Short bio</label><textarea id="sitterBio" class="input-field role-textarea" maxlength="300" placeholder="Share your approach to safe, caring childcare."></textarea>', 'Preview profile'],
  sitterPreview: ['Profile preview', 'Your parent-facing profile', '<div id="sitterPreviewCard" class="role-preview-card"></div><div class="role-note">Your Verified badge will appear once Admin approves your documents.</div>', 'Create account to submit'],
  sitterDocuments: ['Documents & bank details', 'Submit your application', '<p class="role-copy">Upload clear documents. Your profile stays private while the team reviews your application.</p><div class="role-upload-grid"><label>Government ID (MyKad / Passport)<input type="file" data-document="Government ID" accept="image/*,.pdf"></label><label>CPR / First Aid Certificate<input type="file" data-document="CPR / First Aid" accept="image/*,.pdf"></label><label>Childcare Certificates<input type="file" data-document="Childcare certificates" accept="image/*,.pdf"></label><label>Education Proof<input type="file" data-document="Education proof" accept="image/*,.pdf"></label></div><h3 class="card-title">Bank account for payouts</h3><label class="role-label" for="bankName">Bank name</label><select id="bankName" class="input-field"><option>Maybank</option><option>CIMB</option><option>Public Bank</option><option>RHB</option><option>Hong Leong</option><option>Bank Islam</option></select><label class="role-label" for="bankHolder">Account holder name</label><input id="bankHolder" class="input-field" required><label class="role-label" for="bankAccount">Account number</label><input id="bankAccount" class="input-field" inputmode="numeric" minlength="8" required><p class="role-note">Your ID and bank details are encrypted and used only for verification and payouts.</p>', 'Submit for review'],
  sitterApplication: ['Application status', 'Your verification progress', '<div id="applicationStepper" class="role-stepper"></div><p id="applicationStatusText" class="role-copy"></p><p id="applicationFeedback" class="role-note" hidden></p><div class="role-actions"><button class="btn btn-primary" data-role-route="sitterDocuments" id="fixApplication" hidden>Fix and submit again</button><button class="btn btn-secondary" data-role-route="sitterHome">Continue to dashboard</button></div><p class="role-copy">Your profile remains hidden from parents until approved.</p>', ''],
  sitterHome: ['Babysitter Home', 'Welcome to your Ease dashboard', '<div class="role-grid"><article class="card"><h2 class="card-title">Verification status</h2><p id="sitterHomeVerification"></p><button class="btn btn-secondary" data-role-route="sitterApplication">View application</button></article><article class="card"><h2 class="card-title">Available jobs</h2><p><strong id="sitterJobCount">2</strong> nearby booking requests</p><button class="btn btn-primary" data-role-route="availableJobs">Browse jobs</button></article><article class="card"><h2 class="card-title">Upcoming sessions</h2><p id="sitterUpcomingSummary">Your accepted jobs appear in your schedule.</p><button class="btn btn-secondary" data-role-route="sitterSchedule">Open schedule</button></article><article class="card"><h2 class="card-title">Earnings this month</h2><p id="sitterHomeEarnings">RM 0</p><button class="btn btn-secondary" data-role-route="sitterEarnings">View earnings</button></article></div>', ''],
  sitterSchedule: ['Schedule', 'Your accepted sessions', '<div class="role-calendar-controls"><button class="btn btn-secondary" data-calendar-step="-1" aria-label="Previous period">←</button><h2 id="calendarMonthTitle"></h2><button class="btn btn-secondary" data-calendar-step="1" aria-label="Next period">→</button><button class="btn btn-secondary" id="calendarToday">Today</button><button class="btn btn-secondary" id="calendarViewToggle">Week view</button></div><div id="scheduleCalendar" class="role-calendar"></div><h2 class="section-heading">Your sessions</h2><div id="scheduleEvents" class="role-list"></div>', ''],
  sitterEarnings: ['Earnings', 'Payouts through Ease escrow', '<div class="role-grid role-earnings-grid"><article class="card"><span>This month total</span><strong id="earningsMonth">RM 0</strong></article><article class="card"><span>Pending in escrow</span><strong id="earningsPending">RM 0</strong></article><article class="card"><span>Paid out</span><strong id="earningsPaid">RM 0</strong></article></div><h2 class="section-heading">Transaction history</h2><div id="earningsHistory" class="role-list"></div>', ''],
  adminLogin: ['Admin access', 'Ease operations dashboard', '<p class="role-copy">Demo credentials are prefilled. This is a local prototype login.</p><label class="role-label" for="adminEmail">Email</label><input id="adminEmail" class="input-field" type="email" value="admin@ease.my"><label class="role-label" for="adminPassword">Password</label><input id="adminPassword" class="input-field" type="password" value="admin123"><p id="adminLoginError" class="role-error" hidden>Check the demo email and password.</p>', 'Log in as Admin'],
  adminDashboard: ['Admin Dashboard', 'Review applications, payouts and reports', '<div class="role-tabs" role="tablist"><button class="btn btn-secondary active" data-admin-tab="applications">Babysitter applications</button><button class="btn btn-secondary" data-admin-tab="payouts">Payout management</button><button class="btn btn-secondary" data-admin-tab="reports">Reports & SOS</button></div><section id="adminApplicationsPanel"></section><section id="adminPayoutsPanel" hidden></section><section id="adminReportsPanel" hidden></section>', ''],
  adminReview: ['Application review', 'Verify documents and applicant details', '<div id="adminReviewContent" class="role-review-grid"></div><label class="role-label" for="adminReviewNote">Admin note</label><textarea id="adminReviewNote" class="input-field role-textarea" placeholder="Required for rejection or more information."></textarea><div class="role-actions"><button class="btn btn-primary" data-review-action="approve">Approve</button><button class="btn btn-secondary" data-review-action="needs-info">Request more info</button><button class="btn btn-cancel-outline" data-review-action="reject">Reject</button></div><p id="adminAuditLog" class="role-copy"></p>', ''],
};

const routeIds = Object.keys(pageSpecs);
const routeElements = {};
const encode = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const localRead = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const platform = localRead('ease_role_platform', {
  sitter: { postcode: '50450', radius: '10 km', experience: '3–5 years', ages: [], care: [], overnight: false, availability: '', rate: 25, languages: 'English, Bahasa Melayu', bio: '', photo: '', documents: {}, bankName: 'Maybank', bankHolder: '', bankAccount: '', status: 'not_started', feedback: '', reviewedAt: '' },
  applications: [{
    id: 'APP-DEMO',
    name: 'Amira Hassan',
    email: 'amira@example.com',
    phone: '012-3456789',
    status: 'in_review',
    documents: { 'Government ID': 'MyKad-Amira-demo.pdf', 'CPR / First Aid': 'CPR-certificate-demo.pdf', 'Childcare certificates': 'Childcare-certificate-demo.pdf', 'Education proof': 'Education-proof-demo.pdf' },
    bankName: 'Maybank',
    bankHolder: 'Amira Hassan',
    bankAccount: '•••• 2345',
    bio: 'A caring, CPR-trained babysitter with toddler and newborn experience.',
    rate: 25,
    experience: '3–5 years',
    reviewedAt: '',
  }],
  reports: [],
  payouts: [{ id: 'PAY-001', sitter: 'Sarah Lim', amount: 105, status: 'Processing', date: '20 Nov 2026' }, { id: 'PAY-002', sitter: 'Nur Ain', amount: 88, status: 'Paid to Bank', date: '18 Nov 2026' }],
  messages: [],
  sosAlerts: [],
});
platform.sitter ||= { postcode: '50450', radius: '10 km', experience: '3–5 years', ages: [], care: [], overnight: false, availability: '', rate: 25, languages: '', bio: '', photo: '', documents: {}, bankName: 'Maybank', bankHolder: '', bankAccount: '', status: 'not_started', feedback: '', reviewedAt: '' };
platform.sitter.documents ||= {};
platform.applications = Array.isArray(platform.applications) ? platform.applications : [];
platform.reports = Array.isArray(platform.reports) ? platform.reports : [];
platform.payouts = Array.isArray(platform.payouts) ? platform.payouts : [];
platform.sosAlerts = Array.isArray(platform.sosAlerts) ? platform.sosAlerts : [];
let applicationId = platform.applicationId || null;
let reviewApplicationId = null;
let selectedSessionId = null;
let calendarCursor = new Date();
calendarCursor.setDate(1);
let calendarView = 'month';
let currentRoute = 'welcome';

function savePlatform() {
  try {
    localStorage.setItem('ease_role_platform', JSON.stringify(platform));
  } catch (error) {
    console.error('Could not save Ease role data', error);
    window.easeApp?.toast('Could not save changes on this device.');
  }
}

function syncDesktopSidebar(current = session()) {
  const desktopMember = current.isLoggedIn && ['parent', 'babysitter', 'admin'].includes(current.role) && !['welcome', 'auth', 'verify'].includes(currentRoute);
  const desktopSidebar = desktopMember && window.innerWidth >= 1024;
  document.body.classList.toggle('role-desktop-sidebar', desktopSidebar);
  const drawer = document.getElementById('navDrawer');
  if (drawer && desktopSidebar) {
    drawer.inert = false;
    drawer.setAttribute('aria-hidden', 'false');
  } else if (drawer && !drawer.classList.contains('active')) {
    drawer.inert = true;
    drawer.setAttribute('aria-hidden', 'true');
  }
}

function session() {
  return window.easeApp?.getSession() || {
    isLoggedIn: localStorage.getItem('easeLoggedIn') === 'true',
    role: localRead('ease_state', {}).user?.role || 'parent',
    user: localRead('ease_state', {}).user || {},
  };
}

function navigate(screen) {
  if (window.easeApp?.navigate) window.easeApp.navigate(screen);
  else window.location.hash = `#/${screen}`;
}

function makeRouteScreen(id, spec) {
  const [eyebrow, title, content, action] = spec;
  const section = document.createElement('section');
  section.className = 'app-screen role-app-screen';
  section.id = `screen${id[0].toUpperCase()}${id.slice(1)}`;
  section.style.display = 'none';
  section.innerHTML = `
    <div class="role-page">
      <header class="role-page-heading"><p class="role-eyebrow">${eyebrow}</p><h1>${title}</h1></header>
      <div class="role-panel">${content}${action ? `<button type="button" class="btn btn-primary full-width role-primary-action" data-role-primary="${id}">${action}</button>` : ''}</div>
    </div>`;
  app.appendChild(section);
  return section;
}

routeIds.forEach(id => { routeElements[id] = makeRouteScreen(id, pageSpecs[id]); });
window.easeAdditionalScreens = Object.fromEntries(routeIds.map(id => [id, routeElements[id]]));

function ensureLayer(id, className) {
  let layer = document.getElementById(id);
  if (!layer) {
    layer = document.createElement('div');
    layer.id = id;
    layer.className = className;
    layer.hidden = true;
    document.body.appendChild(layer);
  }
  return layer;
}

const reportModal = ensureLayer('roleReportModal', 'role-modal-layer');
reportModal.innerHTML = `<section class="role-modal-card" role="dialog" aria-modal="true" aria-labelledby="reportModalTitle"><button class="role-modal-close" data-close-layer aria-label="Close">×</button><p class="role-eyebrow">Ease support</p><h2 id="reportModalTitle">Report an issue</h2><form id="roleReportForm"><label class="role-label" for="reportCategory">Category</label><select id="reportCategory" class="input-field"><option>Safety</option><option>Payment</option><option>No-Show</option><option>App Bug</option><option>Misconduct</option></select><label class="role-label" for="reportDetails">What happened?</label><textarea id="reportDetails" class="input-field role-textarea" required minlength="8"></textarea><label class="role-label" for="reportEvidence">Attach evidence</label><input id="reportEvidence" class="input-field" type="file" accept="image/*,.pdf,.mp4"><p class="role-copy">Your report is sent to Ease Admin for follow-up.</p><button class="btn btn-primary full-width" type="submit">Send report</button></form></section>`;

const sosModal = ensureLayer('roleSosModal', 'role-modal-layer');
sosModal.innerHTML = `<section class="role-modal-card" role="dialog" aria-modal="true" aria-labelledby="sosModalTitle"><button class="role-modal-close" data-close-layer aria-label="Close">×</button><p class="role-eyebrow">Help is here</p><h2 id="sosModalTitle">Malaysia Emergency Hotlines</h2><div class="role-hotline-list"><a href="tel:999"><strong>999</strong><span>Malaysia Emergency Services · Police / Ambulance / Fire</span></a><a href="tel:15999"><strong>15999</strong><span>Talian Kasih · Child protection & welfare</span></a><a href="tel:0376272929"><strong>03-7627 2929</strong><span>Befrienders · Crisis support</span></a></div><button type="button" class="btn btn-primary full-width" id="shareEmergencyLocation">Share live location with contacts & Ease Admin</button><p id="locationShareStatus" class="role-copy" role="status"></p><p class="role-note">If someone is in immediate danger, call 999.</p></section>`;

const captureModal = ensureLayer('roleCaptureModal', 'role-modal-layer');
captureModal.innerHTML = `<section class="role-modal-card" role="dialog" aria-modal="true" aria-labelledby="captureTitle"><button class="role-modal-close" data-close-layer aria-label="Close">×</button><p class="role-eyebrow">Trust & transparency</p><h2 id="captureTitle">Live update capture</h2><div class="role-viewfinder"><span>LIVE · <span id="captureTimestamp"></span></span><strong>Camera preview</strong><small>Live timestamp watermark</small></div><p class="role-note">Live Capture Only — Gallery uploads disabled to ensure real-time transparency and honesty.</p><div class="role-actions"><button class="btn btn-secondary" data-capture-kind="photo">Take live photo</button><button class="btn btn-primary" data-capture-kind="video">Record live video</button></div></section>`;
const sessionModal = ensureLayer('roleSessionModal', 'role-modal-layer');
sessionModal.innerHTML = `<section class="role-modal-card" role="dialog" aria-modal="true" aria-labelledby="sessionModalTitle"><button class="role-modal-close" data-close-layer aria-label="Close">×</button><p class="role-eyebrow">Schedule</p><h2 id="sessionModalTitle">Session details</h2><div id="sessionModalDetails"></div><div class="role-actions"><button class="btn btn-secondary" data-session-action="start">Start session</button><button class="btn btn-primary" data-session-action="complete">Mark session complete</button></div></section>`;

const drawerLinks = document.getElementById('drawerMemberLinks');
if (drawerLinks) {
  drawerLinks.insertAdjacentHTML('beforeend', `<a href="#/reportIssue" class="drawer-app-item role-drawer-report" data-role-action="report"><span class="drawer-app-title">Report issue to Admin</span></a>`);
  drawerLinks.insertAdjacentHTML('beforeend', `<a href="#/sitterSchedule" class="drawer-app-item role-sitter-link" data-role-route="sitterSchedule"><span class="drawer-app-title">Schedule</span></a><a href="#/sitterEarnings" class="drawer-app-item role-sitter-link" data-role-route="sitterEarnings"><span class="drawer-app-title">Earnings</span></a>`);
  drawerLinks.insertAdjacentHTML('beforeend', `<a href="#/adminDashboard" class="drawer-app-item role-admin-link" data-role-route="adminDashboard"><span class="drawer-app-title">Admin dashboard</span></a>`);
}

const welcome = document.getElementById('screenWelcome');
if (welcome && !document.getElementById('adminLoginLink')) {
  const footer = document.createElement('div');
  footer.className = 'role-welcome-links';
  footer.innerHTML = `<a href="#/auth" id="welcomeLoginLink">Already have an account? Log in</a><a href="#/adminLogin" id="adminLoginLink">Admin login</a>`;
  welcome.appendChild(footer);
}

const sitterNav = document.createElement('nav');
sitterNav.id = 'sitterBottomNav';
sitterNav.className = 'role-bottom-nav';
sitterNav.setAttribute('aria-label', 'Babysitter navigation');
sitterNav.innerHTML = `<button data-role-route="sitterHome">⌂<span>Home</span></button><button data-role-route="availableJobs">▣<span>Requests</span></button><button data-role-route="sitterSchedule">▦<span>Schedule</span></button><button data-role-route="sitterEarnings">RM<span>Earnings</span></button><button data-role-route="sitterApplication">◉<span>Profile</span></button>`;
document.body.appendChild(sitterNav);

const sosButton = document.createElement('button');
sosButton.id = 'globalSosButton';
sosButton.className = 'global-sos-button';
sosButton.type = 'button';
sosButton.setAttribute('aria-label', 'Open emergency help');
sosButton.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg><strong>SOS</strong>`;
document.body.appendChild(sosButton);

function showLayer(layer) {
  layer.hidden = false;
  document.body.classList.add('role-modal-open');
  layer.querySelector('[role="dialog"]')?.focus();
}

function hideLayer(layer) {
  layer.hidden = true;
  if (![reportModal, sosModal, captureModal, sessionModal].some(item => !item.hidden)) document.body.classList.remove('role-modal-open');
}

function getAcceptedBookings() {
  const raw = localRead('easeBookings', []);
  const bookings = Array.isArray(raw) ? raw : [];
  const confirmed = bookings.filter(item => ['confirmed', 'paid', 'completed', 'in_progress'].includes(item.status)).map(item => {
    const date = item.date || item.bookingDate || new Date().toISOString().slice(0, 10);
    return { id: item.id, date, time: item.startTime || item.time || '14:00', sitter: item.babysitterName || 'Sarah Lim', parent: item.parentName || 'Mei Ling', child: item.child || 'Aiden', location: item.location || 'Bangsar, Kuala Lumpur', amount: Number(item.total || item.amount || 105), status: item.status };
  });
  const acceptedJobs = localRead('ease_sitter_jobs', []);
  const sitterJobs = (Array.isArray(acceptedJobs) ? acceptedJobs : []).filter(item => ['accepted', 'in_progress', 'completed'].includes(item.status)).map(item => ({
    id: item.id, date: item.dateKey || item.date, time: item.time || item.startTime || '14:00',
    sitter: session().user?.name || 'You', parent: item.parent || 'Ease family', child: item.child || 'Child',
    location: item.location || 'Kuala Lumpur', amount: Number(item.amount || 0), status: item.status,
  }));
  return [...confirmed, ...sitterJobs];
}

function displayDate(value) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderSitterPreview() {
  const card = document.getElementById('sitterPreviewCard');
  if (!card) return;
  const sitter = platform.sitter;
  const name = session().user?.name || 'Your name';
  card.innerHTML = `<div class="role-avatar">${sitter.photo ? `<img src="${encode(sitter.photo)}" alt="Profile preview">` : '👩‍🍼'}</div><div><h2>${encode(name)}</h2><span class="role-badge">Application pending review</span><p>${encode(sitter.experience)} experience · ${encode(sitter.languages || 'Languages not added')}</p><p>${encode(sitter.bio || 'Add a short bio to help families get to know you.')}</p><strong>RM ${Number(sitter.rate) || 25} / hr</strong></div>`;
}

function renderApplication() {
  const stepper = document.getElementById('applicationStepper');
  if (!stepper) return;
  const status = platform.sitter.status || 'not_started';
  const labels = ['Submitted', 'In Review', 'Approved'];
  const active = status === 'approved' ? 2 : status === 'in_review' || status === 'needs_changes' || status === 'rejected' ? 1 : status === 'submitted' ? 0 : -1;
  stepper.innerHTML = labels.map((label, index) => `<div class="role-step ${index <= active ? 'complete' : ''}"><span>${index < active ? '✓' : index + 1}</span><strong>${label}</strong></div>`).join('');
  const text = document.getElementById('applicationStatusText');
  const feedback = document.getElementById('applicationFeedback');
  const fix = document.getElementById('fixApplication');
  if (text) text.textContent = ({ not_started: 'Start your application by uploading your documents.', submitted: 'Your application was submitted and is waiting for review.', in_review: 'An Ease Admin is reviewing your documents.', approved: 'Approved — your verified profile can now be shown to parents.', needs_changes: 'Your application needs a few updates.', rejected: 'Your application was not approved. Review the note and contact Ease support.' })[status] || 'Your application is being reviewed.';
  if (feedback) {
    feedback.hidden = !platform.sitter.feedback;
    feedback.textContent = platform.sitter.feedback ? `Admin feedback: ${platform.sitter.feedback}` : '';
  }
  if (fix) {
    fix.hidden = !['needs_changes', 'not_started'].includes(status);
    fix.textContent = status === 'not_started' ? 'Upload documents' : 'Fix and submit again';
  }
}

function renderSitterHome() {
  const statusEl = document.getElementById('sitterHomeVerification');
  const status = platform.sitter.status || 'not_started';
  if (statusEl) statusEl.textContent = status === 'approved' ? '✓ Approved · Verified badge active' : status === 'needs_changes' ? 'Needs changes · Please update your documents' : status === 'not_started' ? 'Application not started · Upload your documents to begin' : 'In review · Your profile is hidden from parents until approved';
  const rawJobs = document.getElementById('sitterJobCount');
  if (rawJobs) rawJobs.textContent = String(document.querySelectorAll('#availableJobsList .available-job-card').length || 2);
  const accepted = getAcceptedBookings();
  const upcoming = document.getElementById('sitterUpcomingSummary');
  if (upcoming) upcoming.textContent = accepted.length ? `${accepted.length} confirmed session${accepted.length === 1 ? '' : 's'} in your schedule.` : 'Your accepted jobs appear in your schedule.';
  const earnings = document.getElementById('sitterHomeEarnings');
  if (earnings) earnings.textContent = `RM ${platform.payouts.filter(item => item.status === 'Paid to Bank').reduce((total, item) => total + Number(item.amount || 0), 0)}`;
}

function renderSchedule() {
  const title = document.getElementById('calendarMonthTitle');
  const calendar = document.getElementById('scheduleCalendar');
  const list = document.getElementById('scheduleEvents');
  if (!calendar || !list) return;
  title.textContent = calendarView === 'week'
    ? `Week of ${calendarCursor.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`
    : calendarCursor.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  const viewToggle = document.getElementById('calendarViewToggle');
  if (viewToggle) viewToggle.textContent = calendarView === 'month' ? 'Week view' : 'Month view';
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const sessions = getAcceptedBookings();
  let firstDate;
  let dayCount;
  let leadingDays;
  if (calendarView === 'week') {
    firstDate = new Date(calendarCursor);
    firstDate.setDate(firstDate.getDate() - firstDate.getDay());
    dayCount = 7;
    leadingDays = 0;
  } else {
    firstDate = new Date(year, month, 1);
    dayCount = new Date(year, month + 1, 0).getDate();
    leadingDays = firstDate.getDay();
  }
  const cells = Array.from({ length: leadingDays }, () => '<span class="role-calendar-empty"></span>');
  for (let offset = 0; offset < dayCount; offset += 1) {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + offset);
    const day = date.getDate();
    const dateKey = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(day).padStart(2, '0')].join('-');
    const events = sessions.filter(item => item.date === dateKey);
    cells.push(`<button type="button" class="role-calendar-day ${events.length ? 'has-session' : ''}" data-calendar-date="${dateKey}" aria-label="${encode(displayDate(dateKey))}${events.length ? `, ${events.length} sessions` : ''}">${day}${events.length ? `<small>${events.length} session</small>` : ''}</button>`);
  }
  calendar.innerHTML = `<div class="role-calendar-weekdays">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<span>${day}</span>`).join('')}</div><div class="role-calendar-days">${cells.join('')}</div>`;
  list.innerHTML = sessions.length ? sessions.map(item => `<article class="role-list-item"><div><strong>${encode(displayDate(item.date))} · ${encode(item.time)}</strong><p>${encode(item.parent)} · ${encode(item.location)}</p><small>${encode(item.child)} · Booking ${encode(item.id || '')}</small></div><button class="btn btn-secondary" data-session-control="${encode(item.id)}">Session details</button></article>`).join('') : '<div class="card"><p>No accepted jobs yet. Accepted bookings will appear here with their date and time.</p></div>';
}

function renderEarnings() {
  const all = platform.payouts || [];
  const pending = all.filter(item => item.status === 'Processing');
  const paid = all.filter(item => item.status === 'Paid to Bank');
  const month = document.getElementById('earningsMonth');
  const pendingEl = document.getElementById('earningsPending');
  const paidEl = document.getElementById('earningsPaid');
  const history = document.getElementById('earningsHistory');
  if (month) month.textContent = `RM ${all.reduce((total, item) => total + Number(item.amount || 0), 0)}`;
  if (pendingEl) pendingEl.textContent = `RM ${pending.reduce((total, item) => total + Number(item.amount || 0), 0)}`;
  if (paidEl) paidEl.textContent = `RM ${paid.reduce((total, item) => total + Number(item.amount || 0), 0)}`;
  if (history) history.innerHTML = all.map(item => `<article class="role-list-item"><div><strong>${encode(item.sitter)} · RM ${Number(item.amount)}</strong><p>${encode(item.date)} · ${encode(item.id)}</p></div><span class="role-badge">${encode(item.status)}</span></article>`).join('') || '<p>No transactions yet.</p>';
}

function renderAdminDashboard(tab = 'applications') {
  const panels = {
    applications: document.getElementById('adminApplicationsPanel'),
    payouts: document.getElementById('adminPayoutsPanel'),
    reports: document.getElementById('adminReportsPanel'),
  };
  Object.entries(panels).forEach(([key, panel]) => {
    if (panel) panel.hidden = key !== tab;
    document.querySelector(`[data-admin-tab="${key}"]`)?.classList.toggle('active', key === tab);
  });
  if (panels.applications) {
    const applications = platform.applications;
    panels.applications.innerHTML = `<div class="role-filter-row"><label class="sr-only" for="adminApplicantSearch">Search applicants</label><input id="adminApplicantSearch" class="input-field" placeholder="Search applicants"><label class="sr-only" for="adminStatusFilter">Filter status</label><select id="adminStatusFilter" class="input-field"><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="needs_changes">Needs info</option></select></div><div id="adminApplicantsList" class="role-list">${applications.length ? applications.map(item => `<button class="role-list-item role-applicant-row" data-review-app="${encode(item.id)}"><span><strong>${encode(item.name)}</strong><small>${encode(item.email)} · ${encode(item.status.replace('_', ' '))}</small></span><span class="role-badge">${encode(item.status.replace('_', ' '))}</span></button>`).join('') : '<div class="card"><p>No sitter applications have been submitted yet.</p></div>'}</div>`;
  }
  if (panels.payouts) {
    const completedBookings = localRead('easeBookings', []).filter(item => item.status === 'completed');
    completedBookings.forEach(booking => {
      const payoutId = `PAY-${booking.id}`;
      if (!platform.payouts.some(item => item.id === payoutId)) {
        platform.payouts.unshift({
          id: payoutId,
          bookingId: booking.id,
          sitter: booking.babysitterName || 'Babysitter',
          amount: Number(booking.total || booking.price || 0),
          status: 'Processing',
          date: displayDate(booking.date),
        });
      }
    });
    savePlatform();
    panels.payouts.innerHTML = `<div class="role-list">${platform.payouts.map(item => `<article class="role-list-item"><div><strong>${encode(item.sitter)} · RM ${Number(item.amount)}</strong><p>${encode(item.date)} · ${encode(item.status)}</p><small>Bank: ${encode(platform.sitter.bankName || 'Maybank')} · ${encode(platform.sitter.bankHolder || item.sitter)} · ${encode(platform.sitter.bankAccount || '•••• 1234')}</small></div>${item.status === 'Processing' ? `<button class="btn btn-primary" data-release-payout="${encode(item.id)}">Release payment to babysitter</button>` : '<span class="role-badge">Paid to Bank</span>'}</article>`).join('')}</div>`;
  }
  if (panels.reports) {
    const records = [...platform.reports, ...platform.sosAlerts];
    panels.reports.innerHTML = records.length ? `<div class="role-list">${records.map(item => `<article class="role-list-item"><div><strong>${encode(item.category || 'SOS alert')} · ${encode(item.name || item.role || 'Member')}</strong><p>${encode(item.details)}</p><small>${encode(new Date(item.createdAt).toLocaleString())} · Evidence: ${encode(item.evidence || 'None')}</small></div><label class="role-label">Status<select class="input-field" data-report-status="${encode(item.id)}"><option ${item.status === 'Open' ? 'selected' : ''}>Open</option><option ${item.status === 'Investigating' ? 'selected' : ''}>Investigating</option><option ${item.status === 'Resolved' ? 'selected' : ''}>Resolved</option></select></label></article>`).join('')}</div>` : '<div class="card"><p>No user reports or SOS alerts yet.</p></div>';
  }
}

function renderAdminReview() {
  const application = platform.applications.find(item => item.id === reviewApplicationId);
  const content = document.getElementById('adminReviewContent');
  if (!content || !application) {
    navigate('adminDashboard');
    return;
  }
  content.innerHTML = `<article class="card"><h2 class="card-title">Applicant</h2><p>${encode(application.name)}</p><p>${encode(application.email)}</p><p>${encode(application.phone)}</p><p>${encode(application.bio)}</p><p>Rate: RM ${Number(application.rate)}/hr · ${encode(application.experience)}</p></article><article class="card"><h2 class="card-title">Submitted documents</h2>${Object.entries(application.documents || {}).map(([label, file]) => `<p><strong>${encode(label)}:</strong> ${encode(file || 'Not provided')}</p>`).join('')}<h3 class="card-title">Bank details</h3><p>${encode(application.bankName)} · ${encode(application.bankHolder)} · ${encode(application.bankAccount)}</p></article>`;
  const audit = document.getElementById('adminAuditLog');
  if (audit) audit.textContent = application.reviewedAt ? `Reviewed by Admin Sarah on ${application.reviewedAt}${application.adminNote ? ` · Note: ${application.adminNote}` : ''}` : 'Not reviewed yet.';
}

function syncSitterForm() {
  const sitter = platform.sitter;
  const values = {
    sitterPostcode: sitter.postcode, sitterRadius: sitter.radius, sitterExperience: sitter.experience,
    sitterAvailability: sitter.availability, sitterRate: sitter.rate, sitterLanguages: sitter.languages,
    sitterBio: sitter.bio, bankName: sitter.bankName, bankHolder: sitter.bankHolder, bankAccount: sitter.bankAccount,
  };
  Object.entries(values).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input && value != null) input.value = value;
  });
  document.querySelectorAll('input[name="ageGroup"]').forEach(input => { input.checked = sitter.ages.includes(input.value); });
  document.querySelectorAll('input[name="careType"]').forEach(input => { input.checked = sitter.care.includes(input.value); });
  const overnight = document.getElementById('sitterOvernight');
  if (overnight) overnight.checked = Boolean(sitter.overnight);
}

function renderDocumentUploadStatus() {
  document.querySelectorAll('[data-document]').forEach(input => {
    const label = input.closest('label');
    let progress = label?.querySelector('progress');
    let status = label?.querySelector('[data-upload-status]');
    if (!label) return;
    if (!progress) {
      progress = document.createElement('progress');
      progress.max = 100;
      label.appendChild(progress);
    }
    if (!status) {
      status = document.createElement('small');
      status.dataset.uploadStatus = 'true';
      label.appendChild(status);
    }
    const uploaded = platform.sitter.documents[input.dataset.document];
    progress.value = uploaded && uploaded !== 'Not uploaded' ? 100 : 0;
    status.textContent = uploaded && uploaded !== 'Not uploaded' ? `Uploaded: ${uploaded}` : 'No file selected';
  });
}

function saveSitterQuestion(id) {
  const value = selector => document.querySelector(selector)?.value || '';
  if (id === 'sitterQ1') {
    platform.sitter.postcode = value('#sitterPostcode');
    platform.sitter.radius = value('#sitterRadius');
  } else if (id === 'sitterQ2') {
    platform.sitter.experience = value('#sitterExperience');
    platform.sitter.ages = [...document.querySelectorAll('input[name="ageGroup"]:checked')].map(input => input.value);
  } else if (id === 'sitterQ3') {
    platform.sitter.care = [...document.querySelectorAll('input[name="careType"]:checked')].map(input => input.value);
    platform.sitter.overnight = Boolean(document.getElementById('sitterOvernight')?.checked);
    platform.sitter.availability = value('#sitterAvailability');
  } else if (id === 'sitterQ4') {
    platform.sitter.rate = Number(value('#sitterRate')) || 25;
  } else if (id === 'sitterQ5') {
    platform.sitter.languages = value('#sitterLanguages');
    platform.sitter.bio = value('#sitterBio');
    const file = document.getElementById('sitterPhoto')?.files?.[0];
    platform.sitter.photo = file ? URL.createObjectURL(file) : '';
  }
  savePlatform();
}

function submitSitterApplication() {
  const bankHolder = document.getElementById('bankHolder')?.value.trim();
  const bankAccount = document.getElementById('bankAccount')?.value.trim();
  if (!bankHolder || bankAccount.length < 8) {
    window.easeApp?.toast('Enter the account holder and a valid account number.');
    return;
  }
  const files = [...document.querySelectorAll('[data-document]')];
  const docs = Object.fromEntries(files.map(input => [input.dataset.document, input.files?.[0]?.name || platform.sitter.documents[input.dataset.document] || 'Not uploaded']));
  if (docs['Government ID'] === 'Not uploaded' || docs['CPR / First Aid'] === 'Not uploaded') {
    window.easeApp?.toast('Please add your Government ID and CPR / First Aid certificate.');
    return;
  }
  platform.sitter.bankName = document.getElementById('bankName').value;
  platform.sitter.bankHolder = bankHolder;
  platform.sitter.bankAccount = bankAccount;
  platform.sitter.documents = docs;
  platform.sitter.status = 'in_review';
  platform.sitter.feedback = '';
  const user = session().user;
  applicationId = platform.applicationId || `APP-${Date.now().toString().slice(-6)}`;
  platform.applicationId = applicationId;
  const record = {
    id: applicationId, name: user.name || 'New babysitter', email: user.email || '', phone: user.phone || '',
    status: 'in_review', documents: docs, bankName: platform.sitter.bankName, bankHolder, bankAccount,
    bio: platform.sitter.bio, rate: platform.sitter.rate, experience: platform.sitter.experience, reviewedAt: '',
  };
  const existing = platform.applications.findIndex(item => item.id === applicationId);
  if (existing >= 0) platform.applications[existing] = record;
  else platform.applications.unshift(record);
  savePlatform();
  navigate('sitterApplication');
  window.easeApp?.toast('Your application has been sent to Admin.');
}

function syncShell(screenId) {
  currentRoute = screenId;
  const current = session();
  const loggedInParent = current.isLoggedIn && current.role === 'parent' && !['welcome', 'auth', 'verify'].includes(screenId);
  document.getElementById('bottomNav').style.display = loggedInParent ? 'flex' : 'none';
  const loggedInSitter = current.isLoggedIn && current.role === 'babysitter' && !['welcome', 'auth', 'verify'].includes(screenId);
  sitterNav.classList.toggle('visible', loggedInSitter);
  sosButton.classList.toggle('visible', current.isLoggedIn && screenId !== 'auth' && screenId !== 'verify' && screenId !== 'welcome');
  document.querySelectorAll('.role-sitter-link').forEach(item => { item.hidden = current.role !== 'babysitter' || !current.isLoggedIn; });
  document.querySelectorAll('.role-drawer-report').forEach(item => { item.hidden = !current.isLoggedIn; });
  const bookingsLink = document.getElementById('drawerBookingsItem');
  if (bookingsLink) bookingsLink.hidden = current.role !== 'parent';
  const findLink = document.querySelector('#drawerMenu [data-drawer-route="find"]');
  if (findLink) findLink.hidden = current.isLoggedIn && current.role !== 'parent';
  document.querySelectorAll('.role-admin-link').forEach(item => { item.hidden = current.role !== 'admin' || !current.isLoggedIn; });
  document.querySelectorAll('#sitterBottomNav [data-role-route]').forEach(item => {
    const active = item.dataset.roleRoute === screenId || (item.dataset.roleRoute === 'availableJobs' && screenId === 'requestDetail');
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const bottomNav = document.getElementById('bottomNav');
  bottomNav?.querySelectorAll('[data-nav]').forEach(item => {
    const active = ({ home: 'parentHome', find: 'find', bookings: 'bookings', messages: 'chat', profile: 'parentProfile' })[item.dataset.nav] === screenId;
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  document.body.classList.toggle('role-app-active', routeIds.includes(screenId));
  syncDesktopSidebar(current);
  if (screenId === 'sitterQ1') syncSitterForm();
  if (screenId === 'sitterQ2') syncSitterForm();
  if (screenId === 'sitterQ3') syncSitterForm();
  if (screenId === 'sitterQ4') syncSitterForm();
  if (screenId === 'sitterQ5') syncSitterForm();
  if (screenId === 'sitterDocuments') renderDocumentUploadStatus();
  if (screenId === 'sitterPreview') renderSitterPreview();
  if (screenId === 'sitterApplication') renderApplication();
  if (screenId === 'sitterHome') renderSitterHome();
  if (screenId === 'sitterSchedule') renderSchedule();
  if (screenId === 'sitterEarnings') renderEarnings();
  if (screenId === 'adminDashboard') renderAdminDashboard();
  if (screenId === 'adminReview') renderAdminReview();
  if (screenId === 'chat') updateChatPerspective();
}

function updateChatPerspective() {
  const current = session();
  const sitter = current.role === 'babysitter';
  const header = document.querySelector('.chat-header-info');
  const title = document.getElementById('chatSitterName');
  if (title) title.textContent = sitter ? 'Mei Ling' : 'Sarah Lim';
  if (header) {
    let perspective = header.querySelector('.role-chat-perspective');
    if (!perspective) {
      perspective = document.createElement('span');
      perspective.className = 'role-chat-perspective';
      header.appendChild(perspective);
    }
    perspective.textContent = sitter ? 'Chatting with Parent: Mei Ling' : 'Chatting with Babysitter: Sarah Lim';
  }
  const area = document.getElementById('chatMessagesArea');
  if (area) {
    const demo = sitter
      ? [['sitter', 'Hello Mei Ling, I am ready for today’s session.'], ['parent', 'Thank you. Aiden’s routine is in his profile.'], ['sitter', 'I will share updates during care.']]
      : [['parent', 'Hello Sarah! How is Aiden doing?'], ['sitter', 'He is enjoying story time. I will keep you updated.']];
    area.innerHTML = demo.map(([role, text]) => `<div class="chat-message chat-msg-${role}"><p>${encode(text)}</p><span class="chat-time">Today</span></div>`).join('');
  }
  const bookButton = document.getElementById('btnChatBook');
  if (bookButton) bookButton.hidden = sitter;
  const chatContainer = document.querySelector('#screenChat .chat-container');
  if (chatContainer) {
    let tools = chatContainer.querySelector('.role-chat-tools');
    if (!tools) {
      tools = document.createElement('section');
      tools.className = 'role-chat-tools';
      chatContainer.querySelector('.chat-header')?.after(tools);
    }
    tools.innerHTML = sitter
      ? `<button class="btn btn-secondary" data-chat-action="emergency">Child emergency info</button><button class="btn btn-secondary" data-chat-action="start">Start session</button><button class="btn btn-primary" data-chat-action="end">End session</button><p class="role-live-status" aria-live="polite"></p>`
      : `<div class="role-chat-statuses"><span>Quick status</span><button class="btn btn-secondary" data-parent-status="On my way">On my way</button><button class="btn btn-secondary" data-parent-status="Arrived">Arrived</button><button class="btn btn-secondary" data-parent-status="Child settled">Child settled</button></div><p class="role-live-status" aria-live="polite">Live updates from Sarah will appear here.</p>`;
  }
}

window.addEventListener('ease:screenchange', event => syncShell(event.detail.screenId));
window.addEventListener('resize', () => syncDesktopSidebar());

document.addEventListener('click', event => {
  const route = event.target.closest('[data-role-route]');
  if (route) {
    event.preventDefault();
    const drawer = document.getElementById('navDrawer');
    if (drawer?.classList.contains('active')) document.getElementById('drawerCloseBtn')?.click();
    navigate(route.dataset.roleRoute);
    return;
  }
  const action = event.target.closest('[data-role-action]');
  if (action?.dataset.roleAction === 'report') {
    event.preventDefault();
    showLayer(reportModal);
    return;
  }
  const close = event.target.closest('[data-close-layer]');
  if (close) {
    const layer = close.closest('.role-modal-layer');
    if (layer) hideLayer(layer);
    return;
  }
  const primary = event.target.closest('[data-role-primary]');
  if (primary) {
    const screen = primary.dataset.rolePrimary;
    if (screen.startsWith('sitterQ')) {
      saveSitterQuestion(screen);
      const step = Number(screen.slice(-1));
      navigate(step === 5 ? 'sitterPreview' : `sitterQ${step + 1}`);
    } else if (screen === 'sitterPreview') {
      savePlatform();
      window.easeApp?.beginSignup('babysitter', 'sitterDocuments');
    } else if (screen === 'sitterDocuments') {
      submitSitterApplication();
    } else if (screen === 'adminLogin') {
      const email = document.getElementById('adminEmail').value.trim();
      const password = document.getElementById('adminPassword').value;
      if (email !== 'admin@ease.my' || password !== 'admin123') {
        document.getElementById('adminLoginError').hidden = false;
        return;
      }
      window.easeApp?.setRoleSession('admin', { name: 'Admin Sarah', email });
      navigate('adminDashboard');
    }
  }
  const tab = event.target.closest('[data-admin-tab]');
  if (tab) renderAdminDashboard(tab.dataset.adminTab);
  const applicant = event.target.closest('[data-review-app]');
  if (applicant) {
    reviewApplicationId = applicant.dataset.reviewApp;
    navigate('adminReview');
  }
  const reviewAction = event.target.closest('[data-review-action]');
  if (reviewAction) {
    const application = platform.applications.find(item => item.id === reviewApplicationId);
    if (!application) return;
    const note = document.getElementById('adminReviewNote').value.trim();
    const actionName = reviewAction.dataset.reviewAction;
    if (!note) {
      document.getElementById('adminReviewNote').focus();
      window.easeApp?.toast('Add an admin note before completing this review.');
      return;
    }
    application.status = actionName === 'approve' ? 'approved' : actionName === 'reject' ? 'rejected' : 'needs_changes';
    application.reviewedAt = new Date().toLocaleString('en-MY');
    application.adminNote = note;
    if (application.id === platform.applicationId) {
      platform.sitter.status = application.status;
      platform.sitter.feedback = actionName === 'approve' ? '' : note;
    }
    savePlatform();
    navigate('adminDashboard');
    window.easeApp?.toast(actionName === 'approve' ? 'Application approved. Verified badge enabled.' : 'Application status updated.');
  }
  const payout = event.target.closest('[data-release-payout]');
  if (payout) {
    const record = platform.payouts.find(item => item.id === payout.dataset.releasePayout);
    if (record) {
      record.status = 'Paid to Bank';
      savePlatform();
      renderAdminDashboard('payouts');
      window.easeApp?.toast('Payment released to the registered bank account.');
    }
  }
  const calendarStep = event.target.closest('[data-calendar-step]');
  if (calendarStep) {
    if (calendarView === 'week') calendarCursor.setDate(calendarCursor.getDate() + Number(calendarStep.dataset.calendarStep) * 7);
    else calendarCursor.setMonth(calendarCursor.getMonth() + Number(calendarStep.dataset.calendarStep));
    renderSchedule();
  }
  if (event.target.closest('#calendarToday')) {
    calendarCursor = new Date();
    if (calendarView === 'month') calendarCursor.setDate(1);
    renderSchedule();
  }
  if (event.target.closest('#calendarViewToggle')) {
    calendarView = calendarView === 'month' ? 'week' : 'month';
    renderSchedule();
  }
  const calendarDay = event.target.closest('[data-calendar-date]');
  if (calendarDay) {
    const booking = getAcceptedBookings().find(item => item.date === calendarDay.dataset.calendarDate);
    if (booking) {
      selectedSessionId = booking.id;
      document.getElementById('sessionModalDetails').innerHTML = `<p><strong>${encode(booking.parent)}</strong> · ${encode(booking.child)}</p><p>${encode(displayDate(booking.date))} · ${encode(booking.time)}</p><p>${encode(booking.location)}</p><span class="role-badge">${encode(booking.status)}</span>`;
      showLayer(sessionModal);
    }
  }
  const eventButton = event.target.closest('[data-session-control]');
  if (eventButton) {
    const booking = getAcceptedBookings().find(item => item.id === eventButton.dataset.sessionControl);
    if (booking) {
      selectedSessionId = booking.id;
      document.getElementById('sessionModalDetails').innerHTML = `<p><strong>${encode(booking.parent)}</strong> · ${encode(booking.child)}</p><p>${encode(displayDate(booking.date))} · ${encode(booking.time)}</p><p>${encode(booking.location)}</p><span class="role-badge">${encode(booking.status)}</span>`;
      showLayer(sessionModal);
    }
  }
  const sessionAction = event.target.closest('[data-session-action]');
  if (sessionAction) {
    const jobs = localRead('ease_sitter_jobs', []);
    const job = jobs.find(item => item.id === selectedSessionId);
    const bookings = localRead('easeBookings', []);
    const booking = bookings.find(item => item.id === selectedSessionId);
    if (job || booking) {
      const isComplete = sessionAction.dataset.sessionAction === 'complete';
      const nextStatus = isComplete ? 'completed' : 'in_progress';
      if (job) {
        job.status = nextStatus;
      } else {
        booking.status = nextStatus;
        window.easeApp?.updateBookingStatus(selectedSessionId, nextStatus);
      }
      if (!isComplete) {
        window.easeApp?.toast('Session started. Keep the parent updated.');
      } else {
        const amount = Number(job?.amount || booking?.total || booking?.price || 0);
        const sitterName = session().user?.name || booking?.babysitterName || 'You';
        const payoutId = `PAY-${selectedSessionId}`;
        if (!platform.payouts.some(item => item.id === payoutId)) {
          platform.payouts.unshift({ id: payoutId, bookingId: selectedSessionId, sitter: sitterName, amount, status: 'Processing', date: displayDate(job?.dateKey || booking?.date) });
        }
        window.easeApp?.toast('Session completed. Payout is pending in Ease escrow.');
      }
      try {
        if (job) localStorage.setItem('ease_sitter_jobs', JSON.stringify(jobs));
        if (booking) localStorage.setItem('easeBookings', JSON.stringify(bookings));
      } catch (error) {
        console.error('Could not update session status', error);
        window.easeApp?.toast('Could not save this session update.');
        return;
      }
      savePlatform();
      hideLayer(sessionModal);
      renderSchedule();
      renderEarnings();
    }
  }
  const chatAction = event.target.closest('[data-chat-action]');
  if (chatAction) {
    const status = document.querySelector('.role-live-status');
    if (chatAction.dataset.chatAction === 'emergency') {
      const child = localRead('ease_state', {}).child || {};
      if (status) status.textContent = `Emergency contact: ${child.emergencyName || 'Not added'} · ${child.emergencyPhone || 'Add a contact in Parent Profile'}.`;
    } else if (status) {
      status.textContent = chatAction.dataset.chatAction === 'start' ? 'Session started · Parent notified.' : 'Session ended · Parent notified.';
    }
  }
  const parentStatus = event.target.closest('[data-parent-status]');
  if (parentStatus) {
    const status = document.querySelector('.role-live-status');
    if (status) status.textContent = `Live update from Sarah: ${parentStatus.dataset.parentStatus}.`;
  }
  const capture = event.target.closest('[data-capture-kind]');
  if (capture) {
    const kind = capture.dataset.captureKind === 'photo' ? 'Live photo' : 'Live video';
    const timestamp = new Date().toLocaleString();
    platform.messages.push({ id: `LIVE-${Date.now()}`, text: `${kind} shared · ${timestamp}`, role: session().role });
    savePlatform();
    const area = document.getElementById('chatMessagesArea');
    area?.insertAdjacentHTML('beforeend', `<div class="chat-message chat-msg-${session().role === 'babysitter' ? 'sitter' : 'parent'}"><p>📍 ${encode(kind)} shared</p><span class="chat-time">${encode(timestamp)}</span></div>`);
    hideLayer(captureModal);
    window.easeApp?.toast(`${kind} captured with timestamp.`);
  }
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-document]')) {
    const file = event.target.files?.[0];
    if (file) {
      platform.sitter.documents[event.target.dataset.document] = file.name;
      savePlatform();
      renderDocumentUploadStatus();
    }
  }
  const filter = event.target.closest('#adminStatusFilter');
  if (filter) {
    const search = document.getElementById('adminApplicantSearch').value.toLowerCase();
    const records = [...document.querySelectorAll('.role-applicant-row')];
    records.forEach(row => {
      const application = platform.applications.find(item => item.id === row.dataset.reviewApp);
      const statusMatches = filter.value === 'all' || (filter.value === 'pending'
        ? ['submitted', 'in_review'].includes(application?.status)
        : application?.status === filter.value);
      row.hidden = !application || !statusMatches || !`${application.name} ${application.email}`.toLowerCase().includes(search);
    });
  }
  const statusSelect = event.target.closest('[data-report-status]');
  if (statusSelect) {
    const record = [...platform.reports, ...platform.sosAlerts].find(item => item.id === statusSelect.dataset.reportStatus);
    if (record) { record.status = statusSelect.value; savePlatform(); }
  }
});

document.addEventListener('input', event => {
  if (event.target.id !== 'adminApplicantSearch') return;
  const filter = document.getElementById('adminStatusFilter');
  filter?.dispatchEvent(new Event('change', { bubbles: true }));
});

document.getElementById('bottomNav').addEventListener('click', event => {
  const item = event.target.closest('[data-nav]');
  if (!item) return;
  const screens = { home: 'parentHome', find: 'find', bookings: 'bookings', messages: 'chat', profile: 'parentProfile' };
  navigate(screens[item.dataset.nav] || 'parentHome');
});

document.getElementById('adminLoginLink')?.addEventListener('click', event => { event.preventDefault(); navigate('adminLogin'); });
document.getElementById('welcomeLoginLink')?.addEventListener('click', event => {
  event.preventDefault();
  window.easeApp?.beginLogin('parentHome');
});
const parentProfileScreen = document.getElementById('screenParentProfile');
if (parentProfileScreen && !document.getElementById('savedPaymentMethods')) {
  const methods = document.createElement('section');
  methods.className = 'card role-saved-payments';
  methods.innerHTML = `<h2 class="section-heading">Saved Payment Methods</h2><div id="savedPaymentMethodList"></div><button type="button" class="btn btn-secondary" id="addSavedPaymentMethod">Add payment method</button>`;
  parentProfileScreen.querySelector('.parent-profile-container')?.appendChild(methods);
}
document.getElementById('addSavedPaymentMethod')?.addEventListener('click', () => {
  platform.parentPayments ||= [];
  const method = platform.parentPayments.length ? 'FPX · Maybank2u' : 'Visa ···· 4242';
  platform.parentPayments.push(method);
  savePlatform();
  renderSavedPaymentMethods();
  window.easeApp?.toast('Payment method saved on this device.');
});
function renderSavedPaymentMethods() {
  const list = document.getElementById('savedPaymentMethodList');
  if (!list) return;
  const methods = platform.parentPayments || [];
  list.innerHTML = methods.length
    ? methods.map((method, index) => `<div class="role-list-item"><strong>${encode(method)}</strong><button class="btn btn-secondary" data-remove-payment="${index}">Remove</button></div>`).join('')
    : '<p class="role-copy">No saved payment methods yet.</p>';
}
document.addEventListener('click', event => {
  const remove = event.target.closest('[data-remove-payment]');
  if (!remove) return;
  platform.parentPayments ||= [];
  platform.parentPayments.splice(Number(remove.dataset.removePayment), 1);
  savePlatform();
  renderSavedPaymentMethods();
});
document.getElementById('globalSosButton').addEventListener('click', () => showLayer(sosModal));
document.getElementById('btnChatAttach')?.addEventListener('click', () => {
  document.getElementById('captureTimestamp').textContent = new Date().toLocaleString();
  showLayer(captureModal);
});

document.getElementById('roleReportForm').addEventListener('submit', event => {
  event.preventDefault();
  const details = document.getElementById('reportDetails').value.trim();
  if (details.length < 8) {
    window.easeApp?.toast('Please add a few more details so Admin can help.');
    return;
  }
  const file = document.getElementById('reportEvidence').files?.[0];
  const current = session();
  platform.reports.unshift({ id: `REP-${Date.now()}`, category: document.getElementById('reportCategory').value, details, evidence: file?.name || 'None', name: current.user?.name || 'Ease member', role: current.role, status: 'Open', createdAt: new Date().toISOString() });
  savePlatform();
  event.target.reset();
  hideLayer(reportModal);
  window.easeApp?.toast('Your report was sent to Ease Admin.');
});

document.getElementById('shareEmergencyLocation').addEventListener('click', () => {
  const status = document.getElementById('locationShareStatus');
  const alertRecord = { id: `SOS-${Date.now()}`, role: session().role, details: 'Live location share requested.', status: 'Open', createdAt: new Date().toISOString() };
  const finish = message => {
    alertRecord.details = message;
    platform.sosAlerts.unshift(alertRecord);
    savePlatform();
    status.textContent = message;
    window.easeApp?.toast('Emergency alert sent to Ease Admin and your saved contacts.');
  };
  if (!navigator.geolocation) {
    finish('Location is unavailable on this device. Emergency alert sent to Ease Admin.');
    return;
  }
  status.textContent = 'Requesting your current location…';
  navigator.geolocation.getCurrentPosition(
    position => finish(`Live location: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}.`),
    () => finish('Location permission was not granted. Emergency alert sent to Ease Admin.'),
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
  );
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') [reportModal, sosModal, captureModal, sessionModal].forEach(hideLayer);
});
document.querySelectorAll('.role-modal-layer').forEach(layer => layer.addEventListener('click', event => {
  if (event.target === layer) hideLayer(layer);
}));
