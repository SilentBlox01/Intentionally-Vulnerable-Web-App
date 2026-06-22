// SecureTrust Bank - Client-side JavaScript


document.addEventListener('DOMContentLoaded', function() {

  // Admin tab switching
  const tabs = document.querySelectorAll('.admin-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  // Modal handling
  window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  };

  window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  };

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });

  // Upload zone drag & drop
  const uploadZone = document.querySelector('.upload-zone');
  if (uploadZone) {
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#0052cc';
      uploadZone.style.background = 'rgba(0,82,204,0.05)';
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.style.borderColor = '';
      uploadZone.style.background = '';
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '';
      uploadZone.style.background = '';
      if (fileInput && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        document.getElementById('uploadForm').submit();
      }
    });

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          document.getElementById('uploadForm').submit();
        }
      });
    }
  }

  
  window.checkAdminAccess = function() {
    // This "security" check runs only in the browser
    const role = getCookie('role');
    if (role !== 'admin') {
      // Can be bypassed by: document.cookie = "role=admin; isAdmin=true"
      console.warn('Admin access not detected.');
      return false;
    }
    return true;
  };

  // Cookie helper
  function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const [key, value] = c.trim().split('=');
      if (key === name) return value;
    }
    return null;
  }

  // Format currency
  document.querySelectorAll('.format-currency').forEach(el => {
    const val = parseFloat(el.textContent);
    if (!isNaN(val)) {
      el.textContent = '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  });

  // Sidebar active state
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });

  // Dashboard charts and financial metrics
  const trendCanvas = document.getElementById('trendChart');
  if (trendCanvas && typeof Chart !== 'undefined') {
    fetchDashboardStats();
  }

  function formatCurrency(val) {
    return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fetchDashboardStats() {
    fetch('/api/dashboard/stats')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        updateFinanceCards(data);
        renderTrendChart(data.monthlyTrend);
        renderCategoryChart(data.categoryBreakdown);
      })
      .catch(function(err) {
        console.error('Failed to load dashboard stats:', err);
      });
  }

  function updateFinanceCards(data) {
    var cm = data.currentMonth || { income: 0, expenses: 0, total: 0 };
    var pm = data.previousMonth || { income: 0, expenses: 0, total: 0 };
    var savings = cm.income - cm.expenses;

    var incomeEl = document.getElementById('currentIncome');
    var expenseEl = document.getElementById('currentExpenses');
    var savingsEl = document.getElementById('netSavings');
    var txnEl = document.getElementById('monthTransactions');

    if (incomeEl) incomeEl.textContent = formatCurrency(cm.income);
    if (expenseEl) expenseEl.textContent = formatCurrency(cm.expenses);
    if (savingsEl) savingsEl.textContent = formatCurrency(savings);
    if (txnEl) txnEl.textContent = cm.total + ' txn' + (cm.total !== 1 ? 's' : '');

    setChange('incomeChange', cm.income, pm.income);
    setChange('expenseChange', cm.expenses, pm.expenses, true);
    setChange('savingsChange', savings, pm.income - pm.expenses);
    setChange('txnChange', cm.total, pm.total);
  }

  function setChange(id, current, previous, invertColors) {
    var el = document.getElementById(id);
    if (!el || !previous) { if (el) el.textContent = ''; return; }
    var diff = ((current - previous) / previous * 100).toFixed(1);
    var prefix = diff > 0 ? '+' : '';
    el.textContent = prefix + diff + '% vs last month';
    var isPositive = diff > 0;
    if (invertColors) isPositive = diff < 0;
    el.className = 'finance-change ' + (diff === 0 ? 'neutral' : isPositive ? 'positive' : 'negative');
  }

  function renderTrendChart(trend) {
    if (!trendCanvas || !trend || trend.length === 0) return;

    var labels = trend.map(function(t) {
      var parts = t.month.split('-');
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return months[parseInt(parts[1], 10) - 1] + ' ' + parts[0].slice(2);
    });
    var incomeData = trend.map(function(t) { return t.income; });
    var expenseData = trend.map(function(t) { return t.expenses; });

    new Chart(trendCanvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Income',
            data: incomeData,
            borderColor: '#0d8a53',
            backgroundColor: 'rgba(13,138,83,0.1)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#0d8a53',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5
          },
          {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#c22a30',
            backgroundColor: 'rgba(194,42,48,0.08)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#c22a30',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2.5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true, padding: 16, font: { size: 12, family: 'Inter' } }
          },
          tooltip: {
            backgroundColor: '#1b2a3d',
            titleFont: { family: 'Inter', size: 12 },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx) { return ctx.dataset.label + ': ' + formatCurrency(ctx.parsed.y); }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#8e9bb5' }
          },
          y: {
            grid: { color: '#eef1f5' },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#8e9bb5',
              callback: function(val) { return '$' + val.toLocaleString(); }
            }
          }
        }
      }
    });
  }

  var chartColors = ['#0070ba','#0d8a53','#c22a30','#c5a044','#1a5cc8','#d4850a','#6b21a8','#516580'];

  function renderCategoryChart(breakdown) {
    var catCanvas = document.getElementById('categoryChart');
    if (!catCanvas || !breakdown || breakdown.length === 0) return;

    var filtered = breakdown.filter(function(b) { return b.type !== 'deposit'; });
    if (filtered.length === 0) filtered = breakdown;

    var labels = filtered.map(function(b) { return b.description || 'Other'; });
    var values = filtered.map(function(b) { return b.total; });

    new Chart(catCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: chartColors.slice(0, values.length),
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 12,
              font: { family: 'Inter', size: 11 },
              generateLabels: function(chart) {
                var data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map(function(label, i) {
                    var val = data.datasets[0].data[i];
                    return {
                      text: label.length > 18 ? label.substring(0, 18) + '...' : label,
                      fillStyle: data.datasets[0].backgroundColor[i],
                      strokeStyle: 'transparent',
                      pointStyle: 'circle',
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            backgroundColor: '#1b2a3d',
            titleFont: { family: 'Inter', size: 12 },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              label: function(ctx) {
                var total = ctx.dataset.data.reduce(function(a, b) { return a + b; }, 0);
                var pct = ((ctx.parsed / total) * 100).toFixed(1);
                return ctx.label + ': ' + formatCurrency(ctx.parsed) + ' (' + pct + '%)';
              }
            }
          }
        }
      }
    });
  }

});
