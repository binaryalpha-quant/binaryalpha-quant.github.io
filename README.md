# binaryalpha-quant.github.io

Download page for **Binary Alpha Trader**, served at
<https://binaryalpha-quant.github.io/>.

Static HTML/CSS/JS with no build step — GitHub Pages serves this repo root
directly, so a push to `main` is the deploy.

```
index.html    markup + fallback download links
styles.css    all styling
app.js        platform detection + live release lookup
```

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
