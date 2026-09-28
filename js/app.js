/**
 * ============================================================================
 * Recruitment Kanban Board (Drag-Drop Pipeline) [BHATIA-T1]
 * ============================================================================
 * Concepts Covered:
 * - jQuery Selectors: $('.kanban-card[data-id]'), $('.column[data-stage="..."]')
 * - DOM Traversing: $(this).closest('.column').data('stage'), .find(), .parent()
 * - jQuery UI Sortable: connectWith, placeholder, revert, distance, start/receive/stop
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

// Embedded Seed Data (Ensures 100% reliable load even if file:/// CORS blocks db.json)
const SEED_CANDIDATES = [
  {
    "id": 201,
    "name": "Priya Sharma",
    "role": "Frontend Dev",
    "stage": "screening",
    "score": 8.2,
    "interviewDate": "2025-11-18",
    "resumeUrl": "#",
    "email": "priya.sharma@example.com",
    "history": [
      "2025-11-10: Applied for Frontend Dev",
      "2025-11-12: Moved to Screening"
    ]
  },
  {
    "id": 202,
    "name": "Rahul Reddy",
    "role": "QA Engineer",
    "stage": "screening",
    "score": 9.4,
    "interviewDate": "2025-12-11",
    "resumeUrl": "#",
    "email": "rahul.reddy202@example.com",
    "history": [
      "2025-10-15: Applied for QA Engineer",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 203,
    "name": "Amit Joshi",
    "role": "Backend Dev",
    "stage": "interview",
    "score": 7.2,
    "interviewDate": "2025-10-16",
    "resumeUrl": "#",
    "email": "amit.joshi203@example.com",
    "history": [
      "2025-10-15: Applied for Backend Dev",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 204,
    "name": "Sneha Bhatia",
    "role": "Payroll Specialist",
    "stage": "hired_rejected",
    "score": 8.9,
    "interviewDate": "2025-11-21",
    "resumeUrl": "#",
    "email": "sneha.bhatia204@example.com",
    "history": [
      "2025-10-15: Applied for Payroll Specialist",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 205,
    "name": "Vikram Das",
    "role": "DevOps Engineer",
    "stage": "applied",
    "score": 6.7,
    "interviewDate": "2025-12-26",
    "resumeUrl": "#",
    "email": "vikram.das205@example.com",
    "history": [
      "2025-10-15: Applied for DevOps Engineer"
    ]
  },
  {
    "id": 206,
    "name": "Ananya Rao",
    "role": "Full Stack Dev",
    "stage": "screening",
    "score": 8.4,
    "interviewDate": "2025-10-03",
    "resumeUrl": "#",
    "email": "ananya.rao206@example.com",
    "history": [
      "2025-10-15: Applied for Full Stack Dev",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 207,
    "name": "Rohan Verma",
    "role": "HR Executive",
    "stage": "interview",
    "score": 6.2,
    "interviewDate": "2025-11-08",
    "resumeUrl": "#",
    "email": "rohan.verma207@example.com",
    "history": [
      "2025-10-15: Applied for HR Executive",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 208,
    "name": "Kavita Gupta",
    "role": "Product Manager",
    "stage": "hired_rejected",
    "score": 7.9,
    "interviewDate": "2025-12-13",
    "resumeUrl": "#",
    "email": "kavita.gupta208@example.com",
    "history": [
      "2025-10-15: Applied for Product Manager",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 209,
    "name": "Suresh Mehta",
    "role": "UI/UX Designer",
    "stage": "applied",
    "score": 9.6,
    "interviewDate": "2025-10-18",
    "resumeUrl": "#",
    "email": "suresh.mehta209@example.com",
    "history": [
      "2025-10-15: Applied for UI/UX Designer"
    ]
  },
  {
    "id": 210,
    "name": "Neha Chopra",
    "role": "Frontend Dev",
    "stage": "screening",
    "score": 7.4,
    "interviewDate": "2025-11-23",
    "resumeUrl": "#",
    "email": "neha.chopra210@example.com",
    "history": [
      "2025-10-15: Applied for Frontend Dev",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 211,
    "name": "Arjun Saxena",
    "role": "Data Analyst",
    "stage": "interview",
    "score": 9.1,
    "interviewDate": "2025-12-28",
    "resumeUrl": "#",
    "email": "arjun.saxena211@example.com",
    "history": [
      "2025-10-15: Applied for Data Analyst",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 212,
    "name": "Pooja Iyer",
    "role": "QA Engineer",
    "stage": "hired_rejected",
    "score": 6.9,
    "interviewDate": "2025-10-05",
    "resumeUrl": "#",
    "email": "pooja.iyer212@example.com",
    "history": [
      "2025-10-15: Applied for QA Engineer",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 213,
    "name": "Manish Yadav",
    "role": "Backend Dev",
    "stage": "applied",
    "score": 8.6,
    "interviewDate": "2025-11-10",
    "resumeUrl": "#",
    "email": "manish.yadav213@example.com",
    "history": [
      "2025-10-15: Applied for Backend Dev"
    ]
  },
  {
    "id": 214,
    "name": "Deepika Patel",
    "role": "Payroll Specialist",
    "stage": "screening",
    "score": 6.4,
    "interviewDate": "2025-12-15",
    "resumeUrl": "#",
    "email": "deepika.patel214@example.com",
    "history": [
      "2025-10-15: Applied for Payroll Specialist",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 215,
    "name": "Aditya Kumar",
    "role": "DevOps Engineer",
    "stage": "interview",
    "score": 8.1,
    "interviewDate": "2025-10-20",
    "resumeUrl": "#",
    "email": "aditya.kumar215@example.com",
    "history": [
      "2025-10-15: Applied for DevOps Engineer",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 216,
    "name": "Ritu Nair",
    "role": "Full Stack Dev",
    "stage": "hired_rejected",
    "score": 9.8,
    "interviewDate": "2025-11-25",
    "resumeUrl": "#",
    "email": "ritu.nair216@example.com",
    "history": [
      "2025-10-15: Applied for Full Stack Dev",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 217,
    "name": "Karan Malhotra",
    "role": "HR Executive",
    "stage": "applied",
    "score": 7.6,
    "interviewDate": "2025-12-02",
    "resumeUrl": "#",
    "email": "karan.malhotra217@example.com",
    "history": [
      "2025-10-15: Applied for HR Executive"
    ]
  },
  {
    "id": 218,
    "name": "Meera Deshmukh",
    "role": "Product Manager",
    "stage": "screening",
    "score": 9.3,
    "interviewDate": "2025-10-07",
    "resumeUrl": "#",
    "email": "meera.deshmukh218@example.com",
    "history": [
      "2025-10-15: Applied for Product Manager",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 219,
    "name": "Nikhil Menon",
    "role": "UI/UX Designer",
    "stage": "interview",
    "score": 7.1,
    "interviewDate": "2025-11-12",
    "resumeUrl": "#",
    "email": "nikhil.menon219@example.com",
    "history": [
      "2025-10-15: Applied for UI/UX Designer",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 220,
    "name": "Divya Sharma",
    "role": "Frontend Dev",
    "stage": "hired_rejected",
    "score": 8.8,
    "interviewDate": "2025-12-17",
    "resumeUrl": "#",
    "email": "divya.sharma220@example.com",
    "history": [
      "2025-10-15: Applied for Frontend Dev",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 221,
    "name": "Siddharth Singh",
    "role": "Data Analyst",
    "stage": "applied",
    "score": 6.6,
    "interviewDate": "2025-10-22",
    "resumeUrl": "#",
    "email": "siddharth.singh221@example.com",
    "history": [
      "2025-10-15: Applied for Data Analyst"
    ]
  },
  {
    "id": 222,
    "name": "Tanvi Reddy",
    "role": "QA Engineer",
    "stage": "screening",
    "score": 8.3,
    "interviewDate": "2025-11-27",
    "resumeUrl": "#",
    "email": "tanvi.reddy222@example.com",
    "history": [
      "2025-10-15: Applied for QA Engineer",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 223,
    "name": "Varun Joshi",
    "role": "Backend Dev",
    "stage": "interview",
    "score": 6.1,
    "interviewDate": "2025-12-04",
    "resumeUrl": "#",
    "email": "varun.joshi223@example.com",
    "history": [
      "2025-10-15: Applied for Backend Dev",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 224,
    "name": "Isha Bhatia",
    "role": "Payroll Specialist",
    "stage": "hired_rejected",
    "score": 7.8,
    "interviewDate": "2025-10-09",
    "resumeUrl": "#",
    "email": "isha.bhatia224@example.com",
    "history": [
      "2025-10-15: Applied for Payroll Specialist",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 225,
    "name": "Abhishek Das",
    "role": "DevOps Engineer",
    "stage": "applied",
    "score": 9.5,
    "interviewDate": "2025-11-14",
    "resumeUrl": "#",
    "email": "abhishek.das225@example.com",
    "history": [
      "2025-10-15: Applied for DevOps Engineer"
    ]
  },
  {
    "id": 226,
    "name": "Swati Rao",
    "role": "Full Stack Dev",
    "stage": "screening",
    "score": 7.3,
    "interviewDate": "2025-12-19",
    "resumeUrl": "#",
    "email": "swati.rao226@example.com",
    "history": [
      "2025-10-15: Applied for Full Stack Dev",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 227,
    "name": "Gaurav Verma",
    "role": "HR Executive",
    "stage": "interview",
    "score": 9,
    "interviewDate": "2025-10-24",
    "resumeUrl": "#",
    "email": "gaurav.verma227@example.com",
    "history": [
      "2025-10-15: Applied for HR Executive",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 228,
    "name": "Shweta Gupta",
    "role": "Product Manager",
    "stage": "hired_rejected",
    "score": 6.8,
    "interviewDate": "2025-11-01",
    "resumeUrl": "#",
    "email": "shweta.gupta228@example.com",
    "history": [
      "2025-10-15: Applied for Product Manager",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 229,
    "name": "Rajesh Mehta",
    "role": "UI/UX Designer",
    "stage": "applied",
    "score": 8.5,
    "interviewDate": "2025-12-06",
    "resumeUrl": "#",
    "email": "rajesh.mehta229@example.com",
    "history": [
      "2025-10-15: Applied for UI/UX Designer"
    ]
  },
  {
    "id": 230,
    "name": "Preeti Chopra",
    "role": "Frontend Dev",
    "stage": "screening",
    "score": 6.3,
    "interviewDate": "2025-10-11",
    "resumeUrl": "#",
    "email": "preeti.chopra230@example.com",
    "history": [
      "2025-10-15: Applied for Frontend Dev",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 231,
    "name": "Harsh Saxena",
    "role": "Data Analyst",
    "stage": "interview",
    "score": 8,
    "interviewDate": "2025-11-16",
    "resumeUrl": "#",
    "email": "harsh.saxena231@example.com",
    "history": [
      "2025-10-15: Applied for Data Analyst",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 232,
    "name": "Simran Iyer",
    "role": "QA Engineer",
    "stage": "hired_rejected",
    "score": 9.7,
    "interviewDate": "2025-12-21",
    "resumeUrl": "#",
    "email": "simran.iyer232@example.com",
    "history": [
      "2025-10-15: Applied for QA Engineer",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 233,
    "name": "Akash Yadav",
    "role": "Backend Dev",
    "stage": "applied",
    "score": 7.5,
    "interviewDate": "2025-10-26",
    "resumeUrl": "#",
    "email": "akash.yadav233@example.com",
    "history": [
      "2025-10-15: Applied for Backend Dev"
    ]
  },
  {
    "id": 234,
    "name": "Shruti Patel",
    "role": "Payroll Specialist",
    "stage": "screening",
    "score": 9.2,
    "interviewDate": "2025-11-03",
    "resumeUrl": "#",
    "email": "shruti.patel234@example.com",
    "history": [
      "2025-10-15: Applied for Payroll Specialist",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 235,
    "name": "Kartik Kumar",
    "role": "DevOps Engineer",
    "stage": "interview",
    "score": 7,
    "interviewDate": "2025-12-08",
    "resumeUrl": "#",
    "email": "kartik.kumar235@example.com",
    "history": [
      "2025-10-15: Applied for DevOps Engineer",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 236,
    "name": "Bhavna Nair",
    "role": "Full Stack Dev",
    "stage": "hired_rejected",
    "score": 8.7,
    "interviewDate": "2025-10-13",
    "resumeUrl": "#",
    "email": "bhavna.nair236@example.com",
    "history": [
      "2025-10-15: Applied for Full Stack Dev",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 237,
    "name": "Mayank Malhotra",
    "role": "HR Executive",
    "stage": "applied",
    "score": 6.5,
    "interviewDate": "2025-11-18",
    "resumeUrl": "#",
    "email": "mayank.malhotra237@example.com",
    "history": [
      "2025-10-15: Applied for HR Executive"
    ]
  },
  {
    "id": 238,
    "name": "Pallavi Deshmukh",
    "role": "Product Manager",
    "stage": "screening",
    "score": 8.2,
    "interviewDate": "2025-12-23",
    "resumeUrl": "#",
    "email": "pallavi.deshmukh238@example.com",
    "history": [
      "2025-10-15: Applied for Product Manager",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 239,
    "name": "Sachin Menon",
    "role": "UI/UX Designer",
    "stage": "interview",
    "score": 9.9,
    "interviewDate": "2025-10-28",
    "resumeUrl": "#",
    "email": "sachin.menon239@example.com",
    "history": [
      "2025-10-15: Applied for UI/UX Designer",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 240,
    "name": "Komal Sharma",
    "role": "Frontend Dev",
    "stage": "hired_rejected",
    "score": 7.7,
    "interviewDate": "2025-11-05",
    "resumeUrl": "#",
    "email": "komal.sharma240@example.com",
    "history": [
      "2025-10-15: Applied for Frontend Dev",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 241,
    "name": "Prateek Singh",
    "role": "Data Analyst",
    "stage": "applied",
    "score": 9.4,
    "interviewDate": "2025-12-10",
    "resumeUrl": "#",
    "email": "prateek.singh241@example.com",
    "history": [
      "2025-10-15: Applied for Data Analyst"
    ]
  },
  {
    "id": 242,
    "name": "Monika Reddy",
    "role": "QA Engineer",
    "stage": "screening",
    "score": 7.2,
    "interviewDate": "2025-10-15",
    "resumeUrl": "#",
    "email": "monika.reddy242@example.com",
    "history": [
      "2025-10-15: Applied for QA Engineer",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 243,
    "name": "Vishal Joshi",
    "role": "Backend Dev",
    "stage": "interview",
    "score": 8.9,
    "interviewDate": "2025-11-20",
    "resumeUrl": "#",
    "email": "vishal.joshi243@example.com",
    "history": [
      "2025-10-15: Applied for Backend Dev",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 244,
    "name": "Aarti Bhatia",
    "role": "Payroll Specialist",
    "stage": "hired_rejected",
    "score": 6.7,
    "interviewDate": "2025-12-25",
    "resumeUrl": "#",
    "email": "aarti.bhatia244@example.com",
    "history": [
      "2025-10-15: Applied for Payroll Specialist",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 245,
    "name": "Kunal Das",
    "role": "DevOps Engineer",
    "stage": "applied",
    "score": 8.4,
    "interviewDate": "2025-10-02",
    "resumeUrl": "#",
    "email": "kunal.das245@example.com",
    "history": [
      "2025-10-15: Applied for DevOps Engineer"
    ]
  },
  {
    "id": 246,
    "name": "Rashmi Rao",
    "role": "Full Stack Dev",
    "stage": "screening",
    "score": 6.2,
    "interviewDate": "2025-11-07",
    "resumeUrl": "#",
    "email": "rashmi.rao246@example.com",
    "history": [
      "2025-10-15: Applied for Full Stack Dev",
      "2025-11-01: Moved to Screening"
    ]
  },
  {
    "id": 247,
    "name": "Tarun Verma",
    "role": "HR Executive",
    "stage": "interview",
    "score": 7.9,
    "interviewDate": "2025-12-12",
    "resumeUrl": "#",
    "email": "tarun.verma247@example.com",
    "history": [
      "2025-10-15: Applied for HR Executive",
      "2025-11-01: Moved to Interview"
    ]
  },
  {
    "id": 248,
    "name": "Payal Gupta",
    "role": "Product Manager",
    "stage": "hired_rejected",
    "score": 9.6,
    "interviewDate": "2025-10-17",
    "resumeUrl": "#",
    "email": "payal.gupta248@example.com",
    "history": [
      "2025-10-15: Applied for Product Manager",
      "2025-11-01: Moved to Hired/rejected"
    ]
  },
  {
    "id": 249,
    "name": "Alok Mehta",
    "role": "UI/UX Designer",
    "stage": "applied",
    "score": 7.4,
    "interviewDate": "2025-11-22",
    "resumeUrl": "#",
    "email": "alok.mehta249@example.com",
    "history": [
      "2025-10-15: Applied for UI/UX Designer"
    ]
  },
  {
    "id": 250,
    "name": "Sunita Chopra",
    "role": "Frontend Dev",
    "stage": "screening",
    "score": 9.1,
    "interviewDate": "2025-12-27",
    "resumeUrl": "#",
    "email": "sunita.chopra250@example.com",
    "history": [
      "2025-10-15: Applied for Frontend Dev",
      "2025-11-01: Moved to Screening"
    ]
  }
];

// Application State
const AppState = {
  candidates: [],
  isServerOnline: false,
  lastMove: null, // Stores { candidateId, prevStage, prevIndex, newStage } for Undo
  activeCandidateId: null
};

// Drag tracking flag to prevent click modal during or after drag
let isDragging = false;

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
    timeout: 2500,
    success: function (data) {
      console.log('Connected to JSON Server successfully!', data.length, 'records found.');
      AppState.isServerOnline = true;
      AppState.candidates = data;
      saveToLocalStorage(data);
      updateServerStatusIndicator('online', 'JSON Server Online (:3000)');
      renderAllColumns();
    },
    error: function (xhr, status, error) {
      console.warn('JSON Server offline or unreachable. Falling back to LocalStorage & seed data:', error);
      AppState.isServerOnline = false;
      updateServerStatusIndicator('offline', 'Local Storage Mode (Offline)');
      loadFallbackData();
    }
  });
}

/**
 * Fallback to LocalStorage or embedded seed candidates if server is offline
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

  // Use embedded SEED_CANDIDATES directly (zero CORS issues on file:///)
  AppState.candidates = JSON.parse(JSON.stringify(SEED_CANDIDATES));
  saveToLocalStorage(AppState.candidates);
  console.log('Loaded embedded seed candidates:', AppState.candidates.length);
  renderAllColumns();
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
   * Technical Requirements:
   * - sortable({ connectWith: '.column-cards', placeholder: 'kanban-placeholder' })
   * - Smooth drag-drop with placeholder and revert
   */
  $('.column-cards').sortable({
    connectWith: '.column-cards',
    items: '> .kanban-card',
    placeholder: 'kanban-placeholder',
    revert: 200,
    distance: 5, // Prevents accidental dragging on quick clicks
    cursor: 'grabbing',
    cancel: 'button, select, input, a, .view-details-link',
    tolerance: 'pointer',
    opacity: 0.92,
    zIndex: 9999,

    // Fired when dragging starts
    start: function (event, ui) {
      isDragging = true;
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
      setTimeout(function () {
        isDragging = false;
      }, 150);
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
  });
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
      `[Local Mode] Moved <strong>${candidate.name}</strong> to <em>${stageDisplayName}</em>`,
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
  $card.addClass('pulse-success');
  setTimeout(function () {
    $card.removeClass('pulse-success');
  }, 800);
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
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div class="candidate-avatar">${initials}</div>
          <span class="candidate-id-badge">#${candidate.id}</span>
        </div>
        <i class="fa-solid fa-grip-vertical card-drag-grip" title="Drag card to move"></i>
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
    const count = $(`.column[data-stage="${stage}"] .kanban-card:visible`).length;
    $(`#badge-${stage}`).text(count);

    totalCards += count;
    if (stage !== 'hired_rejected') {
      activeCards += count;
    }

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
   * Real-time search using jQuery .filter()
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
  $(document).on('click', '.kanban-card', function (e) {
    // If a drag operation was performed or user clicked interactive controls, don't open modal
    if (isDragging) return;
    if ($(e.target).closest('button, select, input, a, .card-drag-grip').length) return;

    const candidateId = parseInt($(this).attr('data-id'), 10);
    openCandidateModal(candidateId);
  });

  // Explicit click on "View Details" button
  $(document).on('click', '.btn-view-candidate', function (e) {
    e.stopPropagation();
    const candidateId = parseInt($(this).attr('data-id'), 10);
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
