/**
 * SoloPOS Booking Widget
 * ══════════════════════════════════════════════════════════════
 * Add this to srpmassage.com (or any website) to connect bookings
 * directly to SoloPOS.
 *
 * INSTALLATION — just paste this before </body> on your website:
 *
 *   <script
 *     src="https://your-api.railway.app/widget.js"
 *     data-salon-id="default"
 *     data-api-url="https://your-api.railway.app"
 *     data-primary-color="#e11d48"
 *     data-button-text="Book Appointment"
 *     data-position="bottom-right"
 *   ></script>
 *
 * OR embed inline by calling: NavarBooking.open()
 */

(function () {
  'use strict';

  const API_URL = document.currentScript?.getAttribute('data-api-url') || 'https://your-api.railway.app';
  const SALON_ID = document.currentScript?.getAttribute('data-salon-id') || 'default';
  const PRIMARY = document.currentScript?.getAttribute('data-primary-color') || '#e11d48';
  const BTN_TEXT = document.currentScript?.getAttribute('data-button-text') || 'Book Appointment';
  const POSITION = document.currentScript?.getAttribute('data-position') || 'bottom-right';
  const SHOW_BTN = document.currentScript?.getAttribute('data-show-button') !== 'false';

  // ── STYLES ─────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #navar-widget-btn {
      position: fixed;
      ${POSITION.includes('right') ? 'right:24px' : 'left:24px'};
      ${POSITION.includes('bottom') ? 'bottom:24px' : 'top:24px'};
      background: ${PRIMARY};
      color: white;
      border: none;
      border-radius: 50px;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      transition: transform 0.2s, box-shadow 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #navar-widget-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.25); }
    #navar-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 9999; display: none; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 16px;
    }
    #navar-overlay.open { display: flex; }
    #navar-modal {
      background: white; border-radius: 20px; width: 100%;
      max-width: 480px; max-height: 90vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: navarSlideIn 0.3s ease;
    }
    @keyframes navarSlideIn {
      from { opacity:0; transform: translateY(20px) scale(0.97); }
      to   { opacity:1; transform: translateY(0) scale(1); }
    }
    .navar-header {
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      padding: 24px; border-radius: 20px 20px 0 0;
      display: flex; align-items: center; justify-content: space-between;
    }
    .navar-header h2 { color: white; font-size: 18px; font-weight: 800; margin: 0; }
    .navar-header p  { color: #94a3b8; font-size: 13px; margin: 4px 0 0; }
    .navar-close {
      background: rgba(255,255,255,0.1); border: none; color: white;
      width: 32px; height: 32px; border-radius: 50%; font-size: 16px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.2s;
    }
    .navar-close:hover { background: rgba(255,255,255,0.2); }
    .navar-steps {
      display: flex; background: #f8fafc;
      border-bottom: 1px solid #f1f5f9;
    }
    .navar-step {
      flex: 1; padding: 12px 8px; text-align: center;
      font-size: 11px; font-weight: 700; color: #94a3b8;
      border-bottom: 3px solid transparent; transition: all 0.3s;
    }
    .navar-step.active { color: ${PRIMARY}; border-bottom-color: ${PRIMARY}; }
    .navar-step.done   { color: #16a34a; }
    .navar-body { padding: 24px; }
    .navar-btn {
      width: 100%; padding: 14px; border-radius: 12px;
      background: ${PRIMARY}; color: white; font-size: 15px; font-weight: 700;
      border: none; cursor: pointer; margin-top: 16px; transition: background 0.2s;
    }
    .navar-btn:hover { filter: brightness(0.9); }
    .navar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .navar-btn-ghost {
      width: 100%; padding: 12px; border-radius: 12px;
      background: transparent; color: #64748b; font-size: 14px; font-weight: 600;
      border: 1px solid #e2e8f0; cursor: pointer; margin-top: 8px;
    }
    .navar-svc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .navar-svc-card {
      padding: 14px; border-radius: 12px; border: 2px solid #e2e8f0;
      cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .navar-svc-card:hover   { border-color: ${PRIMARY}33; background: ${PRIMARY}08; }
    .navar-svc-card.selected { border-color: ${PRIMARY}; background: ${PRIMARY}15; }
    .navar-svc-name  { font-size: 13px; font-weight: 700; color: #0f172a; margin: 6px 0 2px; }
    .navar-svc-price { font-size: 12px; font-weight: 700; color: ${PRIMARY}; }
    .navar-svc-dur   { font-size: 11px; color: #94a3b8; }
    .navar-dates { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; }
    .navar-dates::-webkit-scrollbar { display: none; }
    .navar-date {
      flex-shrink: 0; width: 52px; text-align: center; padding: 10px 4px;
      border-radius: 12px; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s;
    }
    .navar-date.selected { border-color: ${PRIMARY}; background: ${PRIMARY}; }
    .navar-date-day   { font-size: 10px; font-weight: 700; color: #94a3b8; }
    .navar-date.selected .navar-date-day { color: rgba(255,255,255,0.8); }
    .navar-date-num  { font-size: 18px; font-weight: 800; color: #0f172a; }
    .navar-date.selected .navar-date-num { color: white; }
    .navar-times { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-top: 14px; }
    .navar-time {
      padding: 9px 4px; border-radius: 8px; border: 1px solid #e2e8f0;
      text-align: center; cursor: pointer; font-size: 12px; font-weight: 600;
      color: #374151; transition: all 0.2s;
    }
    .navar-time.selected { background: ${PRIMARY}; color: white; border-color: ${PRIMARY}; }
    .navar-time.unavailable { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
    .navar-field { margin-bottom: 14px; }
    .navar-field label {
      display: block; font-size: 11px; font-weight: 700; color: #475569;
      margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .navar-field input, .navar-field select, .navar-field textarea {
      width: 100%; padding: 11px 12px; border-radius: 10px; border: 1px solid #e2e8f0;
      font-size: 15px; outline: none; background: #f8fafc; transition: border 0.2s;
      font-family: inherit;
    }
    .navar-field input:focus, .navar-field textarea:focus { border-color: ${PRIMARY}; background: white; }
    .navar-summary { background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    .navar-summary-row {
      display: flex; justify-content: space-between; padding: 7px 0;
      border-bottom: 1px solid #e2e8f0; font-size: 13px;
    }
    .navar-summary-row:last-child { border-bottom: none; }
    .navar-summary-row span:first-child { color: #64748b; }
    .navar-summary-row span:last-child  { font-weight: 700; color: #0f172a; }
    .navar-success { text-align: center; padding: 10px 0; }
    .navar-success h3 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 12px 0 8px; }
    .navar-success p  { font-size: 14px; color: #64748b; line-height: 1.6; }
    .navar-confirm-box {
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;
      padding: 14px; margin: 16px 0; text-align: left;
    }
    .navar-label { font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 6px; }
    .navar-wa-btn {
      display: block; background: #25d366; color: white; padding: 13px;
      border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px;
      text-align: center; margin-top: 10px; transition: filter 0.2s;
    }
    .navar-wa-btn:hover { filter: brightness(0.9); }
    .navar-loader { text-align: center; padding: 40px; color: #64748b; }
    .navar-error { background: #fee2e2; border-radius: 10px; padding: 12px; color: #991b1b; font-size: 13px; margin-top: 10px; }
    @media (max-width: 480px) {
      #navar-modal { border-radius: 20px 20px 0 0; max-height: 95vh; }
      #navar-overlay { align-items: flex-end; padding: 0; }
    }
  `;
  document.head.appendChild(style);

  // ── STATE ───────────────────────────────────────────────────────
  let state = {
    step: 0,
    services: [],
    selectedService: null,
    selectedDate: null,
    selectedTime: null,
    slots: [],
    preferredStaff: 'Any',
    name: '', phone: '', email: '', notes: '',
    loading: false, error: null,
    bookingRef: null, salonSettings: {}
  };

  // ── FETCH HELPERS ───────────────────────────────────────────────
  async function fetchServices() {
    const r = await fetch(`${API_URL}/api/services?salon_id=${SALON_ID}`);
    const d = await r.json();
    return d.services || [];
  }

  async function fetchSlots(date) {
    const r = await fetch(`${API_URL}/api/available-slots?date=${date}&salonId=${SALON_ID}`);
    const d = await r.json();
    return d.slots || [];
  }

  async function submitBooking(data) {
    const r = await fetch(`${API_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, salonId: SALON_ID, source: 'website' })
    });
    return r.json();
  }

  // ── DATE HELPERS ────────────────────────────────────────────────
  function getNextDates(count = 14) {
    const dates = [];
    const now = new Date();
    const offDays = state.salonSettings?.offDays || [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (let i = 1; dates.length < count; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      if (!offDays.includes(dayNames[d.getDay()])) {
        dates.push({ full: d.toISOString().split('T')[0], day: dayNames[d.getDay()].slice(0, 3), num: d.getDate() });
      }
    }
    return dates;
  }

  // ── RENDER ──────────────────────────────────────────────────────
  function render() {
    const body = document.getElementById('navar-body');
    if (!body) return;
    const steps = ['Service', 'Date', 'Details', 'Confirm'];
    document.querySelectorAll('.navar-step').forEach((el, i) => {
      el.className = 'navar-step' + (i === state.step ? ' active' : i < state.step ? ' done' : '');
    });
    if (state.step === 0) renderServices(body);
    else if (state.step === 1) renderDateTime(body);
    else if (state.step === 2) renderDetails(body);
    else if (state.step === 3) renderConfirm(body);
    else if (state.step === 4) renderSuccess(body);
  }

  function renderServices(body) {
    if (!state.services.length) {
      body.innerHTML = '<div class="navar-loader">Loading services...</div>';
      fetchServices().then(svcs => {
        state.services = svcs.length ? svcs : [
          { id: 1, name: 'Massage', duration: 60, price: 300, currency: 'QAR' },
          { id: 2, name: 'Facial', duration: 60, price: 250, currency: 'QAR' },
          { id: 3, name: 'Body Wrap', duration: 90, price: 400, currency: 'QAR' },
        ];
        renderServices(body);
      }).catch(() => {
        // Fallback to demo services if API not reachable
        state.services = [
          { id: 1, name: 'Swedish Massage', duration: 60, price: 300, currency: 'QAR' },
          { id: 2, name: 'Deep Tissue', duration: 90, price: 400, currency: 'QAR' },
          { id: 3, name: 'Facial', duration: 60, price: 250, currency: 'QAR' },
          { id: 4, name: 'Aromatherapy', duration: 75, price: 350, currency: 'QAR' },
        ];
        renderServices(body);
      });
      return;
    }
    body.innerHTML = `
      <p style="font-size:14px;color:#64748b;margin-bottom:14px">Choose a service to book</p>
      <div class="navar-svc-grid">
        ${state.services.map(s => `
          <div class="navar-svc-card ${state.selectedService?.id === s.id ? 'selected' : ''}"
               onclick="NavarWidget.selectService(${s.id})">
            <div class="navar-svc-name">${s.name}</div>
            <div class="navar-svc-price">${s.currency || 'QAR'} ${s.price}</div>
            <div class="navar-svc-dur">${s.duration} min</div>
          </div>`).join('')}
      </div>
      <button class="navar-btn" onclick="NavarWidget.nextStep()"
        ${!state.selectedService ? 'disabled' : ''}>Continue →</button>`;
  }

  function renderDateTime(body) {
    const dates = getNextDates();
    body.innerHTML = `
      <p style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Select Date</p>
      <div class="navar-dates">
        ${dates.map(d => `
          <div class="navar-date ${state.selectedDate === d.full ? 'selected' : ''}"
               onclick="NavarWidget.selectDate('${d.full}')">
            <div class="navar-date-day">${d.day}</div>
            <div class="navar-date-num">${d.num}</div>
          </div>`).join('')}
      </div>
      <div id="navar-time-section">${state.selectedDate ? '' : '<p style="color:#94a3b8;font-size:13px;margin-top:14px">Select a date to see available times</p>'}</div>
      <button class="navar-btn" onclick="NavarWidget.nextStep()"
        ${!state.selectedDate || !state.selectedTime ? 'disabled' : ''}>Continue →</button>
      <button class="navar-btn-ghost" onclick="NavarWidget.prevStep()">← Back</button>`;

    if (state.selectedDate) renderTimeSlots();
  }

  function renderTimeSlots() {
    const section = document.getElementById('navar-time-section');
    if (!section) return;
    if (!state.slots.length) {
      section.innerHTML = '<div class="navar-loader" style="padding:20px 0">Loading times...</div>';
      fetchSlots(state.selectedDate).then(slots => {
        state.slots = slots;
        renderTimeSlots();
      }).catch(() => {
        // Fallback slots
        const h = [];
        for (let i = 9; i < 19; i++) { h.push({ time: `${i}:00`, available: true }); h.push({ time: `${i}:30`, available: i < 17 }); }
        state.slots = h;
        renderTimeSlots();
      });
      return;
    }
    section.innerHTML = `
      <p style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin:14px 0 8px">Available Times</p>
      <div class="navar-times">
        ${state.slots.map(s => `
          <div class="navar-time ${!s.available ? 'unavailable' : ''} ${state.selectedTime === s.time ? 'selected' : ''}"
               onclick="${s.available ? `NavarWidget.selectTime('${s.time}')` : ''}">
            ${s.time}
          </div>`).join('')}
      </div>`;
  }

  function renderDetails(body) {
    body.innerHTML = `
      <div class="navar-field">
        <label>Your Name *</label>
        <input type="text" id="navar-name" value="${state.name}" placeholder="Full name">
      </div>
      <div class="navar-field">
        <label>Phone / WhatsApp *</label>
        <input type="tel" id="navar-phone" value="${state.phone}" placeholder="+974...">
      </div>
      <div class="navar-field">
        <label>Email (optional)</label>
        <input type="email" id="navar-email" value="${state.email}" placeholder="your@email.com">
      </div>
      <div class="navar-field">
        <label>Notes (optional)</label>
        <textarea id="navar-notes" rows="3" placeholder="Any special requests or preferences...">${state.notes}</textarea>
      </div>
      <button class="navar-btn" onclick="NavarWidget.submitDetails()">Review Booking →</button>
      <button class="navar-btn-ghost" onclick="NavarWidget.prevStep()">← Back</button>`;
  }

  function renderConfirm(body) {
    const s = state.selectedService;
    body.innerHTML = `
      <p style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:14px">Review your booking</p>
      <div class="navar-summary">
        <div class="navar-summary-row"><span>Service</span><span>${s?.name}</span></div>
        <div class="navar-summary-row"><span>Date</span><span>${state.selectedDate}</span></div>
        <div class="navar-summary-row"><span>Time</span><span>${state.selectedTime}</span></div>
        <div class="navar-summary-row"><span>Duration</span><span>${s?.duration} min</span></div>
        <div class="navar-summary-row"><span>Price</span><span>${s?.currency || 'QAR'} ${s?.price}</span></div>
        <div class="navar-summary-row"><span>Name</span><span>${state.name}</span></div>
        <div class="navar-summary-row"><span>Phone</span><span>${state.phone}</span></div>
      </div>
      <div id="navar-submit-error"></div>
      <button class="navar-btn" id="navar-submit-btn" onclick="NavarWidget.confirmSubmit()">
        ✓ Confirm Booking Request
      </button>
      <button class="navar-btn-ghost" onclick="NavarWidget.prevStep()">← Edit</button>`;
  }

  function renderSuccess(body) {
    body.innerHTML = `
      <div class="navar-success">
        <div style="font-size:56px">🎉</div>
        <h3>Booking Request Sent!</h3>
        <p>Thank you <b>${state.name}</b>!<br>
           Your request for <b>${state.selectedService?.name}</b><br>
           on <b>${state.selectedDate}</b> at <b>${state.selectedTime}</b><br>
           has been received.</p>
        <div class="navar-confirm-box">
          <div class="navar-label">Booking Reference</div>
          <div style="font-family:monospace;font-size:15px;font-weight:700;color:#0f172a">${state.bookingRef || 'BK-' + Date.now()}</div>
          <div style="font-size:12px;color:#64748b;margin-top:4px">We will confirm via WhatsApp shortly.</div>
        </div>
        ${state.phone ? `<a href="https://wa.me/${state.phone.replace(/\D/g, '')}" class="navar-wa-btn">📲 Open WhatsApp</a>` : ''}
        <button class="navar-btn" onclick="NavarWidget.reset()" style="margin-top:10px">Book Another</button>
      </div>`;
  }

  // ── BUILD MODAL ─────────────────────────────────────────────────
  function buildModal() {
    const overlay = document.createElement('div');
    overlay.id = 'navar-overlay';
    overlay.innerHTML = `
      <div id="navar-modal">
        <div class="navar-header">
          <div>
            <h2>Book Appointment</h2>
            <p id="navar-salon-subtitle">Loading...</p>
          </div>
          <button class="navar-close" onclick="NavarWidget.close()">✕</button>
        </div>
        <div class="navar-steps">
          ${['Service', 'Date & Time', 'Details', 'Confirm'].map((s, i) => `<div class="navar-step ${i === 0 ? 'active' : ''}">${i + 1}. ${s}</div>`).join('')}
        </div>
        <div class="navar-body" id="navar-body"></div>
      </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) NavarWidget.close(); });
    document.body.appendChild(overlay);
  }

  // ── FLOATING BUTTON ─────────────────────────────────────────────
  function buildButton() {
    if (!SHOW_BTN) return;
    const btn = document.createElement('button');
    btn.id = 'navar-widget-btn';
    btn.innerHTML = `📅 ${BTN_TEXT}`;
    btn.onclick = () => NavarWidget.open();
    document.body.appendChild(btn);
  }

  // ── PUBLIC API ──────────────────────────────────────────────────
  window.NavarWidget = {
    open() {
      document.getElementById('navar-overlay').classList.add('open');
      document.body.style.overflow = 'hidden';
      render();
      // Load salon name
      fetch(`${API_URL}/`).then(r => r.json()).then(d => {
        const el = document.getElementById('navar-salon-subtitle');
        if (el) el.textContent = d.salon || 'Online Booking';
      }).catch(() => {});
    },
    close() {
      document.getElementById('navar-overlay').classList.remove('open');
      document.body.style.overflow = '';
    },
    selectService(id) {
      state.selectedService = state.services.find(s => s.id === id);
      render();
    },
    selectDate(date) {
      state.selectedDate = date;
      state.selectedTime = null;
      state.slots = [];
      render();
    },
    selectTime(time) {
      state.selectedTime = time;
      const btn = document.querySelector('.navar-btn:not(:disabled)');
      // Re-enable next button
      document.querySelectorAll('.navar-btn').forEach(b => b.disabled = false);
      render();
    },
    nextStep() {
      state.step++;
      render();
    },
    prevStep() {
      state.step--;
      render();
    },
    submitDetails() {
      const name = document.getElementById('navar-name')?.value?.trim();
      const phone = document.getElementById('navar-phone')?.value?.trim();
      if (!name) { alert('Please enter your name'); return; }
      if (!phone) { alert('Please enter your phone number'); return; }
      state.name = name;
      state.phone = phone;
      state.email = document.getElementById('navar-email')?.value || '';
      state.notes = document.getElementById('navar-notes')?.value || '';
      state.step = 3;
      render();
    },
    async confirmSubmit() {
      const btn = document.getElementById('navar-submit-btn');
      if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
      try {
        const result = await submitBooking({
          customerName: state.name,
          customerPhone: state.phone,
          customerEmail: state.email,
          service: state.selectedService.name,
          preferredDate: state.selectedDate,
          preferredTime: state.selectedTime,
          preferredStaff: state.preferredStaff,
          notes: state.notes,
        });
        if (result.success) {
          state.bookingRef = result.bookingId;
          state.step = 4;
          render();
        } else {
          const errEl = document.getElementById('navar-submit-error');
          if (errEl) errEl.innerHTML = `<div class="navar-error">${result.error || 'Submission failed. Please try again.'}</div>`;
          if (btn) { btn.disabled = false; btn.textContent = '✓ Confirm Booking Request'; }
        }
      } catch (e) {
        const errEl = document.getElementById('navar-submit-error');
        if (errEl) errEl.innerHTML = '<div class="navar-error">Network error. Please check your connection and try again.</div>';
        if (btn) { btn.disabled = false; btn.textContent = '✓ Confirm Booking Request'; }
      }
    },
    reset() {
      state = { step: 0, services: state.services, selectedService: null, selectedDate: null, selectedTime: null, slots: [], preferredStaff: 'Any', name: '', phone: '', email: '', notes: '', loading: false, error: null, bookingRef: null };
      render();
    }
  };

  // ── INIT ────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    buildModal();
    buildButton();
  });
  if (document.readyState !== 'loading') {
    buildModal();
    buildButton();
  }
})();
