/* ══════════════════════════════════════════════════════════════
   Binary Alpha Trader — download page

   Two jobs:
     1. highlight the visitor's platform
     2. repoint every download at the newest release

   The HTML already carries working links to a known-good release. This
   script only ever *overwrites* them on a successful fetch, so the page
   stays functional with JS disabled, offline, or when GitHub's
   unauthenticated rate limit (60/hr per IP) is exhausted.
   ══════════════════════════════════════════════════════════════ */

const REPO = 'binaryalpha-quant/binaryalpha-quant-binary-alpha-releases';

/* Filename → card. Order matters: arm64/x64 are tested before the bare
   .dmg fallthrough, and .exe before anything else. */
const MATCHERS = [
  ['windows',        /\.exe$/i],
  ['mac-arm',        /arm64.*\.dmg$/i],
  ['mac-intel',      /(x64|x86_64|intel).*\.dmg$/i],
  ['linux-appimage', /\.appimage$/i],
  ['linux-deb',      /\.deb$/i],
];

const LABELS = {
  'windows':        'for Windows',
  'mac-arm':        'for Mac',
  'mac-intel':      'for Mac',
  'linux-appimage': 'for Linux',
  'linux-deb':      'for Linux',
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

const mb = bytes => `${(bytes / 1e6).toFixed(1)} MB`;

/* ── platform detection ────────────────────────────────────────── */

/* Safari on Apple Silicon still reports an Intel UA string, so the UA
   alone can't tell the two Macs apart. The WebGL renderer does — it
   names the actual GPU ("Apple M2"). Falls back to arm64, which is the
   likelier machine for a new install; both cards stay visible either
   way, so a wrong guess costs the visitor nothing. */
function macFlavour() {
  try {
    const gl = document.createElement('canvas').getContext('webgl');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '';
    if (/apple\s*m\d/i.test(renderer)) return 'mac-arm';
    if (/intel/i.test(renderer)) return 'mac-intel';
  } catch { /* WebGL blocked or unavailable — fall through */ }
  return 'mac-arm';
}

function detect() {
  const ua = navigator.userAgent;
  const plat = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '';
  const hay = `${plat} ${ua}`;

  if (/android/i.test(ua)) return null;               // no mobile build
  if (/iphone|ipad|ipod/i.test(hay)) return null;
  if (/win/i.test(hay)) return 'windows';
  if (/mac/i.test(hay)) return macFlavour();
  if (/linux|x11|ubuntu/i.test(hay)) return 'linux-appimage';
  return null;
}

/* ── render ────────────────────────────────────────────────────── */

function applyDetection(platform) {
  if (!platform) return;

  const card = $(`.dl[data-platform="${platform}"]`);
  if (!card) return;

  card.classList.add('is-detected');

  const label = $('#primaryOs');
  if (label) label.textContent = ` ${LABELS[platform] || ''}`;

  const link = $('[data-role="link"]', card);
  const size = $('[data-role="size"]', card);
  const primary = $('#primaryDownload');
  const primarySize = $('#primarySize');

  if (primary && link) primary.href = link.href;
  if (primarySize && size) primarySize.textContent = size.textContent;
}

function applyRelease(release) {
  const tag = release.tag_name || '';

  $$('[data-field="version"]').forEach(el => { el.textContent = tag; });
  const note = $('#releaseTag');
  if (note) note.textContent = tag;

  if (release.published_at) {
    const d = new Date(release.published_at);
    $$('[data-field="date"]').forEach(el => {
      el.textContent = d.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
    });
  }

  const assets = release.assets || [];
  let matched = 0;

  for (const [platform, re] of MATCHERS) {
    const asset = assets.find(a => re.test(a.name));
    if (!asset) continue;

    const card = $(`.dl[data-platform="${platform}"]`);
    if (!card) continue;

    const link = $('[data-role="link"]', card);
    const size = $('[data-role="size"]', card);
    if (link) link.href = asset.browser_download_url;
    if (size) size.textContent = mb(asset.size);
    matched++;
  }

  $$('[data-field="platforms"]').forEach(el => {
    el.textContent = `${matched || assets.length} builds`;
  });
}

/* ── video facade ──────────────────────────────────────────────── */

/* Swap the still for a real player only once someone asks. Uses the
   -nocookie host so YouTube can't set tracking cookies, and autoplays
   because the click *is* the play intent. */
function initVideoFacade() {
  const box = $('.ytlite');
  if (!box) return;

  const btn = $('.ytlite__btn', box);
  const id = box.dataset.video;
  if (!btn || !id) return;

  btn.addEventListener('click', () => {
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
    frame.title = 'Binary Alpha Trader — demo';
    frame.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture; web-share';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    box.replaceChildren(frame);
    frame.focus();
  }, { once: true });
}

/* ── boot ──────────────────────────────────────────────────────── */

initVideoFacade();
applyDetection(detect());

/* `/releases/latest` is deliberately not used: it 404s while the newest
   release is flagged as a prerelease. Reading the list and taking the
   newest published entry works in both cases. */
fetch(`https://api.github.com/repos/${REPO}/releases?per_page=10`, {
  headers: { Accept: 'application/vnd.github+json' },
})
  .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
  .then(list => {
    const newest = (Array.isArray(list) ? list : [])
      .filter(r => !r.draft && r.assets && r.assets.length)
      .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))[0];

    if (!newest) return;
    applyRelease(newest);
    applyDetection(detect());   // re-point the hero button at the fresh URL
  })
  .catch(err => {
    // Static links in the HTML remain valid — nothing to do but note it.
    console.warn('[binary-alpha] release lookup failed, using bundled links:', err.message);
  });
