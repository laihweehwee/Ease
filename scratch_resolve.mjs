import fs from 'fs';

// ============================================================================
// 1. RESOLVE index.html
// ============================================================================
function resolveIndexHtml() {
  const content = fs.readFileSync('index.html', 'utf8');
  const lines = content.split('\n');

  let inConflict = false;
  let conflictIndex = 0;
  let headLines = [];
  let origLines = [];
  let currentSide = '';
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      conflictIndex++;
      currentSide = 'HEAD';
      headLines = [];
      origLines = [];
      continue;
    }

    if (line.startsWith('=======') && inConflict) {
      currentSide = 'ORIG';
      continue;
    }

    if (line.startsWith('>>>>>>>') && inConflict) {
      inConflict = false;

      if (conflictIndex === 1) {
        // Topbar: Keep navBackBtn AND hamburger button
        newLines.push('        <!-- Back arrow button (visible on inner pages) -->');
        newLines.push('        <button class="nav-back-btn" id="navBackBtn" aria-label="Go back" style="display: none;">');
        newLines.push('          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C2456B" stroke-width="2.5"');
        newLines.push('            stroke-linecap="round" stroke-linejoin="round">');
        newLines.push('            <line x1="19" y1="12" x2="5" y2="12"></line>');
        newLines.push('            <polyline points="12 19 5 12 12 5"></polyline>');
        newLines.push('          </svg>');
        newLines.push('        </button>');
        newLines.push('');
        newLines.push('        <!-- Hamburger button -->');
      } else if (conflictIndex === 18) {
        // Receipt Child field
        newLines.push('                <span class="receipt-val" id="confirmedChild">Liam</span>');
      } else {
        // All other conflicts (2-17, 19-23) take ORIGIN/MAIN
        newLines.push(...origLines);
      }

      continue;
    }

    if (inConflict) {
      if (currentSide === 'HEAD') {
        headLines.push(line);
      } else {
        origLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  let resolved = newLines.join('\n');

  // Remove duplicate bookingChildSelect definition if present
  const duplicateSelectPattern = `                  <label for="bookingChildSelect">Child</label>
                  <select id="bookingChildSelect" class="input-field">
                    <option value="Liam">Liam (2 years old)</option>
                  </select>
`;
  if (resolved.includes(duplicateSelectPattern)) {
    resolved = resolved.replace(duplicateSelectPattern, '');
    console.log('Removed duplicate bookingChildSelect in index.html');
  }

  fs.writeFileSync('index.html', resolved);
  console.log(`Resolved index.html (${conflictIndex} conflicts handled).`);
}

// ============================================================================
// 2. RESOLVE main.js
// ============================================================================
function resolveMainJs() {
  const content = fs.readFileSync('main.js', 'utf8');
  const lines = content.split('\n');

  let inConflict = false;
  let conflictIndex = 0;
  let headLines = [];
  let origLines = [];
  let currentSide = '';
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('<<<<<<<')) {
      inConflict = true;
      conflictIndex++;
      currentSide = 'HEAD';
      headLines = [];
      origLines = [];
      continue;
    }

    if (line.startsWith('=======') && inConflict) {
      currentSide = 'ORIG';
      continue;
    }

    if (line.startsWith('>>>>>>>') && inConflict) {
      inConflict = false;

      if (conflictIndex === 1) {
        // loadState: Include BOTH children migration and preference migration
        newLines.push(...headLines);
        newLines.push(...origLines);
      } else if (conflictIndex === 2) {
        // Section 12 Child Profile Screen: Keep HEAD (rich validation, chips, emergency toggle, list)
        newLines.push(...headLines);
      } else if (conflictIndex === 3) {
        // addChildForm submit: Keep HEAD
        newLines.push(...headLines);
      } else if (conflictIndex === 4) {
        // setupBookingDetails child selector: Keep HEAD
        newLines.push(...headLines);
      } else if (conflictIndex === 5) {
        // Keep btnBookingAddChild listener AND getChildAge function
        newLines.push(...headLines);
        newLines.push('  }');
        newLines.push('');
        newLines.push(...origLines);
        // Note: line 3470 immediately following is '  }', which closes getChildAge
      } else if (conflictIndex === 6) {
        // bookingDetailsForm submit: Link selected child from HEAD + date from ORIGIN/MAIN
        newLines.push(...headLines);
      } else if (conflictIndex === 7) {
        // setupBookingConfirmed and teammate's booking management functions
        const modifiedOrig = origLines.map(l => {
          if (l.includes("if (confirmedChild) confirmedChild.textContent = booking.childName || state.child.name;")) {
            return "    if (confirmedChild) confirmedChild.textContent = booking.childName || (state.child && state.child.name) || 'Liam';\n    const confirmedChildName = document.getElementById('confirmedChildName');\n    if (confirmedChildName) confirmedChildName.textContent = booking.childName || (state.child && state.child.name) || 'Liam';";
          }
          return l;
        });
        newLines.push(...modifiedOrig);
      } else if (conflictIndex === 8) {
        // setupParentHome: Teammate's dashboard + child profile linking
        const homeResolved = [
          "    const homeChildDetails = document.getElementById('homeChildDetails');",
          "    const homeChildSummary = document.getElementById('homeChildSummary');",
          "    const homeBookingDate = document.getElementById('homeBookingDate');",
          "    const homeBookingSitter = document.getElementById('homeBookingSitter');",
          "    const homeBookingTime = document.getElementById('homeBookingTime');",
          "    const homeBookingLocation = document.getElementById('homeBookingLocation');",
          "    const homeBookingStatus = document.getElementById('homeBookingStatus');",
          "    const homeNextBookingCard = document.getElementById('homeNextBookingCard');",
          "    const homeNoBooking = document.getElementById('homeNoBooking');",
          "    const homeRecentMsgName = document.getElementById('homeRecentMsgName');",
          "    const homeBookAgainName = document.getElementById('homeBookAgainName');",
          "    const bookingSitter = sittersData[state.selectedSitterId] || sittersData['sarah-lim'];",
          "    const nextBooking = getUpcomingBookings()[0] || null;",
          "",
          "    document.querySelectorAll('[data-preference-sitter]').forEach(slot => {",
          "      const sitter = sittersData[slot.dataset.preferenceSitter];",
          "      if (sitter) slot.innerHTML = renderPreferenceSummary(sitter);",
          "    });",
          "    document.querySelectorAll('.home-sitter-card[data-sitter-id]').forEach(card => {",
          "      const sitter = sittersData[card.dataset.sitterId];",
          "      if (!sitter) return;",
          "      const languages = card.querySelector('[data-sitter-languages]');",
          "      const careTypeChips = card.querySelector('[data-care-types]');",
          "      if (languages) languages.textContent = `Languages: ${sitter.languages}`;",
          "      if (careTypeChips) careTypeChips.innerHTML = renderCareTypeChips(sitter);",
          "    });",
          "",
          "    const firstName = (state.user.name || 'Jessica').split(' ')[0];",
          "    if (greeting) greeting.textContent = `Welcome back, ${firstName}`;",
          "",
          "    const activeChild = state.child || (state.children && state.children[0]) || null;",
          "    const activeChildName = (activeChild && activeChild.name) || 'Liam';",
          "    if (homeChildName) homeChildName.textContent = activeChildName;",
          "    if (homeChildDetails && activeChild) {",
          "      homeChildDetails.textContent = `${getChildAge(activeChild.birthDate)} years old • ${activeChild.gender || 'Boy'}`;",
          "    }",
          "    if (homeChildSummary && activeChild) {",
          "      homeChildSummary.textContent = `Allergies: ${activeChild.allergies || 'None'} • Routine: ${activeChild.routine || 'Standard routine'} • Emergency Contact: ${activeChild.emergencyName || 'Not added'}`;",
          "    }",
          "    const homeNextBookingChild = document.getElementById('homeNextBookingChild');",
          "    if (homeNextBookingChild) homeNextBookingChild.textContent = state.bookingData.childName || activeChildName;",
          "",
          "    if (homeNextBookingCard) homeNextBookingCard.hidden = !nextBooking;",
          "    if (homeNoBooking) homeNoBooking.hidden = Boolean(nextBooking);",
          "    if (nextBooking) {",
          "      if (homeBookingDate) homeBookingDate.textContent = `Next Booking • ${formatBookingDate(nextBooking.date)}`;",
          "      if (homeBookingSitter) homeBookingSitter.textContent = nextBooking.babysitterName;",
          "      if (homeBookingTime) homeBookingTime.textContent = `${formatBookingTime(nextBooking.startTime, nextBooking.hours || 4)} • ${nextBooking.child}`;",
          "      if (homeBookingLocation) homeBookingLocation.textContent = `📍 ${nextBooking.location}`;",
          "      if (homeBookingStatus) homeBookingStatus.textContent = nextBooking.status;",
          "      if (btnHomeViewDetails) btnHomeViewDetails.textContent = getBookingAction(nextBooking).label;",
          "      if (btnHomeMessageSarah) btnHomeMessageSarah.textContent = `Message ${nextBooking.babysitterName.split(' ')[0]}`;",
          "    }",
          "    if (homeRecentMsgName) homeRecentMsgName.textContent = bookingSitter.name;",
          "    if (homeBookAgainName) homeBookAgainName.textContent = bookingSitter.name;"
        ];
        newLines.push(...homeResolved);
      }

      continue;
    }

    if (inConflict) {
      if (currentSide === 'HEAD') {
        headLines.push(line);
      } else {
        origLines.push(line);
      }
    } else {
      newLines.push(line);
    }
  }

  fs.writeFileSync('main.js', newLines.join('\n'));
  console.log(`Resolved main.js (${conflictIndex} conflicts handled).`);
}

resolveIndexHtml();
resolveMainJs();
