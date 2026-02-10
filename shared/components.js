/* =========================================
   POLYGLOT HEAVEN: SHARED UI COMPONENTS
   ========================================= */

// Helper: get element by ID
function $(id) {
  return document.getElementById(id);
}

// Helper: create element
function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'textContent') el.textContent = v;
    else if (k === 'innerHTML') el.innerHTML = v;
    else el.setAttribute(k, v);
  });
  children.forEach(child => {
    if (typeof child === 'string') el.appendChild(document.createTextNode(child));
    else el.appendChild(child);
  });
  return el;
}

// Toast notification system
function toast(message, type = 'info', duration = 3000) {
  const toast = createEl('div', {
    className: `toast toast-${type}`,
    textContent: message
  });
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('toast-show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Modal dialog component
function createModal(title, content, footer = null) {
  const overlay = createEl('div', { className: 'modal-overlay' });
  const modal = createEl('div', { className: 'modal' });
  const head = createEl('div', { className: 'modal-head' });
  const body = createEl('div', { className: 'modal-body' });
  const foot = footer ? createEl('div', { className: 'modal-foot' }) : null;
  
  head.innerHTML = `<b>${title}</b><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>`;
  
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else {
    body.appendChild(content);
  }
  
  if (foot && footer) {
    if (typeof footer === 'string') {
      foot.innerHTML = footer;
    } else {
      foot.appendChild(footer);
    }
  }
  
  modal.appendChild(head);
  modal.appendChild(body);
  if (foot) modal.appendChild(foot);
  overlay.appendChild(modal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  document.body.appendChild(overlay);
  return overlay;
}

// Gate card component (for Main Hall)
function createGateCard(gate) {
  const card = createEl('div', { 
    className: `gate-card ${gate.locked ? 'gate-locked' : ''}`,
    'data-gate': gate.id
  });
  
  card.innerHTML = `
    <div class="gate-icon">${gate.icon}</div>
    <div class="gate-title">${gate.title}</div>
    <div class="gate-desc">${gate.description}</div>
    ${gate.stats ? `<div class="gate-stats">${gate.stats}</div>` : ''}
  `;
  
  if (!gate.locked) {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      if (gate.href) window.location.href = gate.href;
    });
  }
  
  return card;
}

// Button component
function createButton(text, onClick, variant = 'primary') {
  const btn = createEl('button', {
    className: `btn btn-${variant}`,
    textContent: text
  });
  btn.addEventListener('click', onClick);
  return btn;
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { $, createEl, toast, createModal, createGateCard, createButton };
}
