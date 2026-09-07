/* ══════════════════════════════════════════════════════════════
   Binary Alpha — Phase 0 marketing tracking (GA4-ready)

   Captures first-touch UTMs into sessionStorage, then fires
   download_click / discord_click / youtube_click with those
   params attached. Loads gtag only when a real G- measurement
   ID is set via window.BA_GA4_ID or <meta name="ba-ga4-id">.
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var STORAGE_KEY = 'ba_attribution';
  var ATTR_KEYS = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_content',
    'utm_term',
    'gclid',
    'fbclid',
  ];

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  function readGa4Id() {
    var fromWindow = typeof window.BA_GA4_ID === 'string' ? window.BA_GA4_ID.trim() : '';
    if (/^G-[A-Z0-9]+$/i.test(fromWindow)) return fromWindow;

    var meta = document.querySelector('meta[name="ba-ga4-id"]');
    var fromMeta = meta ? (meta.getAttribute('content') || '').trim() : '';
    if (/^G-[A-Z0-9]+$/i.test(fromMeta)) return fromMeta;

    return '';
  }

  function captureAttribution() {
    try {
      var existing = sessionStorage.getItem(STORAGE_KEY);
      if (existing != null) {
        try {
          return JSON.parse(existing) || {};
        } catch (_) {
          /* corrupt — fall through and rewrite */
        }
      }
    } catch (_) {
      /* sessionStorage blocked */
    }

    var params = new URLSearchParams(window.location.search);
    var attrs = {};
    for (var i = 0; i < ATTR_KEYS.length; i++) {
      var key = ATTR_KEYS[i];
      var val = params.get(key);
      if (val) attrs[key] = val;
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attrs));
    } catch (_) {
      /* ignore quota / private mode */
    }
    return attrs;
  }

  function getAttribution() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        try {
          return JSON.parse(raw) || {};
        } catch (_) {
          /* fall through */
        }
      }
    } catch (_) {
      /* ignore */
    }
    return captureAttribution();
  }

  var ga4Id = readGa4Id();
  var attribution = captureAttribution();

  if (ga4Id) {
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4Id);
    document.head.appendChild(script);
    gtag('js', new Date());
    gtag('config', ga4Id, { send_page_view: true });
  }

  function track(eventName, params) {
    var payload = {};
    var attrs = getAttribution();
    var key;

    for (key in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, key) && attrs[key]) {
        payload[key] = attrs[key];
      }
    }
    if (params) {
      for (key in params) {
        if (Object.prototype.hasOwnProperty.call(params, key) && params[key] != null && params[key] !== '') {
          payload[key] = params[key];
        }
      }
    }

    window.dataLayer.push(Object.assign({ event: eventName }, payload));

    if (ga4Id && typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }

    /* Always log so Marketing can smoke-test before a G- ID is set. */
    console.info('[ba-track]', eventName, payload);
  }

  window.baTrack = track;

  function onClick(event) {
    var el = event.target && event.target.closest
      ? event.target.closest('[data-ba-event]')
      : null;
    if (!el) return;

    var eventName = el.getAttribute('data-ba-event');
    if (!eventName) return;

    var params = {};
    var platform = el.getAttribute('data-ba-platform');
    var label = el.getAttribute('data-ba-label');
    var location = el.getAttribute('data-ba-location');

    if (platform) params.platform = platform;
    if (label) params.label = label;
    if (location) params.location = location;

    track(eventName, params);
  }

  document.addEventListener('click', onClick, true);

  /* Expose for debugging / future hooks without leaking secrets. */
  window.BA_TRACKING = {
    getAttribution: getAttribution,
    ga4Id: ga4Id || null,
    track: track,
  };

  if (!ga4Id) {
    console.info(
      '[ba-track] No GA4 ID configured. Events go to dataLayer + console. ' +
        'Set window.BA_GA4_ID or <meta name="ba-ga4-id" content="G-XXXX">. See TRACKING.md.'
    );
  } else {
    console.info('[ba-track] GA4 ready:', ga4Id, 'attribution:', attribution);
  }
})();
