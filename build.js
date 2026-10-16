// Baut die Webseite reelsbox.de aus den Texten im App-Projekt.
// Aufruf: node build.js   (liest ../ReelBox/docs/*.md; Deutsch unter /, Englisch unter /en/)
const fs = require('fs');
const path = require('path');

const DOCS = path.join(__dirname, '..', 'ReelBox', 'docs');

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1">$1</a>')
    .replace(/([\w.+-]+@reelsbox\.de)/g, '<a href="mailto:$1">$1</a>');
}

// Kleines Markdown: Überschriften, Absätze (Zeilenumbrüche bleiben), Listen, Trennlinie.
function md(text) {
  const out = [];
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    if (block === '---') {
      out.push('<hr>');
    } else if (/^#{1,3} /.test(block)) {
      const level = block.match(/^#+/)[0].length;
      out.push(`<h${level}>${inline(block.replace(/^#+ /, ''))}</h${level}>`);
    } else if (/^- /.test(block)) {
      const items = block.split('\n').map((l) => `<li>${inline(l.replace(/^- /, ''))}</li>`);
      out.push(`<ul>${items.join('')}</ul>`);
    } else {
      out.push(`<p>${block.split('\n').map(inline).join('<br>')}</p>`);
    }
  }
  return out.join('\n');
}

const LOGO = `<svg viewBox="0 0 48 48" width="40" height="40" aria-hidden="true"><rect width="48" height="48" rx="12" fill="#25D366"/><path d="M12 18h24v16a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3z" fill="#fff"/><path d="M10 14a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v4H10z" fill="#E7FCE3"/><path d="M21 23.5v8l7-4z" fill="#128C7E"/></svg>`;

// Zwei Sprachen: Deutsch unter /, Englisch unter /en/. Umschalter oben rechts
// führt zur gleichen Seite in der anderen Sprache.
const PATHS = {
  home: { de: '/', en: '/en/' },
  privacy: { de: '/datenschutz/', en: '/en/privacy/' },
  legal: { de: '/impressum/', en: '/en/legal-notice/' },
};
const UI = {
  de: { start: 'Start', privacy: 'Datenschutz', legal: 'Impressum', other: 'English', otherLang: 'en' },
  en: { start: 'Home', privacy: 'Privacy policy', legal: 'Legal notice', other: 'Deutsch', otherLang: 'de' },
};

function page({ key, lang, title, description, body }) {
  const ui = UI[lang];
  const other = ui.otherLang;
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<link rel="alternate" hreflang="de" href="https://reelsbox.de${PATHS[key].de}">
<link rel="alternate" hreflang="en" href="https://reelsbox.de${PATHS[key].en}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="top"><a class="brand" href="${PATHS.home[lang]}">${LOGO}<span>ReelsBox</span></a><a class="lang" href="${PATHS[key][other]}" hreflang="${other}" lang="${other}">${ui.other}</a></header>
<main>
${body}
</main>
<footer>
<a href="${PATHS.home[lang]}">${ui.start}</a> · <a href="${PATHS.privacy[lang]}">${ui.privacy}</a> · <a href="${PATHS.legal[lang]}">${ui.legal}</a>
<div class="small">© ${new Date().getFullYear()} evele GmbH</div>
</footer>
</body>
</html>
`;
}

const HOME = {
  de: `
<section class="hero">
  ${LOGO.replace('width="40" height="40"', 'width="96" height="96"')}
  <h1>ReelsBox</h1>
  <p class="lead">Der Geldbeutel für deine Reels.</p>
  <p>Speichere Videos aus TikTok, YouTube, Instagram und Facebook an einem Ort – in deinen eigenen Ordnern. Mit eigenem Bild, Notiz und Sprachnotiz. Alles bleibt nur auf deinem Handy.</p>
  <p class="badge">Bald bei Google Play</p>
</section>
<section class="steps">
  <div><strong>1. Teilen</strong><span>Im Video auf „Teilen“ tippen und ReelsBox wählen.</span></div>
  <div><strong>2. Ordner wählen</strong><span>TikTok, Rezepte, Sport – du entscheidest.</span></div>
  <div><strong>3. Wiederfinden</strong><span>Suchen, sortieren, mit einem Tipp öffnen.</span></div>
</section>
`,
  en: `
<section class="hero">
  ${LOGO.replace('width="40" height="40"', 'width="96" height="96"')}
  <h1>ReelsBox</h1>
  <p class="lead">A wallet for your reels.</p>
  <p>Save videos from TikTok, YouTube, Instagram and Facebook in one place – in your own folders. With your own image, note and voice note. Everything stays on your phone.</p>
  <p class="badge">Coming soon to Google Play</p>
</section>
<section class="steps">
  <div><strong>1. Share</strong><span>Tap “Share” on a video and choose ReelsBox.</span></div>
  <div><strong>2. Pick a folder</strong><span>TikTok, recipes, sport – you decide.</span></div>
  <div><strong>3. Find it again</strong><span>Search, sort and open with one tap.</span></div>
</section>
`,
};

// Die Texte in docs/*.md: oben Deutsch, nach "---" Englisch.
function split(file) {
  const [de, en] = fs.readFileSync(path.join(DOCS, file), 'utf8').replace(/\r/g, '').split(/\n---\n/);
  return { de: md(de), en: md(en) };
}

const css = `:root{--bg:#F7F7F7;--surface:#fff;--text:#111B21;--muted:#667781;--accent:#25D366;--accent-dark:#128C7E;--chip:#E7FCE3;--border:#E9EDEF}
@media (prefers-color-scheme:dark){:root{--bg:#0B141A;--surface:#111B21;--text:#E9EDEF;--muted:#8696A0;--chip:#103529;--border:#22313A}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--accent-dark)}
@media (prefers-color-scheme:dark){a{color:var(--accent)}}
.top{background:var(--surface);border-bottom:1px solid var(--border);padding:12px 16px}
.top{display:flex;align-items:center;justify-content:space-between}
.lang{font-weight:600;text-decoration:none;border:1px solid var(--border);border-radius:999px;padding:4px 14px}
.brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--text);font-weight:700;font-size:20px}
main{max-width:760px;margin:0 auto;padding:24px 16px 48px}
h1{font-size:30px;line-height:1.25;margin:24px 0 12px}
h2{font-size:21px;margin:32px 0 8px}
hr{border:0;border-top:1px solid var(--border);margin:48px 0}
ul{padding-left:22px}
li{margin:4px 0}
p{overflow-wrap:anywhere}
.hero{text-align:center;padding:24px 0 8px}
.hero h1{font-size:40px;margin:16px 0 4px}
.lead{font-size:22px;color:var(--accent-dark);font-weight:600;margin:0 0 16px}
.badge{display:inline-block;background:var(--chip);color:var(--accent-dark);border-radius:999px;padding:6px 16px;font-weight:600}
.steps{display:grid;gap:12px;margin:32px 0}
@media (min-width:640px){.steps{grid-template-columns:repeat(3,1fr)}}
.steps div{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:4px}
.steps span{color:var(--muted);font-size:15px}
footer{text-align:center;color:var(--muted);font-size:14px;padding:24px 16px 40px;border-top:1px solid var(--border)}
footer .small{margin-top:6px}
`;

function write(rel, content) {
  const file = path.join(__dirname, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

const privacy = split('Datenschutz.md');
const legal = split('Impressum.md');
for (const lang of ['de', 'en']) {
  const de = lang === 'de';
  const dir = (key) => PATHS[key][lang].slice(1);
  write(dir('home') + 'index.html', page({
    key: 'home', lang,
    title: de ? 'ReelsBox – der Geldbeutel für deine Reels' : 'ReelsBox – a wallet for your reels',
    description: de
      ? 'Speichere Videos aus TikTok, YouTube, Instagram und Facebook an einem Ort. Alles bleibt auf deinem Handy.'
      : 'Save videos from TikTok, YouTube, Instagram and Facebook in one place. Everything stays on your phone.',
    body: HOME[lang],
  }));
  write(dir('privacy') + 'index.html', page({
    key: 'privacy', lang,
    title: de ? 'Datenschutz – ReelsBox' : 'Privacy policy – ReelsBox',
    description: de ? 'Datenschutzerklärung der App ReelsBox' : 'Privacy policy of the ReelsBox app',
    body: privacy[lang],
  }));
  write(dir('legal') + 'index.html', page({
    key: 'legal', lang,
    title: de ? 'Impressum – ReelsBox' : 'Legal notice – ReelsBox',
    description: de ? 'Impressum' : 'Legal notice',
    body: legal[lang],
  }));
}
write('style.css', css);
write('favicon.svg', LOGO.replace(' width="40" height="40" aria-hidden="true"', ' xmlns="http://www.w3.org/2000/svg"'));
write('.nojekyll', '');
console.log('fertig');
