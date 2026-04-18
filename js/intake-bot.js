/**
 * Particulate AI Intake Bot
 * Lightweight pre-qualification widget for consulting pages.
 * 
 * Revenue logic: qualifies visitors → routes to Stripe checkout or free resources.
 * Zero dependencies, <5KB, GDPR-friendly (no cookies, no external tracking).
 * 
 * Usage: Add <script src="/js/intake-bot.js"></script> before </body>
 *        and <div id="intake-bot"></div> where you want the widget.
 * 
 * Config: Set window.INTAKE_CONFIG before loading this script.
 */

(function () {
  'use strict';

  // ── Config ────────────────────────────────────────────────────────────
  const CFG = Object.assign({
    service: 'general',       // general | tax | debt-credit | home-buyer | health-nav | retirement | seo-growth | estate-probate
    formAction: 'https://formspree.io/f/xaqlrrna',
    greeting: null,           // Override default greeting
    primaryColor: '#8b5cf6',  // Matches site accent
    position: 'bottom-right', // bottom-right | bottom-left
    autoOpenDelay: 8000,      // Auto-open after 8 seconds
    debug: false,
  }, window.INTAKE_CONFIG || {});

  // ── Service-specific flows ────────────────────────────────────────────
  const FLOWS = {
    'general': {
      greeting: "👋 Hi! I'm Particulate AI. What can I help you with today?",
      steps: [
        { id: 'service', q: 'Which service interests you?', type: 'choice',
          options: ['Tax & Accounting', 'Debt & Credit', 'Home Buying', 'Health Navigation', 'Retirement Planning', 'SEO & Growth', 'Estate & Probate'] },
        { id: 'timeline', q: 'How soon do you need help?', type: 'choice',
          options: ['Immediately', 'This week', 'This month', 'Just exploring'] },
        { id: 'budget', q: 'What investment level works for you?', type: 'choice',
          options: ['$9–$29 (Quick guidance)', '$79–$199 (Standard consultation)', '$299–$499 (Deep dive)', '$699+ (Enterprise)'] },
        { id: 'email', q: "What's your email? (We'll send your personalized roadmap)", type: 'email' },
      ],
      tiers: { '$9–$29 (Quick guidance)': 'budget', '$79–$199 (Standard consultation)': 'standard', '$299–$499 (Deep dive)': 'premium', '$699+ (Enterprise)': 'enterprise' },
    },
    'tax': {
      greeting: "📊 Need help with taxes? I can point you to the right level of support.",
      steps: [
        { id: 'situation', q: 'What best describes your tax situation?', type: 'choice',
          options: ['Individual tax filing', 'Small business taxes', 'Tax debt/IRS issue', 'Tax planning for next year'] },
        { id: 'timeline', q: 'How urgent is this?', type: 'choice',
          options: ['Tax deadline approaching', 'This month', 'Planning ahead'] },
        { id: 'budget', q: 'What level of guidance do you need?', type: 'choice',
          options: ['$29 (Quick assessment)', '$79 (Standard consultation)', '$199 (Comprehensive review)'] },
        { id: 'email', q: 'Email for your personalized tax roadmap:', type: 'email' },
      ],
      tiers: { '$29 (Quick assessment)': 'basic', '$79 (Standard consultation)': 'standard', '$199 (Comprehensive review)': 'premium' },
    },
    'debt-credit': {
      greeting: "💳 Debt and credit issues? You're not alone. Let me help you find the right plan.",
      steps: [
        { id: 'situation', q: 'What kind of debt are you dealing with?', type: 'choice',
          options: ['Credit cards', 'Medical bills', 'Student loans', 'Multiple types'] },
        { id: 'amount', q: 'Approximate total debt?', type: 'choice',
          options: ['Under $10K', '$10K–$50K', '$50K–$100K', 'Over $100K'] },
        { id: 'budget', q: 'What level of help do you need?', type: 'choice',
          options: ['$9 (Quick assessment)', '$29 (Standard plan)', '$79 (Full payoff strategy)'] },
        { id: 'email', q: 'Email for your debt freedom roadmap:', type: 'email' },
      ],
      tiers: { '$9 (Quick assessment)': 'basic', '$29 (Standard plan)': 'standard', '$79 (Full payoff strategy)': 'premium' },
    },
    'home-buyer': {
      greeting: "🏠 Buying a home? Let me make sure you don't overpay.",
      steps: [
        { id: 'stage', q: 'Where are you in the home buying process?', type: 'choice',
          options: ['Just starting to look', 'Pre-approval stage', 'Have an accepted offer', 'Already closed / post-purchase'] },
        { id: 'budget', q: 'What level of guidance do you need?', type: 'choice',
          options: ['$9 (Quick roadmap)', '$29 (Detailed breakdown)', '$79 (Guided buying plan)'] },
        { id: 'email', q: 'Email for your home buying roadmap:', type: 'email' },
      ],
      tiers: { '$9 (Quick roadmap)': 'basic', '$29 (Detailed breakdown)': 'standard', '$79 (Guided buying plan)': 'premium' },
    },
    'health-nav': {
      greeting: "🏥 Healthcare bills shouldn't bankrupt you. Let me help navigate the system.",
      steps: [
        { id: 'situation', q: 'What healthcare situation are you dealing with?', type: 'choice',
          options: ['Unexpected medical bill', 'Insurance dispute', 'Ongoing chronic care costs', 'Comparing insurance plans'] },
        { id: 'budget', q: 'What level of guidance do you need?', type: 'choice',
          options: ['$9 (Quick assessment)', '$29 (Standard navigation)', '$79 (Full advocacy plan)'] },
        { id: 'email', q: 'Email for your healthcare navigation guide:', type: 'email' },
      ],
      tiers: { '$9 (Quick assessment)': 'basic', '$29 (Standard navigation)': 'standard', '$79 (Full advocacy plan)': 'premium' },
    },
    'retirement': {
      greeting: "📈 Planning for retirement? Let me help you maximize your future.",
      steps: [
        { id: 'stage', q: 'Where are you in retirement planning?', type: 'choice',
          options: ['Just starting', 'Mid-career reassessment', 'Near retirement', 'Already retired'] },
        { id: 'budget', q: 'What level of guidance do you need?', type: 'choice',
          options: ['$29 (Basic roadmap)', '$79 (Standard planning)', '$499 (Comprehensive retirement blueprint)'] },
        { id: 'email', q: 'Email for your retirement roadmap:', type: 'email' },
      ],
      tiers: { '$29 (Basic roadmap)': 'basic', '$79 (Standard planning)': 'standard', '$499 (Comprehensive retirement blueprint)': 'premium' },
    },
    'seo-growth': {
      greeting: "🚀 Want more customers finding you online? Let me assess your current situation.",
      steps: [
        { id: 'need', q: 'What do you need most?', type: 'choice',
          options: ['Local SEO (Google Business Profile)', 'Website SEO audit', 'Content strategy', 'Full growth plan'] },
        { id: 'budget', q: 'What investment level works?', type: 'choice',
          options: ['$9 (Quick audit)', '$59 (Growth audit)', '$250 (Growth partner monthly)'] },
        { id: 'email', q: 'Email for your growth assessment:', type: 'email' },
      ],
      tiers: { '$9 (Quick audit)': 'basic', '$59 (Growth audit)': 'standard', '$250 (Growth partner monthly)': 'premium' },
    },
    'estate-probate': {
      greeting: "🙏 Dealing with a loss is hard enough. Let me help you navigate what comes next.",
      steps: [
        { id: 'situation', q: 'What best describes your situation?', type: 'choice',
          options: ['Someone just passed away', 'Planning ahead (estate planning)', 'Already in probate', 'Debt collectors contacting me'] },
        { id: 'budget', q: 'What level of guidance do you need?', type: 'choice',
          options: ['$79 (Essential Guide)', '$399 (Family Navigator)', '$1,499 (Estate Guardian)'] },
        { id: 'email', q: 'Email for your estate navigation guide:', type: 'email' },
      ],
      tiers: { '$79 (Essential Guide)': 'essential', '$399 (Family Navigator)': 'navigator', '$1,499 (Estate Guardian)': 'guardian' },
    },
  };

  // ── Stripe Price Map ──────────────────────────────────────────────────
  const STRIPE_PRICES = {
    'home-buyer':   { basic: 'price_1TLV7fFCjIsAzbKcH7j746YP', standard: 'price_1TLV7fFCjIsAzbKclr4BY4bw', premium: 'price_1TLV7fFCjIsAzbKc3sldvipJ' },
    'debt-credit':  { basic: 'price_1TLbX1FCjIsAzbKc1DJuwIYG', standard: 'price_1TLbX1FCjIsAzbKcfUsmmJcs', premium: 'price_1TLbX1FCjIsAzbKcxsCe57CT' },
    'health-nav':   { basic: 'price_1TLbZ4FCjIsAzbKcNPGmKA5d', standard: 'price_1TLbZWFCjIsAzbKcdJcTivtq', premium: 'price_1TLbZdFCjIsAzbKcUj916SO8' },
    'tax':          { basic: 'price_1TLxRXFCjIsAzbKcNO6tPGS4', standard: 'price_1TLxRXFCjIsAzbKcquSr2wNp', premium: 'price_1TLxRXFCjIsAzbKcM5BDVOJF' },
    'retirement':   { basic: 'price_1TLxq5FCjIsAzbKcxZE29Yi9', standard: 'price_1TLxq5FCjIsAzbKcxBVccCzX', premium: 'price_1TLxq5FCjIsAzbKcwHXBz1qW' },
    'seo-growth':  { basic: 'price_1TLyk0FCjIsAzbKcjMegHLD3', standard: 'price_1TLyk0FCjIsAzbKcxxmrdKCq', premium: 'price_1TLyk0FCjIsAzbKcDnZSl7Kk' },
    'agent-setup':  { starter: 'price_1TLxN5FCjIsAzbKcp8chnOSh', professional: 'price_1TLxN5FCjIsAzbKcYElw34Q4', enterprise: 'price_1TLxN5FCjIsAzbKc7EONPzBe' },
    'estate-probate': { essential: 'PLACEHOLDER_ESSENTIAL_PRICE_ID', navigator: 'PLACEHOLDER_NAVIGATOR_PRICE_ID', guardian: 'PLACEHOLDER_GUARDIAN_PRICE_ID' },
  };

  // ── State ──────────────────────────────────────────────────────────────
  let currentStep = 0;
  let answers = {};
  let open = false;
  let minimized = false;

  const flow = FLOWS[CFG.service] || FLOWS['general'];
  const greeting = CFG.greeting || flow.greeting;

  // ── Render ─────────────────────────────────────────────────────────────
  function createStyles() {
    const s = document.createElement('style');
    s.textContent = `
      #intake-bot { position: fixed; ${CFG.position === 'bottom-left' ? 'left: 20px' : 'right: 20px'}; bottom: 20px; z-index: 99999; font-family: 'Inter', -apple-system, sans-serif; }
      #intake-trigger { width: 56px; height: 56px; border-radius: 28px; background: ${CFG.primaryColor}; border: none; cursor: pointer; box-shadow: 0 4px 16px rgba(139,92,246,0.4); display: flex; align-items: center; justify-content: center; transition: transform 0.2s, box-shadow 0.2s; }
      #intake-trigger:hover { transform: scale(1.08); box-shadow: 0 6px 24px rgba(139,92,246,0.5); }
      #intake-trigger svg { width: 24px; height: 24px; fill: white; }
      #intake-window { display: none; position: absolute; bottom: 70px; ${CFG.position === 'bottom-left' ? 'left: 0' : 'right: 0'}; width: 360px; max-height: 520px; background: #0c0c14; border: 1px solid #1a1a28; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
      #intake-window.open { display: flex; flex-direction: column; animation: intake-slide-in 0.3s ease-out; }
      @keyframes intake-slide-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      #intake-header { padding: 16px; background: linear-gradient(135deg, ${CFG.primaryColor}, #6d28d9); color: white; display: flex; justify-content: space-between; align-items: center; }
      #intake-header h3 { margin: 0; font-size: 14px; font-weight: 600; }
      #intake-close { background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 4px; }
      #intake-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; max-height: 380px; }
      .msg { padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; max-width: 85%; word-wrap: break-word; }
      .msg.bot { background: #1a1a28; color: #e8e8f4; align-self: flex-start; }
      .msg.user { background: ${CFG.primaryColor}; color: white; align-self: flex-end; }
      .msg.options { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; background: none; align-self: flex-start; }
      .opt-btn { background: #1a1a28; color: #c4b5fd; border: 1px solid #2d2d44; border-radius: 8px; padding: 8px 14px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
      .opt-btn:hover { background: ${CFG.primaryColor}; color: white; border-color: ${CFG.primaryColor}; }
      .msg.cta { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; align-self: center; text-align: center; border-radius: 12px; padding: 16px; cursor: pointer; font-weight: 600; }
      .msg.cta:hover { opacity: 0.9; }
      #intake-input-area { padding: 12px 16px; border-top: 1px solid #1a1a28; display: none; }
      #intake-email-input { width: 100%; padding: 10px 14px; background: #1a1a28; border: 1px solid #2d2d44; border-radius: 8px; color: #e8e8f4; font-size: 13px; outline: none; }
      #intake-email-input:focus { border-color: ${CFG.primaryColor}; }
      #intake-email-submit { width: 100%; padding: 10px; background: ${CFG.primaryColor}; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; margin-top: 8px; }
      #intake-email-submit:hover { opacity: 0.9; }
      .typing-dots { display: inline-flex; gap: 4px; }
      .typing-dots span { width: 6px; height: 6px; background: #7070a0; border-radius: 50%; animation: dot-bounce 1.4s infinite; }
      .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
      .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes dot-bounce { 0%, 80%, 100% { transform: scale(0.6); } 40% { transform: scale(1); } }
    `;
    document.head.appendChild(s);
  }

  function createDOM() {
    const container = document.getElementById('intake-bot');
    if (!container) { document.body.insertAdjacentHTML('beforeend', '<div id="intake-bot"></div>'); }
    const bot = document.getElementById('intake-bot');
    bot.innerHTML = `
      <button id="intake-trigger" aria-label="Open consultation assistant">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
      </button>
      <div id="intake-window">
        <div id="intake-header">
          <h3>Particulate AI</h3>
          <button id="intake-close">✕</button>
        </div>
        <div id="intake-messages"></div>
        <div id="intake-input-area">
          <input type="email" id="intake-email-input" placeholder="your@email.com" autocomplete="email" />
          <button id="intake-email-submit">Get My Free Assessment →</button>
        </div>
      </div>
    `;
    return bot;
  }

  function addMsg(text, type) {
    const el = document.getElementById('intake-messages');
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    div.innerHTML = text;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
  }

  function addOptions(options) {
    const el = document.getElementById('intake-messages');
    const div = document.createElement('div');
    div.className = 'msg options';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.textContent = opt;
      btn.onclick = () => selectOption(opt);
      div.appendChild(btn);
    });
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function showTyping() {
    const el = document.getElementById('intake-messages');
    const div = document.createElement('div');
    div.className = 'msg bot';
    div.id = 'typing-indicator';
    div.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
  }

  function selectOption(text) {
    addMsg(text, 'user');
    const step = flow.steps[currentStep];
    answers[step.id] = text;
    currentStep++;
    setTimeout(() => advanceFlow(), 400);
  }

  function advanceFlow() {
    if (currentStep >= flow.steps.length) {
      // All done — submit and route
      completeFlow();
      return;
    }
    const step = flow.steps[currentStep];
    showTyping();
    setTimeout(() => {
      removeTyping();
      if (step.type === 'choice') {
        addMsg(step.q, 'bot');
        addOptions(step.options);
      } else if (step.type === 'email') {
        addMsg(step.q, 'bot');
        document.getElementById('intake-input-area').style.display = 'block';
      }
    }, 600);
  }

  function completeFlow() {
    showTyping();
    // Submit to Formspree
    const formData = new FormData();
    formData.append('_subject', `[Particulate] ${CFG.service} inquiry — ${answers.timeline || answers.situation || 'general'}`);
    Object.entries(answers).forEach(([k, v]) => formData.append(k, v));
    formData.append('service', CFG.service);
    formData.append('source', window.location.href);
    formData.append('timestamp', new Date().toISOString());

    fetch(CFG.formAction, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } })
      .catch(() => {}); // Fire and forget — don't block UX

    // Determine tier
    const budgetKey = answers.budget || answers.amount || Object.values(answers).pop();
    const tier = flow.tiers[budgetKey];

    setTimeout(() => {
      removeTyping();
      const priceId = STRIPE_PRICES[CFG.service]?.[tier];
      const isPlaceholder = priceId && priceId.startsWith('PLACEHOLDER');

      if (priceId && !isPlaceholder) {
        addMsg("✅ Great choice! Starting your checkout now...", 'bot');
        addMsg(`<div class="msg cta" onclick="window.location.href='https://particulatellc.com/consulting/${CFG.service}/?checkout=${tier}'">Continue to Checkout →</div>`, 'bot');
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          window.location.href = `https://particulatellc.com/consulting/${CFG.service}/?checkout=${tier}`;
        }, 2000);
      } else {
        addMsg("✅ Thanks! We've received your inquiry and will reach out within 24 hours.", 'bot');
        addMsg("📋 In the meantime, check our FAQ below for quick answers.", 'bot');
      }
    }, 1000);
  }

  // ── Init ───────────────────────────────────────────────────────────────
  function init() {
    createStyles();
    const bot = createDOM();

    document.getElementById('intake-trigger').onclick = () => {
      open = !open;
      document.getElementById('intake-window').classList.toggle('open', open);
      if (open && currentStep === 0) {
        addMsg(greeting, 'bot');
        currentStep = 0;
        setTimeout(() => advanceFlow(), 800);
      }
    };

    document.getElementById('intake-close').onclick = () => {
      open = false;
      document.getElementById('intake-window').classList.remove('open');
    };

    document.getElementById('intake-email-submit').onclick = () => {
      const email = document.getElementById('intake-email-input').value.trim();
      if (email && email.includes('@')) {
        answers.email = email;
        addMsg(email, 'user');
        document.getElementById('intake-input-area').style.display = 'none';
        currentStep++;
        setTimeout(() => completeFlow(), 400);
      }
    };

    document.getElementById('intake-email-input').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('intake-email-submit').click();
    };

    // Auto-open after delay
    if (CFG.autoOpenDelay > 0) {
      setTimeout(() => {
        if (!open) {
          document.getElementById('intake-trigger').click();
        }
      }, CFG.autoOpenDelay);
    }

    if (CFG.debug) console.log('[IntakeBot] Initialized for service:', CFG.service);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();