// Lightweight GA4 wrapper.
// gtag is loaded in index.html with a placeholder Measurement ID (G-XXXXXXXXXX).
// Every helper is a safe no-op when gtag is absent (ad blockers, local dev, tests).

function gtagSafe(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// Human-readable names for each tab/page, used as page_title in GA.
const PAGE_TITLES = {
  landing:     'Landing Page',
  onboarding:  'Onboarding Wizard',
  plan:        'Weekly Plan',
  grocery:     'Grocery List',
  mains:       'Mains Library',
  sides:       'Sides Library',
  misc:        'Other Items',
  pantry:      'Pantry',
  marketplace: 'Community Spotlight',
  history:     'Plan History',
  admin:       'Admin — User Management',
};

/**
 * Track an SPA "page view" — call whenever the active tab/page changes.
 * @param {string} page  tab id, e.g. 'plan', 'grocery', 'landing'
 */
export function trackPageView(page) {
  gtagSafe('event', 'page_view', {
    page_title:    PAGE_TITLES[page] || page,
    page_location: `${window.location.origin}/#${page}`,
    page_path:     `/${page}`,
  });
}

/**
 * Track a custom event (button clicks, feature usage…).
 * @param {string} name    event name, e.g. 'surprise_me', 'share_card'
 * @param {object} [params]  optional extra parameters
 */
export function trackEvent(name, params = {}) {
  gtagSafe('event', name, params);
}
