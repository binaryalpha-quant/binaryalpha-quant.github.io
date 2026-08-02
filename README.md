# binaryalpha-quant.github.io

Download page for **Binary Alpha Trader**, served at
<https://binaryalpha-quant.github.io/>.

Static HTML/CSS/JS with no build step — GitHub Pages serves this repo root
directly, so a push to `main` is the deploy.

```
index.html        markup + fallback download links
styles.css        all styling
app.js            platform detection, live release lookup, video facade
media/poster.jpg  video still + og:image
```

## The demo video

Embedded from YouTube (`nlgZt3hlPxM`), not committed here — a 9.5 MB mp4 in
the repo would be permanent history weight and would bill every play against
the Pages bandwidth budget.

It loads as a **facade**: the page shows `media/poster.jpg` and only builds the
iframe when someone clicks, against `youtube-nocookie.com`. A plain embed would
pull roughly a megabyte of YouTube script and set tracking cookies on every
visit whether or not anyone watches. The still is self-hosted rather than
hotlinked to `i.ytimg.com` so that no third party is contacted until the
visitor asks for the video.

To swap the video, change `data-video` on `.ytlite` in `index.html` and replace
`media/poster.jpg`.

## How downloads stay current

`app.js` reads the GitHub Releases API for
[binaryalpha-quant-binary-alpha-releases](https://github.com/binaryalpha-quant/binaryalpha-quant-binary-alpha-releases)
and rewrites every download link, file size and version string on page load.
Cutting a new release updates this page with no edit here.

The links hard-coded in `index.html` are a working fallback for visitors with
JavaScript disabled, no network, or a tripped API rate limit (GitHub allows 60
unauthenticated requests per hour per IP). Refresh them whenever it's
convenient — the page is never broken if you don't.

`/releases/latest` is deliberately not used: it 404s while the newest release
is flagged as a prerelease. `app.js` reads the release list and takes the
newest published entry instead, which works either way.

## Installers are not hosted here

They stay on the releases repo. GitHub Pages has a ~100 GB/month soft
bandwidth limit and the installers are 92–134 MB each; release assets are
served separately and don't count against it.

## Custom domain

Add a `CNAME` file containing the bare domain, then point DNS at GitHub Pages.
Nothing else needs to change.
