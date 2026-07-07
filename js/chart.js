/**
 * Chart.js integration module.
 * Renders statistics charts with theme-aware colors.
 */

let charts = {};

/** Get theme-aware chart colors */
function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#e2e8f0' : '#334155',
    grid: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
    background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
    palette: ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#3b82f6'],
    status: { completed: '#22c55e', pending: '#f59e0b', inProgress: '#3b82f6' },
    priority: { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' },
  };
}

/** Default chart options */
function getBaseOptions() {
  const colors = getChartColors();
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: colors.text, padding: 16, usePointStyle: true },
      },
    },
    scales: {
      x: {
        ticks: { color: colors.text },
        grid: { color: colors.grid },
      },
      y: {
        ticks: { color: colors.text },
        grid: { color: colors.grid },
      },
    },
  };
}

/** Destroy all chart instances */
export function destroyCharts() {
  Object.values(charts).forEach((chart) => chart?.destroy());
  charts = {};
}

/**
 * Render all statistics charts
 * @param {Object} stats - from getTaskStatistics()
 */
export function renderCharts(stats) {
  if (typeof Chart === 'undefined') return;

  destroyCharts();
  const colors = getChartColors();

  renderStatusPieChart(stats, colors);
  renderPriorityBarChart(stats, colors);
  renderWeeklyLineChart(stats, colors);
  renderCategoryDoughnutChart(stats, colors);
}

/** Status pie chart */
function renderStatusPieChart(stats, colors) {
  const canvas = document.getElementById('chart-status-pie');
  if (!canvas) return;

  charts.statusPie = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Completed', 'Pending', 'In Progress'],
      datasets: [{
        data: [stats.completed, stats.pending, stats.inProgress],
        backgroundColor: [colors.status.completed, colors.status.pending, colors.status.inProgress],
        borderWidth: 0,
        hoverOffset: 8,
      }],
    },
    options: {
      ...getBaseOptions(),
      plugins: { legend: { position: 'bottom' } },
      scales: {},
    },
  });
}

/** Priority bar chart */
function renderPriorityBarChart(stats, colors) {
  const canvas = document.getElementById('chart-priority-bar');
  if (!canvas) return;

  charts.priorityBar = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['High', 'Medium', 'Low'],
      datasets: [{
        label: 'Tasks by Priority',
        data: [stats.byPriority.high, stats.byPriority.medium, stats.byPriority.low],
        backgroundColor: [colors.priority.high, colors.priority.medium, colors.priority.low],
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      ...getBaseOptions(),
      plugins: { legend: { display: false } },
    },
  });
}

/** Weekly activity line chart */
function renderWeeklyLineChart(stats, colors) {
  const canvas = document.getElementById('chart-weekly-line');
  if (!canvas) return;

  charts.weeklyLine = new Chart(canvas, {
    type: 'line',
    data: {
      labels: stats.weekLabels,
      datasets: [{
        label: 'Activity',
        data: stats.weeklyActivity,
        borderColor: colors.palette[0],
        backgroundColor: `${colors.palette[0]}33`,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 8,
      }],
    },
    options: getBaseOptions(),
  });
}

/** Category doughnut chart */
function renderCategoryDoughnutChart(stats, colors) {
  const canvas = document.getElementById('chart-category-doughnut');
  if (!canvas) return;

  const categories = Object.keys(stats.byCategory);
  const values = Object.values(stats.byCategory);

  charts.categoryDoughnut = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: values,
        backgroundColor: colors.palette.slice(0, categories.length),
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      ...getBaseOptions(),
      cutout: '65%',
      plugins: { legend: { position: 'right' } },
      scales: {},
    },
  });
}

/**
 * Update progress circle SVG
 * @param {number} percentage
 */
export function updateProgressCircle(percentage) {
  const circle = document.getElementById('progress-circle-fill');
  const text = document.getElementById('progress-circle-text');
  if (!circle || !text) return;

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  text.textContent = `${percentage}%`;
}
