(() => {
  'use strict';

  /* ── Constants for Local Calculation ─────────────────────────── */
  const WATTS_PER_PC = 65;
  const WATTS_PER_SERVER = 500;
  const WORKING_DAYS_PER_MONTH = 22;
  const COST_PER_KWH = 0.25; // €0.25 per kWh
  const CO2_KG_PER_KWH = 0.4; // 0.4 kg CO2 per kWh

  /* ── Chart.js — Emissions Trend Over 6 Months (Mock) ─────────── */
  const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
  let co2Data = [0, 0, 0, 0, 0, 0]; // Default data
  let energyData = [0, 0, 0, 0, 0, 0]; // Default data

  const ctx = document.getElementById('emissionsChart')?.getContext('2d');
  let emissionsChart;

  if (ctx) {
    const co2Gradient = ctx.createLinearGradient(0, 0, 0, 260);
    co2Gradient.addColorStop(0,   'rgba(32, 59, 64, 0.18)');
    co2Gradient.addColorStop(1,   'rgba(32, 59, 64, 0)');

    const energyGradient = ctx.createLinearGradient(0, 0, 0, 260);
    energyGradient.addColorStop(0,   'rgba(61, 103, 79, 0.12)');
    energyGradient.addColorStop(1,   'rgba(61, 103, 79, 0)');

    emissionsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'CO₂ (Tonnes)',
            data: co2Data,
            borderColor: '#203b40',
            backgroundColor: co2Gradient,
            pointBackgroundColor: '#203b40',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Energy (kWh ÷ 100)',
            data: energyData,
            borderColor: '#3d674f',
            backgroundColor: energyGradient,
            pointBackgroundColor: '#3d674f',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
            borderDash: [5, 4],
            tension: 0.4,
            fill: true,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#203b40',
            titleFont: { family: 'Manrope', weight: '700', size: 12 },
            bodyFont:  { family: 'Inter', size: 12 },
            padding: 12,
            cornerRadius: 6,
            callbacks: {
              label: c => ` ${c.dataset.label}: ${c.parsed.y}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(193, 200, 201, 0.12)', drawBorder: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#414849' }
          },
          y: {
            grid: { color: 'rgba(193, 200, 201, 0.12)', drawBorder: false },
            ticks: { font: { family: 'Inter', size: 11 }, color: '#414849' },
            beginAtZero: true,
          }
        }
      }
    });
  }

  /* ── DOM Elements ────────────────────────────────────────────── */
  const form = document.getElementById('infrastructure-form');
  const formError = document.getElementById('form-error');
  const elEnergy = document.getElementById('metric-energy');
  const elCost = document.getElementById('metric-cost');
  const elCo2 = document.getElementById('metric-co2');
  const badgeEnergy = document.getElementById('badge-energy');
  const badgeCost = document.getElementById('badge-cost');
  const badgeCo2 = document.getElementById('badge-co2');
  const recList = document.getElementById('recommendations-list');
  const lastUpdated = document.getElementById('last-updated');
  const submitText = document.getElementById('submit-text');
  const submitSpinner = document.getElementById('submit-spinner');
  const submitIcon = document.getElementById('submit-icon');
  const submitBtn = document.getElementById('submit-btn');

  /* ── Utilities ───────────────────────────────────────────────── */
  function animateValue(el, newVal, suffix = '') {
    if (!el) return;
    el.classList.remove('animate-value');
    void el.offsetWidth; // trigger reflow
    el.classList.add('animate-value');
    el.textContent = newVal + suffix;
  }

  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = `show ${type}`;
    setTimeout(() => { toast.className = ''; }, 3500);
  }

  function generateRecommendations(servers, pcs, monthlyKWh, co2Tonnes) {
    const recs = [];
    
    // Dynamic recommendations based on user input
    if (servers > 0) {
      // Assuming cloud migration saves ~40% of server emissions
      const serverSavings = (servers * WATTS_PER_SERVER / 1000 * 24 * 365 * CO2_KG_PER_KWH / 1000 * 0.4).toFixed(1);
      recs.push({
        icon: '☁️',
        text: `Migrating those ${servers} local servers to the cloud could save you approx. ${serverSavings} Tonnes of CO₂ annually.`,
        sub: 'Cloud data centers are typically much more energy efficient than on-premise servers.'
      });
    }

    if (pcs > 10) {
       recs.push({
        icon: '🌙',
        text: 'Enabling aggressive power-saving sleep modes could cut your PC energy usage by up to 20%.',
        sub: `With ${pcs} PCs, accumulating idle drain represents a significant portion of your footprint.`
      });
    }
    
    if (monthlyKWh > 500) {
        recs.push({
            icon: '⚡',
            text: 'Your overall energy consumption is high. Consider switching to a 100% renewable tariff.',
            sub: 'This single operational change could eliminate your Scope 2 electricity emissions entirely.'
        });
    }

    // Fallback if numbers are very low
    if (recs.length === 0) {
        recs.push({
            icon: '🌱',
            text: 'Your IT footprint is highly optimized. Keep monitoring usage as your operations scale.',
            sub: 'Ensure any future hardware upgrades maintain this high standard of efficiency.'
        });
    }
    return recs.slice(0, 3); // Max 3 items
  }

  function renderRecommendations(recs) {
    if (!recList) return;
    recList.innerHTML = '';
    recs.forEach((rec, i) => {
      const li = document.createElement('li');
      li.className = 'ai-rec-item';
      li.innerHTML = `
        <div class="ai-rec-icon">${rec.icon}</div>
        <div>
          <p class="text-sm font-body text-white font-medium">${rec.text}</p>
          <p class="text-xs mt-1" style="color:rgba(193,200,201,0.6)">${rec.sub}</p>
        </div>`;
      recList.appendChild(li);
    });
  }

  /* ── Form Submit Handler ─────────────────────────────────────── */
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      formError.classList.add('hidden');
      
      const servers = parseInt(document.getElementById('numberOfServers').value, 10) || 0;
      const pcs = parseInt(document.getElementById('numberOfPCs').value, 10) || 0;
      const hours = parseFloat(document.getElementById('dailyUsageHours').value) || 0;

      if (servers === 0 && pcs === 0) {
        formError.textContent = 'Please enter at least some servers or PCs to calculate.';
        formError.classList.remove('hidden');
        return;
      }
      if (hours <= 0 || hours > 24) {
        formError.textContent = 'Daily usage hours must be between 0 and 24.';
        formError.classList.remove('hidden');
        return;
      }

      // UI Loading State
      submitBtn.disabled = true;
      submitText.textContent = 'Calculating...';
      submitIcon.classList.add('hidden');
      submitSpinner.classList.remove('hidden');

      // Simulate a tiny delay for a satisfying UI interaction
      setTimeout(() => {
          // 1. Math block
          const totalWatts = (pcs * WATTS_PER_PC) + (servers * WATTS_PER_SERVER);
          const totalKw = totalWatts / 1000;
          const monthlyKwh = totalKw * hours * WORKING_DAYS_PER_MONTH;
          
          const monthlyCost = monthlyKwh * COST_PER_KWH;
          const monthlyCo2Kg = monthlyKwh * CO2_KG_PER_KWH;
          const monthlyCo2Tonnes = monthlyCo2Kg / 1000;

          // Save to LocalStorage for reporting
          localStorage.setItem('latestCalculation', JSON.stringify({
            date: new Date().toISOString(),
            servers: servers,
            pcs: pcs,
            hours: hours,
            monthlyKwh: monthlyKwh,
            monthlyCost: monthlyCost,
            monthlyCo2Tonnes: monthlyCo2Tonnes
          }));

          // 2. Update UI metric cards
          animateValue(elEnergy, monthlyKwh.toLocaleString(undefined, {maximumFractionDigits: 0}));
          badgeEnergy.textContent = 'Local Calculation';
          
          animateValue(elCost, monthlyCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}));
          badgeCost.textContent = `${(hours * WORKING_DAYS_PER_MONTH).toFixed(0)} hrs / mo`;
          
          animateValue(elCo2, monthlyCo2Tonnes.toFixed(3));
          badgeCo2.textContent = '0.4 kg/kWh Int.';

          if (lastUpdated) {
            lastUpdated.textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }

          // 3. Update Chart dynamically
          if (emissionsChart) {
              const newCo2Data = [];
              const newEnergyData = [];
              // Mock 6 months data trending slightly towards the current real calculation
              for(let i = 0; i < 6; i++) {
                  if (i === 5) {
                      newCo2Data.push(parseFloat(monthlyCo2Tonnes.toFixed(3)));
                      newEnergyData.push(parseFloat((monthlyKwh / 100).toFixed(2)));
                  } else {
                      // Add a random variance between 85% and 115% for past months
                      const variance = 0.85 + (Math.random() * 0.3);
                      newCo2Data.push(parseFloat((monthlyCo2Tonnes * variance).toFixed(3)));
                      newEnergyData.push(parseFloat(((monthlyKwh * variance) / 100).toFixed(2)));
                  }
              }
              emissionsChart.data.datasets[0].data = newCo2Data;
              emissionsChart.data.datasets[1].data = newEnergyData;
              emissionsChart.update('active');
          }

          // 4. Update recommendations dynamically
          const recs = generateRecommendations(servers, pcs, monthlyKwh, monthlyCo2Tonnes);
          renderRecommendations(recs);

          // Restore UI State
          showToast('✓ Local calculation complete', 'success');
          submitBtn.disabled = false;
          submitText.textContent = 'Calculate Impact';
          submitIcon.classList.remove('hidden');
          submitSpinner.classList.add('hidden');

      }, 450); // Simulated delay
    });
  }

})();
