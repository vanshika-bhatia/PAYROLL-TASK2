/**
 * ============================================================================
 * Recruitment Kanban Board (Drag-Drop Pipeline) [BHATIA-T1]
 * ============================================================================
 * Concepts Covered:
 * - jQuery Selectors: $('.kanban-card[data-id]'), $('.column[data-stage="..."]')
 * - DOM Traversing: $(this).closest('.column').data('stage'), .find(), .parent()
 * - jQuery UI Sortable: connectWith, placeholder, revert, start/receive/stop
 * - jQuery Effects: highlight drop zone, pulse card on drop, fade/slide animations
 * - AJAX Calls: PATCH /candidates/:id, GET, POST with JSON Server
 * - LocalStorage sync fallback for offline/direct file execution
 * - Data Management: $.grep, $.map, Array.prototype.sort, duplicate checking
 * - RegEx Form Validations
 * - Interactive Features: Real-time search, Column counters, WIP limit, Undo move
 * ============================================================================
 */

// Configuration Constants
const API_BASE_URL = 'http://localhost:3000';
const STORAGE_KEY = 'payroll_recruitment_candidates_v1';
const WIP_LIMIT_INTERVIEW = 10;

// Application State
const AppState = {
  candidates: [],
  isServerOnline: false,
  lastMove: null, // Stores { candidateId, prevStage, prevIndex, newStage } for Undo
  activeCandidateId: null
};

/**
 * Wait for DOM to be fully loaded using jQuery
 */
$(document).ready(function () {
  console.log('Document ready - Initializing Recruitment Kanban Board...');

  // 1. Check server connection and load candidates
  initCandidateData();

  // 2. Setup jQuery UI Sortable on all columns
  setupKanbanSortable();

  // 3. Setup Event Listeners (Search, Modals, Forms, Column Sorts)
  setupEventListeners();
});

/**
 * ----------------------------------------------------------------------------
 * 1. Data Initialization & Server Sync (AJAX & LocalStorage)
 * ----------------------------------------------------------------------------
 */
function initCandidateData() {
  updateServerStatusIndicator('checking', 'Connecting to JSON Server...');

  // Test JSON Server availability via AJAX GET
  $.ajax({
    url: `${API_BASE_URL}/candidates`,
    type: 'GET',
    timeout: 3000,
    success: function (data) {
      console.log('Connected to JSON Server successfully!', data.length, 'records found.');
      AppState.isServerOnline = true;
      AppState.candidates = data;
      // Also cache in LocalStorage for offline resilience
      saveToLocalStorage(data);
      updateServerStatusIndicator('online', 'JSON Server Online (:3000)');
      renderAllColumns();
    },
    error: function (xhr, status, error) {
      console.warn('JSON Server offline or unreachable. Falling back to LocalStorage & db.json:', error);
      AppState.isServerOnline = false;
      updateServerStatusIndicator('offline', 'Local Storage Mode (Offline)');
      loadFallbackData();
    }
  });
}

/**
 * Fallback to LocalStorage or fetch initial db.json if server is offline
 */
function loadFallbackData() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      AppState.candidates = JSON.parse(cached);
      console.log('Loaded candidates from LocalStorage:', AppState.candidates.length);
      renderAllColumns();
      return;
    } catch (e) {
      console.error('Error parsing LocalStorage data:', e);
    }
  }

  // If no LocalStorage, fetch db.json directly via relative GET request
  $.getJSON('db.json', function (data) {
    if (data && data.candidates) {
      AppState.candidates = data.candidates;
      saveToLocalStorage(AppState.candidates);
      console.log('Loaded initial seed candidates from db.json:', AppState.candidates.length);
      renderAllColumns();
    }
  }).fail(function () {
    console.error('Could not load db.json fallback.');
    showToast('Failed to load candidate data. Please start JSON Server.', 'error');
  });
}

function saveToLocalStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save candidates to localStorage', e);
  }
}

function updateServerStatusIndicator(state, message) {
  const $pill = $('#server-status');
  const $text = $('#server-status-text');
  $text.text(message);

  const $dot = $pill.find('.status-dot');
  if (state === 'online') {
    $dot.css('background', '#10b981');
    $pill.css({ background: '#ecfdf5', color: '#047857' });
  } else if (state === 'offline') {
    $dot.css('background', '#f59e0b');
    $pill.css({ background: '#fffbeb', color: '#b45309' });
  } else {
    $dot.css('background', '#64748b');
    $pill.css({ background: '#f1f5f9', color: '#475569' });
  }
}

/**
 * ----------------------------------------------------------------------------
 * 2. jQuery UI Sortable Setup (Drag & Drop Pipeline)
 * ----------------------------------------------------------------------------
 */
function setupKanbanSortable() {
  /**
   * Technical Requirement:
   * sortable({ connectWith: '.column-cards', placeholder: '...' })
   */
  $('.column-cards').sortable({
    connectWith: '.column-cards',
    placeholder: 'kanban-placeholder',
    revert: 200,
    cursor: 'grabbing',
    handle: '.kanban-card',
    opacity: 0.95,
    tolerance: 'pointer',

    // Fired when dragging starts
    start: function (event, ui) {
      const $card = ui.item;
      // Record initial stage and initial index for WIP validation & Undo
      $card.data('originStage', $card.closest('.column').data('stage'));
      $card.data('originIndex', $card.index());

      // Effects: highlight other column drop zones
      $('.column-cards').not($card.parent()).addClass('highlight-drop');
    },

    // Fired while hovering over a target column
    over: function (event, ui) {
      $(this).addClass('ui-state-hover');
    },
    out: function (event, ui) {
      $(this).removeClass('ui-state-hover');
    },

    // Fired when dragging stops
    stop: function (event, ui) {
      // Remove all drop highlight classes
      $('.column-cards').removeClass('highlight-drop ui-state-hover');
    },

    // Fired when a card is dropped into a new list
    receive: function (event, ui) {
      const $card = ui.item;
      const candidateId = parseInt($card.attr('data-id'), 10);
      const originStage = $card.data('originStage');
      
      /**
       * Technical Requirement:
       * DOM Traversing: On drop, use $(this).closest('.column').data('stage') to get new stage
       */
      const newStage = $(this).closest('.column').data('stage');

      console.log(`[DragDrop] Card ID #${candidateId} moved: ${originStage} -> ${newStage}`);

      // Bonus Point: WIP Limit Warning (max 10 candidates in Interview stage)
      if (newStage === 'interview') {
        const currentCountInInterview = $('.column[data-stage="interview"] .kanban-card').length;
        if (currentCountInInterview > WIP_LIMIT_INTERVIEW) {
          // Revert drag back to original column
          $(ui.sender).sortable('cancel');
          showToast(`⚠️ WIP Limit Exceeded! Max ${WIP_LIMIT_INTERVIEW} candidates allowed in Interview stage.`, 'warning');
          return;
        }
      }

      // If dropped in same stage, no need to PATCH
      if (originStage === newStage) {
        return;
      }

      // Record move for Undo capability
      AppState.lastMove = {
        candidateId: candidateId,
        prevStage: originStage,
        prevIndex: $card.data('originIndex'),
        newStage: newStage
      };

      // Perform AJAX PATCH and Trigger Visual Effects
      updateCandidateStageAjax(candidateId, newStage, $card, originStage);
    }
  }).disableSelection();
}

/**
 * ----------------------------------------------------------------------------
 * 3. AJAX Update (PATCH /candidates/:id) with Pulse Effect & Toasts
 * ----------------------------------------------------------------------------
 */
function updateCandidateStageAjax(candidateId, newStage, $card, originStage) {
  // Find candidate in memory
  const candidate = AppState.candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  // Add history entry
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const stageDisplayName = formatStageName(newStage);
  const historyEntry = `${dateStr}: Moved to ${stageDisplayName}`;
  
  if (!candidate.history) candidate.history = [];
  candidate.history.push(historyEntry);
  candidate.stage = newStage;

  // Update Counters immediately for responsive UI feel
  updateColumnCounters();

  if (AppState.isServerOnline) {
    /**
     * Technical Requirement:
     * Ajax: PATCH /candidates/:id with new stage
     */
    $.ajax({
      url: `${API_BASE_URL}/candidates/${candidateId}`,
      type: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({
        stage: newStage,
        history: candidate.history
      }),
      success: function (response) {
        console.log(`AJAX PATCH Success for #${candidateId}:`, response);
        saveToLocalStorage(AppState.candidates);

        // Technical Requirement: Pulse card on successful move
        triggerPulseEffect($card);

        // Technical Requirement: Toast notification with Undo action
        showToast(
          `Moved <strong>${candidate.name}</strong> to <em>${stageDisplayName}</em>`,
          'success',
          true
        );
      },
      error: function (xhr, status, error) {
        console.error('AJAX PATCH failed:', error);
        // Error handling: Revert UI card back to origin column
        revertCardToOrigin($card, originStage);
        showToast(`Failed to update candidate status: ${error}`, 'error');
      }
    });
  } else {
    // Offline / LocalStorage Mode Fallback
    saveToLocalStorage(AppState.candidates);
    triggerPulseEffect($card);
    showToast(
      `[Offline Mode] Moved <strong>${candidate.name}</strong> to <em>${stageDisplayName}</em>`,
      'success',
      true
    );
  }
}

/**
 * Pulse Effect on successful card move
 * Technical Requirement: Pulse card on successful move
 */
function triggerPulseEffect($card) {
  // Using jQuery Chaining and CSS Animation class
  $card.addClass('pulse-success').delay(700).queue(function (next) {
    $(this).removeClass('pulse-success');
    next();
  });
}

/**
 * Revert card to original column on Ajax failure
 */
function revertCardToOrigin($card, originStage) {
  const $targetCardsContainer = $(`.column[data-stage="${originStage}"] .column-cards`);
  $card.detach().appendTo($targetCardsContainer);
  updateColumnCounters();
}

/**
 * ----------------------------------------------------------------------------
 * 4. Rendering & DOM Generation
 * ----------------------------------------------------------------------------
 */
function renderAllColumns() {
  const stages = ['applied', 'screening', 'interview', 'hired_rejected'];

  stages.forEach(stage => {
    /**
     * Technical Requirement:
     * Selectors: $('.column[data-stage="screening"]')
     */
    const $columnContainer = $(`.column[data-stage="${stage}"] .column-cards`);
    $columnContainer.empty();

    /**
     * Use jQuery grep to filter candidates for each stage
     */
    const stageCandidates = $.grep(AppState.candidates, function (c) {
      return c.stage === stage;
    });

    if (stageCandidates.length === 0) {
      $columnContainer.append('<div class="empty-state">No candidates in this stage</div>');
    } else {
      stageCandidates.forEach(candidate => {
        const cardHtml = createCardElement(candidate);
        $columnContainer.append(cardHtml);
      });
    }
  });

  // Refresh counters and stats
  updateColumnCounters();
}

/**
 * Generates HTML for a Candidate Card
 */
function createCardElement(candidate) {
  const initials = candidate.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  let scoreClass = 'score-med';
  if (candidate.score >= 8.0) scoreClass = 'score-high';
  else if (candidate.score < 6.0) scoreClass = 'score-low';

  /**
   * Technical Requirement:
   * Selectors: $('.kanban-card[data-id]')
   */
  return `
    <article class="kanban-card" data-id="${candidate.id}" data-name="${escapeHtml(candidate.name)}" data-role="${escapeHtml(candidate.role)}" data-score="${candidate.score}">
      <div class="card-header">
        <div class="candidate-avatar">${initials}</div>
        <span class="candidate-id-badge">#${candidate.id}</span>
      </div>
      <h3 class="candidate-name">${escapeHtml(candidate.name)}</h3>
      <span class="candidate-role">${escapeHtml(candidate.role)}</span>
      
      <div class="card-meta">
        <span class="score-badge ${scoreClass}" title="Technical Assessment Score">
          <i class="fa-solid fa-star"></i> ${candidate.score.toFixed(1)}
        </span>
        <span class="interview-date" title="Interview Scheduled Date">
          <i class="fa-regular fa-calendar"></i> ${candidate.interviewDate || 'TBD'}
        </span>
      </div>

      <div class="card-footer">
        <span class="view-details-link btn-view-candidate" data-id="${candidate.id}">
          <i class="fa-solid fa-circle-info"></i> View Details
        </span>
      </div>
    </article>
  `;
}

/**
 * Update Column Counters and Metric Bar
 */
function updateColumnCounters() {
  const stages = ['applied', 'screening', 'interview', 'hired_rejected'];
  let totalCards = 0;
  let activeCards = 0;

  stages.forEach(stage => {
    // Select column and count actual card elements inside it
    const count = $(`.column[data-stage="${stage}"] .kanban-card`).length;
    $(`#badge-${stage}`).text(count);

    totalCards += count;
    if (stage !== 'hired_rejected') {
      activeCards += count;
    }

    // Toggle empty state placeholder if column has 0 cards
    const $cardsContainer = $(`.column[data-stage="${stage}"] .column-cards`);
    if (count === 0 && $cardsContainer.find('.empty-state').length === 0) {
      $cardsContainer.append('<div class="empty-state">No candidates in this stage</div>');
    } else if (count > 0) {
      $cardsContainer.find('.empty-state').remove();
    }
  });

  $('#total-candidates-count').text(totalCards);
  $('#active-candidates-count').text(activeCards);
}

/**
 * ----------------------------------------------------------------------------
 * 5. Event Listeners & UI Interactions
 * ----------------------------------------------------------------------------
 */
function setupEventListeners() {
  /**
   * Bonus Point 1: Search within board
   * Real-time search using jQuery .filter() and :contains
   */
  $('#candidate-search').on('input keyup', function () {
    const query = $(this).val().trim().toLowerCase();
    const selectedRole = $('#role-filter').val();
    filterCandidates(query, selectedRole);
  });

  // Role Filter Dropdown change
  $('#role-filter').on('change', function () {
    const selectedRole = $(this).val();
    const query = $('#candidate-search').val().trim().toLowerCase();
    filterCandidates(query, selectedRole);
  });

  /**
   * Sort Dropdown inside each column header
   */
  $('.column-sort-trigger').on('change', function () {
    const stage = $(this).data('stage');
    const sortType = $(this).val();
    sortColumnCards(stage, sortType);
  });

  /**
   * Candidate Details Modal:
   * Technical Requirement: Click card -> modal with details and history
   */
  $(document).on('click', '.kanban-card, .btn-view-candidate', function (e) {
    // Prevent modal opening when clicking interactive buttons or during drag
    if ($(e.target).is('select') || $(e.target).is('input')) return;

    const $card = $(this).closest('.kanban-card');
    const candidateId = parseInt($card.attr('data-id'), 10);
    openCandidateModal(candidateId);
  });

  // Close modals
  $('#btn-close-details-modal, #btn-cancel-details').on('click', function () {
    $('#candidate-modal').fadeOut(200);
  });

  $('#btn-close-add-modal, #btn-cancel-add').on('click', function () {
    $('#add-candidate-modal').fadeOut(200);
  });

  // Close modal when clicking on backdrop
  $('.modal-overlay').on('click', function (e) {
    if ($(e.target).hasClass('modal-overlay')) {
      $(this).fadeOut(200);
    }
  });

  // Open "Add Candidate" Modal
  $('#btn-open-add-modal').on('click', function () {
    resetAddCandidateForm();
    $('#add-candidate-modal').css('display', 'flex').hide().fadeIn(250);
  });

  // Submit "Add Candidate" Form with RegEx Validations
  $('#add-candidate-form').on('submit', function (e) {
    e.preventDefault();
    handleAddCandidateSubmit();
  });

  // Save stage change from inside Candidate Details Modal
  $('#btn-save-details-stage').on('click', function () {
    handleDetailsStageUpdate();
  });

  // Bonus Point: Undo Move click event
  $(document).on('click', '#btn-undo-move', function () {
    handleUndoLastMove();
  });
}

/**
 * Filter candidates by search query and role
 */
function filterCandidates(query, role) {
  $('.kanban-card').each(function () {
    const $card = $(this);
    const name = ($card.data('name') || '').toLowerCase();
    const cardRole = $card.data('role') || '';

    const matchesQuery = query === '' || name.includes(query) || cardRole.toLowerCase().includes(query);
    const matchesRole = role === 'all' || cardRole === role;

    if (matchesQuery && matchesRole) {
      $card.show();
    } else {
      $card.hide();
    }
  });

  updateColumnCounters();
}

/**
 * Sort cards inside a specific column
 */
function sortColumnCards(stage, sortType) {
  const $columnCards = $(`.column[data-stage="${stage}"] .column-cards`);
  const $cards = $columnCards.find('.kanban-card').get();

  if ($cards.length <= 1 || sortType === 'default') return;

  $cards.sort(function (a, b) {
    const scoreA = parseFloat($(a).data('score')) || 0;
    const scoreB = parseFloat($(b).data('score')) || 0;
    const nameA = ($(a).data('name') || '').toLowerCase();
    const nameB = ($(b).data('name') || '').toLowerCase();

    if (sortType === 'score-desc') return scoreB - scoreA;
    if (sortType === 'score-asc') return scoreA - scoreB;
    if (sortType === 'name-asc') return nameA.localeCompare(nameB);
    return 0;
  });

  // Re-append sorted elements using jQuery
  $.each($cards, function (index, card) {
    $columnCards.append(card);
  });
}

/**
 * ----------------------------------------------------------------------------
 * 6. Candidate Details Modal Handling
 * ----------------------------------------------------------------------------
 */
function openCandidateModal(candidateId) {
  const candidate = AppState.candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  AppState.activeCandidateId = candidateId;

  // Populate modal data
  $('#modal-candidate-name').text(candidate.name);
  $('#modal-candidate-avatar').text(candidate.name.substring(0, 2).toUpperCase());
  $('#modal-candidate-role').text(candidate.role);
  $('#modal-candidate-id').text(`ID: #${candidate.id}`);
  $('#modal-candidate-score').text(`${candidate.score.toFixed(1)} / 10`);
  $('#modal-candidate-date').text(candidate.interviewDate || 'Not scheduled');
  $('#modal-candidate-email').text(candidate.email || 'N/A');
  $('#modal-stage-select').val(candidate.stage);

  // Render History Timeline
  const $historyContainer = $('#modal-candidate-history');
  $historyContainer.empty();

  if (candidate.history && candidate.history.length > 0) {
    candidate.history.forEach(item => {
      $historyContainer.append(`<li class="history-item">${escapeHtml(item)}</li>`);
    });
  } else {
    $historyContainer.append('<li class="history-item">Candidate record created</li>');
  }

  // Show modal with jQuery fadeIn
  $('#candidate-modal').css('display', 'flex').hide().fadeIn(250);
}

function handleDetailsStageUpdate() {
  const candidateId = AppState.activeCandidateId;
  const newStage = $('#modal-stage-select').val();
  const candidate = AppState.candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  if (candidate.stage === newStage) {
    $('#candidate-modal').fadeOut(200);
    return;
  }

  // Check WIP limit if moving to interview
  if (newStage === 'interview') {
    const currentCount = $('.column[data-stage="interview"] .kanban-card').length;
    if (currentCount >= WIP_LIMIT_INTERVIEW) {
      showToast(`⚠️ WIP Limit: Max ${WIP_LIMIT_INTERVIEW} candidates allowed in Interview stage.`, 'warning');
      return;
    }
  }

  const $card = $(`.kanban-card[data-id="${candidateId}"]`);
  const originStage = candidate.stage;

  // Move card DOM element to target column
  $(`.column[data-stage="${newStage}"] .column-cards`).prepend($card);

  $('#candidate-modal').fadeOut(200);

  // Trigger AJAX Update
  updateCandidateStageAjax(candidateId, newStage, $card, originStage);
}

/**
 * ----------------------------------------------------------------------------
 * 7. Bonus Point: Undo Last Move
 * ----------------------------------------------------------------------------
 */
function handleUndoLastMove() {
  if (!AppState.lastMove) {
    showToast('No move available to undo.', 'info');
    return;
  }

  const { candidateId, prevStage, newStage } = AppState.lastMove;
  const candidate = AppState.candidates.find(c => c.id === candidateId);
  if (!candidate) return;

  console.log(`[Undo] Reverting #${candidateId} from ${newStage} back to ${prevStage}`);

  const $card = $(`.kanban-card[data-id="${candidateId}"]`);
  const $targetCardsContainer = $(`.column[data-stage="${prevStage}"] .column-cards`);

  // Animate DOM move back
  $card.detach().prependTo($targetCardsContainer);

  // Clear undo state to avoid double undo
  AppState.lastMove = null;

  // Add undo to candidate history
  const today = new Date().toISOString().split('T')[0];
  candidate.history.push(`${today}: Move reverted back to ${formatStageName(prevStage)} (Undo)`);
  candidate.stage = prevStage;

  updateColumnCounters();

  // Sync with server/storage
  if (AppState.isServerOnline) {
    $.ajax({
      url: `${API_BASE_URL}/candidates/${candidateId}`,
      type: 'PATCH',
      contentType: 'application/json',
      data: JSON.stringify({
        stage: prevStage,
        history: candidate.history
      }),
      success: function () {
        triggerPulseEffect($card);
        saveToLocalStorage(AppState.candidates);
        showToast(`Undone: Moved <strong>${candidate.name}</strong> back to <em>${formatStageName(prevStage)}</em>`, 'info');
      }
    });
  } else {
    triggerPulseEffect($card);
    saveToLocalStorage(AppState.candidates);
    showToast(`Undone: Moved <strong>${candidate.name}</strong> back to <em>${formatStageName(prevStage)}</em>`, 'info');
  }
}

/**
 * ----------------------------------------------------------------------------
 * 8. Add Candidate Form with RegEx Validation & Duplicate Prevention
 * ----------------------------------------------------------------------------
 */
function handleAddCandidateSubmit() {
  const name = $('#cand-name').val().trim();
  const email = $('#cand-email').val().trim();
  const role = $('#cand-role').val();
  const score = parseFloat($('#cand-score').val());
  const date = $('#cand-date').val();
  const stage = $('#cand-stage').val();

  let isValid = true;

  // Validation 1: Name RegEx (3 to 50 characters, letters and spaces only)
  const nameRegex = /^[A-Za-z\s]{3,50}$/;
  if (!nameRegex.test(name)) {
    $('#cand-name').addClass('is-invalid');
    $('#feedback-name').show();
    isValid = false;
  } else {
    $('#cand-name').removeClass('is-invalid');
    $('#feedback-name').hide();
  }

  // Validation 2: Email RegEx
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    $('#cand-email').addClass('is-invalid');
    $('#feedback-email').show();
    isValid = false;
  } else {
    $('#cand-email').removeClass('is-invalid');
    $('#feedback-email').hide();
  }

  // Validation 3: Role selection
  if (!role) {
    $('#cand-role').addClass('is-invalid');
    $('#feedback-role').show();
    isValid = false;
  } else {
    $('#cand-role').removeClass('is-invalid');
    $('#feedback-role').hide();
  }

  // Validation 4: Score Range (0.0 to 10.0)
  if (isNaN(score) || score < 0 || score > 10) {
    $('#cand-score').addClass('is-invalid');
    $('#feedback-score').show();
    isValid = false;
  } else {
    $('#cand-score').removeClass('is-invalid');
    $('#feedback-score').hide();
  }

  // Validation 5: Interview Date
  if (!date) {
    $('#cand-date').addClass('is-invalid');
    $('#feedback-date').show();
    isValid = false;
  } else {
    $('#cand-date').removeClass('is-invalid');
    $('#feedback-date').hide();
  }

  if (!isValid) return;

  // Duplicate Check: Avoid Duplicate Entries by email or exact name
  const isDuplicate = AppState.candidates.some(
    c => c.email.toLowerCase() === email.toLowerCase() || c.name.toLowerCase() === name.toLowerCase()
  );

  if (isDuplicate) {
    showToast(`⚠️ Duplicate candidate detected! A candidate with name "${name}" or email "${email}" already exists.`, 'warning');
    return;
  }

  // Generate Unique ID
  const maxId = AppState.candidates.length > 0
    ? Math.max(...AppState.candidates.map(c => parseInt(c.id, 10) || 0))
    : 200;
  const newId = maxId + 1;

  const newCandidate = {
    id: newId,
    name: name,
    role: role,
    stage: stage,
    score: score,
    interviewDate: date,
    resumeUrl: '#',
    email: email,
    history: [
      `${new Date().toISOString().split('T')[0]}: Applied for ${role}`
    ]
  };

  // Check WIP Limit if directly adding to Interview
  if (stage === 'interview') {
    const currentInterviewCount = $('.column[data-stage="interview"] .kanban-card').length;
    if (currentInterviewCount >= WIP_LIMIT_INTERVIEW) {
      showToast(`⚠️ Cannot add to Interview stage: WIP limit (${WIP_LIMIT_INTERVIEW}) reached.`, 'warning');
      return;
    }
  }

  // Save candidate
  if (AppState.isServerOnline) {
    $.ajax({
      url: `${API_BASE_URL}/candidates`,
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(newCandidate),
      success: function (created) {
        AppState.candidates.push(created);
        saveToLocalStorage(AppState.candidates);
        appendNewCandidateCard(created);
        $('#add-candidate-modal').fadeOut(200);
        showToast(`Candidate <strong>${name}</strong> added successfully!`, 'success');
      },
      error: function () {
        // Fallback save locally if POST fails
        AppState.candidates.push(newCandidate);
        saveToLocalStorage(AppState.candidates);
        appendNewCandidateCard(newCandidate);
        $('#add-candidate-modal').fadeOut(200);
        showToast(`Candidate added to LocalStorage!`, 'success');
      }
    });
  } else {
    AppState.candidates.push(newCandidate);
    saveToLocalStorage(AppState.candidates);
    appendNewCandidateCard(newCandidate);
    $('#add-candidate-modal').fadeOut(200);
    showToast(`Candidate <strong>${name}</strong> added to LocalStorage!`, 'success');
  }
}

function appendNewCandidateCard(candidate) {
  const cardHtml = createCardElement(candidate);
  const $targetColumn = $(`.column[data-stage="${candidate.stage}"] .column-cards`);
  $targetColumn.find('.empty-state').remove();
  const $newCard = $(cardHtml).hide().prependTo($targetColumn).fadeIn(400);
  triggerPulseEffect($newCard);
  updateColumnCounters();
}

function resetAddCandidateForm() {
  $('#add-candidate-form')[0].reset();
  $('.form-control').removeClass('is-invalid');
  $('.validation-feedback').hide();
  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  $('#cand-date').val(tomorrow.toISOString().split('T')[0]);
}

/**
 * ----------------------------------------------------------------------------
 * 9. Toast Notifications System
 * ----------------------------------------------------------------------------
 */
function showToast(message, type = 'info', showUndo = false) {
  const toastId = 'toast-' + Date.now();
  let toastClass = 'toast-info';
  let icon = '<i class="fa-solid fa-circle-info"></i>';

  if (type === 'success') {
    toastClass = 'toast-success';
    icon = '<i class="fa-solid fa-circle-check" style="color: #10b981;"></i>';
  } else if (type === 'warning') {
    toastClass = 'toast-warning';
    icon = '<i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i>';
  } else if (type === 'error') {
    toastClass = 'toast-error';
    icon = '<i class="fa-solid fa-circle-xmark" style="color: #ef4444;"></i>';
  }

  const undoHtml = showUndo
    ? `<button class="toast-undo-btn" id="btn-undo-move"><i class="fa-solid fa-rotate-left"></i> Undo</button>`
    : '';

  const toastHtml = `
    <div class="toast ${toastClass}" id="${toastId}">
      ${icon}
      <span class="toast-message">${message}</span>
      ${undoHtml}
    </div>
  `;

  const $toast = $(toastHtml).hide().appendTo('#toast-container').slideDown(250);

  // Auto remove after 5 seconds
  setTimeout(function () {
    $toast.fadeOut(300, function () {
      $(this).remove();
    });
  }, 5000);
}

/**
 * ----------------------------------------------------------------------------
 * 10. Helper Utilities
 * ----------------------------------------------------------------------------
 */
function formatStageName(stage) {
  switch (stage) {
    case 'applied': return 'Applied';
    case 'screening': return 'Screening';
    case 'interview': return 'Interview';
    case 'hired_rejected': return 'Hired / Rejected';
    default: return stage;
  }
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
