/**
 * Particulate LLC — Consulting Analytics
 * Lightweight client-side analytics for tracking page visits,
 * form submissions, and Stripe checkout button clicks.
 * 
 * Usage: Add <script src="/js/analytics.js"></script> to any page.
 * Data is stored in localStorage and can be exported to a dashboard.
 */

(function() {
  'use strict';
  
  const STORAGE_KEY = 'particulate_analytics';
  const SESSION_KEY = 'particulate_session';
  
  // Initialize or load session
  function getSession() {
    let session = sessionStorage.getItem(SESSION_KEY);
    if (!session) {
      session = JSON.stringify({
        id: crypto.randomUUID ? crypto.randomUUID() : 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        startedAt: new Date().toISOString(),
        pageViews: [],
        events: []
      });
      sessionStorage.setItem(SESSION_KEY, session);
    }
    return JSON.parse(session);
  }
  
  function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  
  // Track page view
  function trackPageView() {
    const session = getSession();
    const pageView = {
      url: window.location.pathname,
      referrer: document.referrer || 'direct',
      timestamp: new Date().toISOString(),
      title: document.title
    };
    session.pageViews.push(pageView);
    saveSession(session);
    persistEvent('page_view', pageView);
  }
  
  // Track event
  function trackEvent(name, data = {}) {
    const session = getSession();
    const event = {
      name,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.pathname
    };
    session.events.push(event);
    saveSession(session);
    persistEvent(name, data);
  }
  
  // Persist to localStorage (daily buckets)
  function persistEvent(name, data) {
    const today = new Date().toISOString().split('T')[0];
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!stored[today]) stored[today] = [];
    stored[today].push({
      name,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.pathname,
      referrer: document.referrer || 'direct'
    });
    
    // Keep only last 30 days
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    Object.keys(stored).forEach(k => { if (k < cutoff) delete stored[k]; });
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }
  
  // Auto-track Stripe checkout clicks
  function trackStripeCheckout() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('[onclick*="checkout"]');
      if (btn) {
        const onclick = btn.getAttribute('onclick') || '';
        const priceMatch = onclick.match(/checkout\(['"]([^'"]+)['"]/);
        if (priceMatch) {
          trackEvent('stripe_checkout_click', {
            priceId: priceMatch[1],
            buttonText: btn.textContent.trim(),
            page: window.location.pathname
          });
        }
      }
    });
  }
  
  // Auto-track Formspree submissions
  function trackFormspree() {
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.action && form.action.includes('formspree.io')) {
        trackEvent('formspree_submit', {
          formId: form.action.split('/f/')[1] || 'unknown',
          page: window.location.pathname
        });
      }
    });
  }
  
  // Track CTA button clicks
  function trackCTAClicks() {
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.cta-button, .tier-cta, .stripe-btn, [class*="cta"], a[href*="#"]');
      if (btn) {
        trackEvent('cta_click', {
          text: btn.textContent.trim().substring(0, 100),
          href: btn.href || '',
          class: btn.className,
          page: window.location.pathname
        });
      }
    });
  }
  
  // Track scroll depth (25%, 50%, 75%, 100%)
  function trackScrollDepth() {
    const milestones = [25, 50, 75, 100];
    const tracked = new Set();
    
    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      milestones.forEach(m => {
        if (scrollPercent >= m && !tracked.has(m)) {
          tracked.add(m);
          trackEvent('scroll_depth', { percent: m, page: window.location.pathname });
        }
      });
    }, { passive: true });
  }
  
  // Track time on page
  function trackTimeOnPage() {
    const startTime = Date.now();
    window.addEventListener('beforeunload', function() {
      const seconds = Math.round((Date.now() - startTime) / 1000);
      trackEvent('time_on_page', { seconds, page: window.location.pathname });
    });
  }
  
  // Get analytics summary (for dashboard)
  function getSummary() {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const summary = {
      totalDays: Object.keys(stored).length,
      totalEvents: 0,
      pageViews: {},
      checkoutClicks: {},
      formSubmits: {},
      ctaClicks: {},
      topReferrers: {},
      byDay: {}
    };
    
    Object.entries(stored).forEach(([day, events]) => {
      summary.totalEvents += events.length;
      summary.byDay[day] = events.length;
      
      events.forEach(e => {
        // Count by type
        if (e.name === 'page_view') {
          summary.pageViews[e.url] = (summary.pageViews[e.url] || 0) + 1;
        } else if (e.name === 'stripe_checkout_click') {
          const key = e.data.priceId || 'unknown';
          summary.checkoutClicks[key] = (summary.checkoutClicks[key] || 0) + 1;
        } else if (e.name === 'formspree_submit') {
          const key = e.data.formId || 'unknown';
          summary.formSubmits[key] = (summary.formSubmits[key] || 0) + 1;
        } else if (e.name === 'cta_click') {
          summary.ctaClicks[e.url] = (summary.ctaClicks[e.url] || 0) + 1;
        }
        
        // Track referrers
        const ref = e.referrer || 'direct';
        summary.topReferrers[ref] = (summary.topReferrers[ref] || 0) + 1;
      });
    });
    
    return summary;
  }
  
  // Expose for dashboard use
  window.ParticulateAnalytics = {
    track: trackEvent,
    getSummary: getSummary,
    getSession: getSession
  };
  
  // Initialize all trackers
  trackPageView();
  trackStripeCheckout();
  trackFormspree();
  trackCTAClicks();
  trackScrollDepth();
  trackTimeOnPage();
  
  console.log('[Particulate Analytics] Initialized on', window.location.pathname);
})();