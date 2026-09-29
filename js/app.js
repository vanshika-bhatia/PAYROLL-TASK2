const KPI_CONFIG = {
  quality: { name: 'Work Quality', weight: 0.25 },
  punctuality: { name: 'Punctuality & Delivery', weight: 0.20 },
  teamwork: { name: 'Teamwork & Culture', weight: 0.20 },
  problemSolving: { name: 'Problem Solving', weight: 0.20 },
  communication: { name: 'Communication', weight: 0.15 }
};

const RATING_DESCRIPTIONS = {
  1: '1 - Unsatisfactory',
  2: '2 - Needs Improvement',
  3: '3 - Meets Expectations',
  4: '4 - Exceeds Expectations',
  5: '5 - Outstanding'
};

const DRAFT_STORAGE_KEY = 'bhatia_t2_review_draft';
const API_BASE = 'http://localhost:3000';

let employeeList = [];
let reviewList = [];
let radarChartInstance = null;

$(document).ready(function() {
  initRadarChart();
  setupNavigationTabs();
  setupStarRatings();
  setupCommentValidation();
  setupFormButtons();
  setupRestoreBanner();
  setupModal();
  setupSearchAndFilters();

  loadInitialData();
  startAutoSaveTimer();
});

function initRadarChart() {
  const canvas = document.getElementById('kpiRadarChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  radarChartInstance = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Quality', 'Punctuality', 'Teamwork', 'Problem Solving', 'Communication'],
      datasets: [
        {
          label: 'Current Review',
          data: [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(79, 70, 229, 0.25)',
          borderColor: '#4f46e5',
          pointBackgroundColor: '#4f46e5',
          borderWidth: 2
        },
        {
          label: 'Previous Quarter',
          data: [0, 0, 0, 0, 0],
          backgroundColor: 'rgba(148, 163, 184, 0.15)',
          borderColor: '#94a3b8',
          borderWidth: 2,
          borderDash: [4, 4],
          pointBackgroundColor: '#94a3b8'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize: 1,
            display: false
          },
          pointLabels: {
            font: {
              size: 11,
              weight: 'bold'
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            font: { size: 11 }
          }
        }
      }
    }
  });
}

function setupNavigationTabs() {
  $('.tab-btn').on('click', function() {
    const targetTab = $(this).data('tab');
    $('.tab-btn').removeClass('active');
    $(this).addClass('active');

    $('.tab-pane').removeClass('active').hide();
    $('#' + targetTab).fadeIn(200).addClass('active');

    if (targetTab === 'tab-at-risk') {
      renderAtRiskList();
    } else if (targetTab === 'tab-reviews') {
      renderReviewsTable(reviewList);
    }
  });
}

function setupStarRatings() {
  $('.star').on('mouseenter', function() {
    const currentVal = parseInt($(this).data('val'), 10);
    const container = $(this).closest('.star-rating');
    container.find('.star').each(function() {
      const starVal = parseInt($(this).data('val'), 10);
      if (starVal <= currentVal) {
        $(this).addClass('hovered');
      } else {
        $(this).removeClass('hovered');
      }
    });
  });

  $('.star-rating').on('mouseleave', function() {
    $(this).find('.star').removeClass('hovered');
  });

  $('.star').on('click', function() {
    const val = parseInt($(this).data('val'), 10);
    const container = $(this).closest('.star-rating');
    const kpiKey = container.data('kpi');
    const kpiRow = container.closest('.kpi-row');

    container.find('.star').each(function() {
      const starVal = parseInt($(this).data('val'), 10);
      if (starVal <= val) {
        $(this).addClass('selected');
      } else {
        $(this).removeClass('selected');
      }
    });

    $('#kpi-' + kpiKey).val(val);
    kpiRow.removeClass('unrated-error');

    const badge = $('#badge-' + kpiKey);
    badge.text(RATING_DESCRIPTIONS[val]);
    badge.removeClass('rated-good rated-warning rated-danger');
    if (val >= 4) {
      badge.addClass('rated-good');
    } else if (val === 3) {
      badge.addClass('rated-warning');
    } else {
      badge.addClass('rated-danger');
    }

    calculateWeightedScore();
    updateRadarChartData();
    checkCommentRequirementRule();
  });
}

function calculateWeightedScore() {
  let totalScore = 0;
  let totalWeight = 0;
  let allRated = true;

  for (const key in KPI_CONFIG) {
    const rawVal = $('#kpi-' + key).val();
    if (rawVal) {
      const val = parseFloat(rawVal);
      const weight = KPI_CONFIG[key].weight;
      totalScore += val * weight;
      totalWeight += weight;
    } else {
      allRated = false;
    }
  }

  const scoreText = totalWeight > 0 ? (totalScore / totalWeight).toFixed(2) : '0.00';
  $('#live-weighted-score').text(scoreText);
  $('#comp-curr-val').text(scoreText);

  updateScoreAppearance(parseFloat(scoreText), allRated);
  updateComparisonDelta(parseFloat(scoreText));
}

function updateScoreAppearance(score, allRated) {
  const circle = $('#score-circle-element');
  const pill = $('#score-tier-pill');

  circle.removeClass('tier-excellent tier-good tier-average tier-at-risk');
  pill.removeClass('tier-excellent tier-good tier-average tier-at-risk');

  if (!allRated && score === 0) {
    pill.text('Not Rated Yet');
    return;
  }

  if (score >= 4.2) {
    circle.addClass('tier-excellent');
    pill.addClass('tier-excellent').text('Exceeds Expectations');
  } else if (score >= 3.5) {
    circle.addClass('tier-good');
    pill.addClass('tier-good').text('Meets Standards');
  } else if (score >= 3.0) {
    circle.addClass('tier-average');
    pill.addClass('tier-average').text('Average / Satisfactory');
  } else {
    circle.addClass('tier-at-risk');
    pill.addClass('tier-at-risk').text('At-Risk / Action Required');
  }
}

function updateComparisonDelta(currentScore) {
  const prevValStr = $('#prev-score-val').text();
  const prevVal = parseFloat(prevValStr);
  const deltaBadge = $('#comp-delta-badge');

  if (isNaN(prevVal) || currentScore === 0) {
    deltaBadge.text('0.00').removeClass('positive negative');
    return;
  }

  const diff = currentScore - prevVal;
  const formattedDiff = (diff >= 0 ? '+' : '') + diff.toFixed(2);
  deltaBadge.text(formattedDiff);

  deltaBadge.removeClass('positive negative');
  if (diff >= 0) {
    deltaBadge.addClass('positive');
  } else {
    deltaBadge.addClass('negative');
  }
}

function updateRadarChartData() {
  if (!radarChartInstance) return;

  const currentValues = [
    parseFloat($('#kpi-quality').val()) || 0,
    parseFloat($('#kpi-punctuality').val()) || 0,
    parseFloat($('#kpi-teamwork').val()) || 0,
    parseFloat($('#kpi-problemSolving').val()) || 0,
    parseFloat($('#kpi-communication').val()) || 0
  ];

  radarChartInstance.data.datasets[0].data = currentValues;
  radarChartInstance.update();
}

function hasLowRating() {
  let lowFound = false;
  for (const key in KPI_CONFIG) {
    const val = parseInt($('#kpi-' + key).val(), 10);
    if (val && val < 3) {
      lowFound = true;
      break;
    }
  }

  const currentAvg = parseFloat($('#live-weighted-score').text());
  if (currentAvg > 0 && currentAvg < 3.0) {
    lowFound = true;
  }

  return lowFound;
}

function checkCommentRequirementRule() {
  const isStrict = hasLowRating();
  const ruleBadge = $('#comment-rule-indicator');
  const instruction = $('#comment-instruction-text');

  if (isStrict) {
    ruleBadge.removeClass('rule-normal').addClass('rule-strict').text('Detailed Feedback Required');
    instruction.addClass('urgent-requirement').text('Notice: One or more ratings are below 3 stars. You must provide at least 20 characters of detailed managerial feedback.');
  } else {
    ruleBadge.removeClass('rule-strict').addClass('rule-normal').text('Standard Feedback');
    instruction.removeClass('urgent-requirement').text('General review feedback. If any rating is below 3 stars, a detailed comment (min 20 characters) is required.');
  }

  validateCommentLength();
}

function setupCommentValidation() {
  $('#review-comment').on('input', function() {
    validateCommentLength();
  });
}

function validateCommentLength() {
  const comment = $('#review-comment').val().trim();
  const count = comment.length;
  const counter = $('#char-counter');
  const errorElem = $('#error-comment');
  const isStrict = hasLowRating();

  if (isStrict) {
    counter.text(count + ' / 20 characters minimum');
    if (count >= 20) {
      counter.removeClass('invalid-count').addClass('valid-count');
      errorElem.text('');
      $('#review-comment').removeClass('is-invalid');
    } else {
      counter.removeClass('valid-count').addClass('invalid-count');
      if (count > 0) {
        errorElem.text((20 - count) + ' more characters required');
      }
    }
  } else {
    counter.text(count + ' characters').removeClass('invalid-count valid-count');
    errorElem.text('');
    $('#review-comment').removeClass('is-invalid');
  }
}

function setupFormButtons() {
  $('#employee-select').on('change', function() {
    const empId = parseInt($(this).val(), 10);
    $('#error-employee').text('');
    $(this).removeClass('is-invalid');

    if (!empId) {
      $('#employee-info-card').slideUp(200);
      $('#prev-score-val').text('--');
      $('#prev-score-desc').text('Select an employee');
      $('#comp-prev-val').text('--');
      if (radarChartInstance) {
        radarChartInstance.data.datasets[1].data = [0, 0, 0, 0, 0];
        radarChartInstance.update();
      }
      return;
    }

    const employee = employeeList.find(e => e.id === empId);
    if (!employee) return;

    $('#emp-avatar').text(employee.name.split(' ').map(n => n[0]).join('').substring(0, 2));
    $('#emp-meta-name').text(employee.name);
    $('#emp-meta-role').text(employee.role + ' • ' + employee.department);
    $('#emp-meta-email').text(employee.email);
    $('#employee-info-card').slideDown(200);

    const prevAvg = employee.prevQuarterAvg || 3.0;
    $('#prev-score-val').text(prevAvg.toFixed(1));
    $('#prev-score-desc').text('Previous Quarter Baseline');
    $('#comp-prev-val').text(prevAvg.toFixed(1));

    if (radarChartInstance && employee.prevKpis) {
      radarChartInstance.data.datasets[1].data = [
        employee.prevKpis.quality || prevAvg,
        employee.prevKpis.punctuality || prevAvg,
        employee.prevKpis.teamwork || prevAvg,
        employee.prevKpis.problemSolving || prevAvg,
        employee.prevKpis.communication || prevAvg
      ];
      radarChartInstance.update();
    }

    calculateWeightedScore();
  });

  $('.save').on('click', function() {
    saveDraftManual();
  });

  $('#btn-submit-review').on('click', function() {
    submitReviewForm();
  });

  $('#btn-reset-form').on('click', function() {
    resetReviewForm();
  });

  $('#btn-export-pdf').on('click', function() {
    window.print();
  });
}

function saveDraftManual() {
  const draftData = getFormDraftData();

  $('.save').text('Saving...').addClass('loading').delay(500).text('Saved');

  setTimeout(function() {
    $('.save').removeClass('loading').html('<i class="fa-solid fa-floppy-disk"></i> Save Draft');
  }, 1200);

  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));

  const now = new Date().toLocaleTimeString();
  $('#save-status-indicator')
    .removeClass('saved saving')
    .addClass('saved')
    .html('<i class="fa-solid fa-check"></i> Draft saved at ' + now);

  showToast('Review draft saved successfully!', 'toast-info');
}

function autoSaveDraft() {
  const empId = $('#employee-select').val();
  const hasInput = empId || $('#review-comment').val().trim().length > 0 || $('#kpi-quality').val();

  if (!hasInput) return;

  const draftData = getFormDraftData();
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));

  const now = new Date().toLocaleTimeString();
  $('#save-status-indicator')
    .removeClass('saved saving')
    .addClass('saving')
    .html('<i class="fa-solid fa-arrows-rotate fa-spin"></i> Auto-saving...')
    .delay(600)
    .queue(function(next) {
      $(this)
        .removeClass('saving')
        .addClass('saved')
        .html('<i class="fa-solid fa-check"></i> Draft auto-saved at ' + now);
      next();
    });
}

function startAutoSaveTimer() {
  setInterval(autoSaveDraft, 30000);
}

function getFormDraftData() {
  return {
    employeeId: $('#employee-select').val(),
    reviewer: $('#reviewer-input').val().trim(),
    quarter: $('#review-quarter').val(),
    kpis: {
      quality: $('#kpi-quality').val(),
      punctuality: $('#kpi-punctuality').val(),
      teamwork: $('#kpi-teamwork').val(),
      problemSolving: $('#kpi-problemSolving').val(),
      communication: $('#kpi-communication').val()
    },
    comment: $('#review-comment').val(),
    timestamp: new Date().toLocaleString()
  };
}

function setupRestoreBanner() {
  const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (savedDraft) {
    try {
      const data = JSON.parse(savedDraft);
      $('#restore-timestamp-msg').text('Unsaved review draft detected from ' + (data.timestamp || 'previous session') + '. Would you like to restore it?');
      $('#restore-banner').slideDown(300);
    } catch (e) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }

  $('#btn-restore-draft').on('click', function() {
    restoreDraftData();
    $('#restore-banner').slideUp(200);
    showToast('Draft restored into review form.', 'toast-success');
  });

  $('#btn-discard-draft').on('click', function() {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    $('#restore-banner').slideUp(200);
    showToast('Saved draft discarded.', 'toast-info');
  });
}

function restoreDraftData() {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return;

  try {
    const data = JSON.parse(raw);
    if (data.employeeId) {
      $('#employee-select').val(data.employeeId).trigger('change');
    }
    if (data.reviewer) {
      $('#reviewer-input').val(data.reviewer);
    }
    if (data.quarter) {
      $('#review-quarter').val(data.quarter);
    }

    if (data.kpis) {
      for (const kpiKey in data.kpis) {
        const val = data.kpis[kpiKey];
        if (val) {
          const container = $('.star-rating[data-kpi="' + kpiKey + '"]');
          container.find('.star[data-val="' + val + '"]').trigger('click');
        }
      }
    }

    if (data.comment) {
      $('#review-comment').val(data.comment).trigger('input');
    }
  } catch (e) {}
}

function submitReviewForm() {
  $('#validation-alert').hide();
  $('.field-error').text('');
  $('.form-control').removeClass('is-invalid');
  $('.kpi-row').removeClass('unrated-error');

  let isValid = true;

  const empIdVal = $('#employee-select').val();
  if (!empIdVal) {
    $('#employee-select').addClass('is-invalid');
    $('#error-employee').text('Please select an employee to review.');
    isValid = false;
  }

  const reviewerVal = $('#reviewer-input').val().trim();
  if (!reviewerVal) {
    $('#reviewer-input').addClass('is-invalid');
    $('#error-reviewer').text('Reviewer identifier is required.');
    isValid = false;
  }

  const missingKpis = [];
  const kpiValues = {};
  for (const kpiKey in KPI_CONFIG) {
    const val = $('#kpi-' + kpiKey).val();
    if (!val) {
      missingKpis.push(KPI_CONFIG[kpiKey].name);
      $('.kpi-row[data-kpi="' + kpiKey + '"]').addClass('unrated-error');
      isValid = false;
    } else {
      kpiValues[kpiKey] = parseInt(val, 10);
    }
  }

  if (missingKpis.length > 0) {
    $('#error-kpis').text('Required: Please rate all 5 core KPIs with stars.');
  }

  const commentVal = $('#review-comment').val().trim();
  const isStrict = hasLowRating();
  if (isStrict && commentVal.length < 20) {
    $('#review-comment').addClass('is-invalid');
    $('#error-comment').text('A minimum 20-character managerial comment is mandatory when any rating is below 3 stars.');
    isValid = false;
  }

  if (!isValid) {
    $('#validation-alert-msg').text('Form contains validation errors. Please complete all required ratings and comments.');
    $('#validation-alert').slideDown(250);
    return;
  }

  const employee = employeeList.find(e => e.id === parseInt(empIdVal, 10));
  const weightedScore = parseFloat($('#live-weighted-score').text());
  const quarterVal = $('#review-quarter').val();

  const newReview = {
    id: 'REV-' + empIdVal + '-' + quarterVal.replace('-', ''),
    employeeId: parseInt(empIdVal, 10),
    employeeName: employee ? employee.name : 'Employee ' + empIdVal,
    role: employee ? employee.role : 'Staff',
    department: employee ? employee.department : 'General',
    quarter: quarterVal,
    kpis: kpiValues,
    weights: {
      quality: KPI_CONFIG.quality.weight,
      punctuality: KPI_CONFIG.punctuality.weight,
      teamwork: KPI_CONFIG.teamwork.weight,
      problemSolving: KPI_CONFIG.problemSolving.weight,
      communication: KPI_CONFIG.communication.weight
    },
    avg: weightedScore,
    reviewer: reviewerVal,
    comment: commentVal,
    status: 'submitted',
    date: new Date().toISOString().split('T')[0]
  };

  $('#btn-submit-review').prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Submitting...');

  $.ajax({
    url: API_BASE + '/reviews',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(newReview)
  })
  .done(function(savedData) {
    handleSubmissionSuccess(savedData);
  })
  .fail(function() {
    handleSubmissionFallback(newReview);
  })
  .always(function() {
    $('#btn-submit-review').prop('disabled', false).html('<i class="fa-solid fa-paper-plane"></i> Submit Review');
  });
}

function handleSubmissionSuccess(savedData) {
  reviewList.unshift(savedData);
  localStorage.removeItem(DRAFT_STORAGE_KEY);
  $('#restore-banner').slideUp(200);

  updateReviewCounts();
  showToast('Performance review submitted successfully!', 'toast-success');
  resetReviewForm();

  $('.tab-btn[data-tab="tab-reviews"]').trigger('click');
}

function handleSubmissionFallback(newReview) {
  const existingIdx = reviewList.findIndex(r => r.id === newReview.id);
  if (existingIdx >= 0) {
    reviewList[existingIdx] = newReview;
  } else {
    reviewList.unshift(newReview);
  }

  localStorage.removeItem(DRAFT_STORAGE_KEY);
  $('#restore-banner').slideUp(200);

  updateReviewCounts();
  showToast('Review recorded locally (offline mode active).', 'toast-info');
  resetReviewForm();

  $('.tab-btn[data-tab="tab-reviews"]').trigger('click');
}

function resetReviewForm() {
  $('#employee-select').val('').trigger('change');
  $('#reviewer-input').val('manager_01');
  $('#review-quarter').val('Q4-2026');

  $('.kpi-hidden-val').val('');
  $('.star').removeClass('hovered selected');
  $('.rating-text-badge').text('Not Rated').removeClass('rated-good rated-warning rated-danger');
  $('.kpi-row').removeClass('unrated-error');

  $('#review-comment').val('').removeClass('is-invalid');
  $('#char-counter').text('0 characters').removeClass('valid-count invalid-count');
  $('#error-comment').text('');
  $('#error-kpis').text('');
  $('#error-employee').text('');
  $('#validation-alert').hide();

  $('#live-weighted-score').text('0.00');
  $('#comp-curr-val').text('0.00');
  $('#comp-delta-badge').text('0.00').removeClass('positive negative');
  updateScoreAppearance(0, false);
  checkCommentRequirementRule();

  if (radarChartInstance) {
    radarChartInstance.data.datasets[0].data = [0, 0, 0, 0, 0];
    radarChartInstance.data.datasets[1].data = [0, 0, 0, 0, 0];
    radarChartInstance.update();
  }
}

function loadInitialData() {
  $.ajax({
    url: API_BASE + '/employees',
    method: 'GET'
  })
  .done(function(data) {
    employeeList = data;
    populateEmployeeDropdown(employeeList);
  })
  .fail(function() {
    loadFallbackEmployees();
  });

  $.ajax({
    url: API_BASE + '/reviews',
    method: 'GET'
  })
  .done(function(data) {
    reviewList = data;
    updateReviewCounts();
    renderReviewsTable(reviewList);
  })
  .fail(function() {
    loadFallbackReviews();
  });
}

function populateEmployeeDropdown(list) {
  const select = $('#employee-select');
  select.find('option:not(:first)').remove();

  list.forEach(function(emp) {
    select.append(
      $('<option></option>')
        .val(emp.id)
        .text(emp.name + ' - ' + emp.role + ' (' + emp.department + ')')
    );
  });
}

function updateReviewCounts() {
  $('#total-reviews-count').text(reviewList.length);

  const atRisk = $.grep(reviewList, r => r.avg < 3);
  $('#at-risk-count').text(atRisk.length);
  $('#at-risk-stat-number').text(atRisk.length);
}

function renderReviewsTable(reviews) {
  const tbody = $('#all-reviews-tbody');
  tbody.empty();

  if (!reviews || reviews.length === 0) {
    tbody.append('<tr><td colspan="8" class="text-center py-4">No reviews recorded yet.</td></tr>');
    return;
  }

  reviews.forEach(function(r) {
    const isAtRisk = r.avg < 3;
    let badgeClass = 'score-good';
    let statusText = 'Exceeds / Meets';

    if (r.avg < 3) {
      badgeClass = 'score-danger';
      statusText = 'At-Risk (< 3.0)';
    } else if (r.avg < 3.5) {
      badgeClass = 'score-warning';
      statusText = 'Satisfactory';
    }

    const tr = $('<tr></tr>');
    tr.html(
      '<td><strong>' + r.id + '</strong></td>' +
      '<td>' + r.employeeName + '<br><small class="text-muted">' + (r.role || '') + '</small></td>' +
      '<td>' + (r.department || '-') + '</td>' +
      '<td>' + (r.quarter || 'Q4-2026') + '</td>' +
      '<td><span class="badge-score ' + badgeClass + '">' + Number(r.avg).toFixed(2) + ' / 5.0</span></td>' +
      '<td>' + statusText + '</td>' +
      '<td>' + (r.reviewer || '-') + '</td>' +
      '<td><button type="button" class="btn btn-sm btn-outline btn-view-review" data-id="' + r.id + '"><i class="fa-solid fa-eye"></i> View</button></td>'
    );
    tbody.append(tr);
  });

  $('.btn-view-review').on('click', function() {
    const reviewId = $(this).data('id');
    const review = reviewList.find(r => r.id === reviewId);
    if (review) {
      openReviewModal(review);
    }
  });
}

function renderAtRiskList() {
  const atRiskReviews = $.grep(reviewList, r => r.avg < 3);

  $('#at-risk-stat-number').text(atRiskReviews.length);
  const container = $('#at-risk-list-container');
  container.empty();

  if (atRiskReviews.length === 0) {
    container.html('<div class="card text-center py-4"><i class="fa-solid fa-circle-check text-success" style="font-size: 2rem;"></i><h3 style="margin-top: 0.5rem;">All Clear!</h3><p>No employees currently have an average rating below 3.0.</p></div>');
    return;
  }

  atRiskReviews.forEach(function(r) {
    const card = $('<div class="at-risk-card"></div>');
    const kpiSummary = r.kpis ? Object.keys(r.kpis).map(k => k + ': ' + r.kpis[k] + '★').join(' • ') : 'Ratings recorded';

    card.html(
      '<div class="at-risk-info">' +
        '<div class="at-risk-card-heading">' +
          '<span class="at-risk-name">' + r.employeeName + '</span>' +
          '<span class="at-risk-dept">' + (r.role || 'Role') + ' • ' + (r.department || 'Department') + '</span>' +
        '</div>' +
        '<div style="font-size: 0.82rem; color: #64748b;"><strong>Breakdown:</strong> ' + kpiSummary + '</div>' +
        '<div class="at-risk-feedback">' +
          '<strong>Manager Feedback:</strong> "' + (r.comment || 'Performance issues noted.') + '"' +
        '</div>' +
      '</div>' +
      '<div class="at-risk-actions">' +
        '<div class="at-risk-score-badge">' +
          '<i class="fa-solid fa-triangle-exclamation"></i> ' + Number(r.avg).toFixed(2) +
        '</div>' +
        '<button type="button" class="btn btn-sm btn-primary btn-pip-action" data-id="' + r.id + '" data-name="' + r.employeeName + '">' +
          '<i class="fa-solid fa-clipboard-list"></i> Schedule HR PIP' +
        '</button>' +
      '</div>'
    );

    container.append(card);
  });

  $('.btn-pip-action').on('click', function() {
    const name = $(this).data('name');
    showToast('HR Intervention PIP initiated for ' + name + '.', 'toast-danger');
  });
}

function setupSearchAndFilters() {
  $('#review-search-input').on('keyup', function() {
    applyReviewTableFilters();
  });

  $('#review-department-filter').on('change', function() {
    applyReviewTableFilters();
  });
}

function applyReviewTableFilters() {
  const query = $('#review-search-input').val().toLowerCase().trim();
  const dept = $('#review-department-filter').val();

  const filtered = reviewList.filter(function(r) {
    const matchesQuery = !query ||
      r.employeeName.toLowerCase().includes(query) ||
      (r.role && r.role.toLowerCase().includes(query)) ||
      r.id.toLowerCase().includes(query);

    const matchesDept = dept === 'all' || r.department === dept;

    return matchesQuery && matchesDept;
  });

  renderReviewsTable(filtered);
}

function setupModal() {
  $('#btn-close-modal, #btn-modal-dismiss').on('click', function() {
    $('#review-modal').fadeOut(200);
  });

  $('#btn-modal-print').on('click', function() {
    window.print();
  });
}

function openReviewModal(r) {
  $('#modal-review-title').text('Evaluation: ' + r.employeeName + ' (' + (r.quarter || 'Q4-2026') + ')');

  let kpiRowsHtml = '';
  if (r.kpis) {
    for (const key in r.kpis) {
      const score = r.kpis[key];
      const stars = '★'.repeat(score) + '☆'.repeat(5 - score);
      kpiRowsHtml += '<div style="display: flex; justify-content: space-between; padding: 0.4rem 0; border-bottom: 1px dashed #e2e8f0;">' +
        '<span>' + (KPI_CONFIG[key] ? KPI_CONFIG[key].name : key) + '</span>' +
        '<span style="color: #f59e0b; font-weight: 700;">' + stars + ' (' + score + '/5)</span>' +
      '</div>';
    }
  }

  const modalContent =
    '<div style="margin-bottom: 1rem;">' +
      '<p><strong>Employee ID:</strong> ' + (r.employeeId || '-') + ' | <strong>Role:</strong> ' + (r.role || '-') + '</p>' +
      '<p><strong>Department:</strong> ' + (r.department || '-') + ' | <strong>Reviewer:</strong> ' + (r.reviewer || '-') + '</p>' +
      '<p><strong>Review ID:</strong> ' + r.id + ' | <strong>Date:</strong> ' + (r.date || '-') + '</p>' +
    '</div>' +
    '<div style="background: #f8fafc; padding: 0.85rem; border-radius: 8px; margin-bottom: 1rem;">' +
      '<h4 style="margin-bottom: 0.5rem; font-size: 0.95rem;">KPI Scorecard</h4>' +
      kpiRowsHtml +
      '<div style="display: flex; justify-content: space-between; margin-top: 0.75rem; font-weight: 800; font-size: 1.05rem;">' +
        '<span>Final Weighted Average:</span>' +
        '<span style="color: ' + (r.avg < 3 ? '#ef4444' : '#10b981') + ';">' + Number(r.avg).toFixed(2) + ' / 5.0</span>' +
      '</div>' +
    '</div>' +
    '<div>' +
      '<h4 style="font-size: 0.95rem; margin-bottom: 0.35rem;">Manager Comments & Evaluation</h4>' +
      '<p style="background: #f1f5f9; padding: 0.75rem; border-radius: 6px; font-size: 0.9rem; line-height: 1.4;">' + (r.comment || 'No feedback comments entered.') + '</p>' +
    '</div>';

  $('#modal-review-body').html(modalContent);
  $('#review-modal').fadeIn(200);
}

function showToast(message, typeClass) {
  const toast = $('<div class="toast ' + (typeClass || 'toast-info') + '"></div>');
  toast.html('<i class="fa-solid fa-circle-info"></i> <span>' + message + '</span>');
  $('#toast-container').append(toast);

  toast.fadeIn(200).delay(2600).fadeOut(300, function() {
    $(this).remove();
  });
}

function loadFallbackEmployees() {
  employeeList = [
    { id: 101, name: 'Rahul Sharma', role: 'Frontend Developer', department: 'Engineering', email: 'rahul.sharma@example.com', prevQuarterAvg: 3.8, prevKpis: { quality: 4, punctuality: 4, teamwork: 4, problemSolving: 3, communication: 4 } },
    { id: 102, name: 'Priya Patel', role: 'UI/UX Designer', department: 'Design', email: 'priya.patel@example.com', prevQuarterAvg: 4.2, prevKpis: { quality: 5, punctuality: 4, teamwork: 4, problemSolving: 4, communication: 4 } },
    { id: 103, name: 'Amit Verma', role: 'QA Engineer', department: 'Quality Assurance', email: 'amit.verma@example.com', prevQuarterAvg: 2.6, prevKpis: { quality: 3, punctuality: 2, teamwork: 3, problemSolving: 2, communication: 3 } },
    { id: 104, name: 'Sneha Reddy', role: 'Backend Developer', department: 'Engineering', email: 'sneha.reddy@example.com', prevQuarterAvg: 3.5, prevKpis: { quality: 4, punctuality: 3, teamwork: 4, problemSolving: 3, communication: 3 } },
    { id: 105, name: 'Vikram Singh', role: 'DevOps Engineer', department: 'Operations', email: 'vikram.singh@example.com', prevQuarterAvg: 2.4, prevKpis: { quality: 2, punctuality: 3, teamwork: 2, problemSolving: 3, communication: 2 } },
    { id: 106, name: 'Ananya Joshi', role: 'Product Manager', department: 'Product', email: 'ananya.joshi@example.com', prevQuarterAvg: 4.5, prevKpis: { quality: 5, punctuality: 4, teamwork: 5, problemSolving: 4, communication: 5 } },
    { id: 107, name: 'Karan Malhotra', role: 'Full Stack Dev', department: 'Engineering', email: 'karan.malhotra@example.com', prevQuarterAvg: 3.2, prevKpis: { quality: 3, punctuality: 3, teamwork: 4, problemSolving: 3, communication: 3 } },
    { id: 108, name: 'Isha Bhatia', role: 'Payroll Specialist', department: 'Human Resources', email: 'isha.bhatia@example.com', prevQuarterAvg: 2.2, prevKpis: { quality: 2, punctuality: 2, teamwork: 3, problemSolving: 2, communication: 2 } }
  ];
  populateEmployeeDropdown(employeeList);
}

function loadFallbackReviews() {
  reviewList = [
    {
      id: 'REV-101-Q4',
      employeeId: 101,
      employeeName: 'Rahul Sharma',
      role: 'Frontend Developer',
      department: 'Engineering',
      quarter: 'Q4-2026',
      kpis: { quality: 4, punctuality: 3, teamwork: 5, problemSolving: 4, communication: 4 },
      weights: { quality: 0.25, punctuality: 0.20, teamwork: 0.20, problemSolving: 0.20, communication: 0.15 },
      avg: 4.0,
      reviewer: 'manager_01',
      comment: 'Consistently delivered robust and responsive frontend components during the recent major payroll release.',
      status: 'submitted',
      date: '2026-09-15'
    },
    {
      id: 'REV-102-Q4',
      employeeId: 102,
      employeeName: 'Priya Patel',
      role: 'UI/UX Designer',
      department: 'Design',
      quarter: 'Q4-2026',
      kpis: { quality: 5, punctuality: 4, teamwork: 4, problemSolving: 5, communication: 4 },
      weights: { quality: 0.25, punctuality: 0.20, teamwork: 0.20, problemSolving: 0.20, communication: 0.15 },
      avg: 4.45,
      reviewer: 'manager_01',
      comment: 'Outstanding design prototypes and accessibility enhancements across all mobile touchpoints.',
      status: 'submitted',
      date: '2026-09-18'
    },
    {
      id: 'REV-103-Q4',
      employeeId: 103,
      employeeName: 'Amit Verma',
      role: 'QA Engineer',
      department: 'Quality Assurance',
      quarter: 'Q4-2026',
      kpis: { quality: 2, punctuality: 2, teamwork: 3, problemSolving: 2, communication: 2 },
      weights: { quality: 0.25, punctuality: 0.20, teamwork: 0.20, problemSolving: 0.20, communication: 0.15 },
      avg: 2.2,
      reviewer: 'manager_01',
      comment: 'Repeated regressions identified in build cycles; needs urgent structured training on automation frameworks.',
      status: 'submitted',
      date: '2026-09-20'
    },
    {
      id: 'REV-105-Q4',
      employeeId: 105,
      employeeName: 'Vikram Singh',
      role: 'DevOps Engineer',
      department: 'Operations',
      quarter: 'Q4-2026',
      kpis: { quality: 2, punctuality: 3, teamwork: 2, problemSolving: 3, communication: 2 },
      weights: { quality: 0.25, punctuality: 0.20, teamwork: 0.20, problemSolving: 0.20, communication: 0.15 },
      avg: 2.4,
      reviewer: 'manager_02',
      comment: 'Server maintenance bottlenecks delayed production releases; requires immediate performance coaching.',
      status: 'submitted',
      date: '2026-09-22'
    },
    {
      id: 'REV-108-Q4',
      employeeId: 108,
      employeeName: 'Isha Bhatia',
      role: 'Payroll Specialist',
      department: 'Human Resources',
      quarter: 'Q4-2026',
      kpis: { quality: 2, punctuality: 2, teamwork: 2, problemSolving: 2, communication: 2 },
      weights: { quality: 0.25, punctuality: 0.20, teamwork: 0.20, problemSolving: 0.20, communication: 0.15 },
      avg: 2.0,
      reviewer: 'manager_03',
      comment: 'Critical compliance report discrepancies observed this quarter requiring targeted intervention and review.',
      status: 'submitted',
      date: '2026-09-24'
    }
  ];
  updateReviewCounts();
  renderReviewsTable(reviewList);
}
