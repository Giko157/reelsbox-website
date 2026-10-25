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
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/style.css?v=${Date.now()}">
</head>
<body>
<header class="top"><a class="brand" href="${PATHS.home[lang]}">${LOGO}<span>ReelsBox</span></a><a class="lang" href="${PATHS[key][other]}" hreflang="${other}" lang="${other}">${ui.other}</a></header>
<main${key === 'home' ? ' class="home"' : ''}>
${body}
</main>
<footer>
<a href="${PATHS.home[lang]}">${ui.start}</a> · <a href="${PATHS.privacy[lang]}">${ui.privacy}</a> · <a href="${PATHS.legal[lang]}">${ui.legal}</a>
<div class="social"><a href="https://www.instagram.com/reelsboxapp/" target="_blank" rel="noopener">Instagram</a> · <a href="https://www.tiktok.com/@reelsboxapp" target="_blank" rel="noopener">TikTok</a> · <a href="https://www.facebook.com/1409324085595600" target="_blank" rel="noopener">Facebook</a></div>
<div class="small">© ${new Date().getFullYear()} evele GmbH</div>
</footer>
</body>
</html>
`;
}

// Knopf zum Play Store (Store-Seite in der passenden Sprache).
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.reelsbox.app';
function playButton(lang, label) {
  return `<a class="play" href="${PLAY_URL}&amp;hl=${lang}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>${label}</a>`;
}

// ---------- Startseite ----------
// Aufbau: Kopfbereich (Text + 2 Handys) · Farbband mit 4 Symbolen · Funktionen
// (abwechselnd Bild/Text) · "Und noch mehr" · Abschluss mit Play-Knopf.
// Bilder: img/<lang>-*.webp (600 px breit, aus ReelBox/play-store/raw).

// Symbole fürs Farbband (inline SVG, keine Icon-Schrift).
const ICONS = {
  share: '<path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  noads: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18h3"/><path d="M9.5 10.5l2 2 3.5-3.5"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Handy-Bild mit CSS-Rahmen. Ist `video` gesetzt (z. B. 'video/de-teilen.mp4'),
// erscheint statt des Bildes ein stummes Video; das Bild dient dann als Vorschau
// (poster). Videos werden erst geladen, wenn sie sichtbar werden (Skript unten).
function phone({ img, alt, video, eager, cls = '' }) {
  const src = `/img/${img}.webp`;
  const inner = video
    ? `<video muted loop playsinline preload="none" poster="${src}" data-src="/${video}" width="600" height="1334" aria-label="${alt}"></video>`
    : `<img src="${src}" alt="${alt}" width="600" height="1334"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}>`;
  return `<figure class="${('phone ' + cls).trim()}">${inner}</figure>`;
}

const VIDEO_SCRIPT = `<script>
(function(){var v=document.querySelectorAll('video[data-src]');if(!v.length)return;
var calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function load(el){if(!el.src){el.src=el.getAttribute('data-src');}if(!calm){el.play().catch(function(){});}}
if(!('IntersectionObserver' in window)){v.forEach(load);return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){load(e.target);}else if(e.target.src){e.target.pause();}});},{rootMargin:'200px'});
v.forEach(function(el){io.observe(el);});})();
</script>`;

const HOME_TEXT = {
  de: {
    kicker: 'Der Geldbeutel für deine Reels',
    h1: 'Alle Reels. <span class="hl">Ein Ort.</span>',
    lead: 'Speichere Videos aus TikTok, YouTube, Instagram und Facebook in deinen eigenen Ordnern. Ein Tipp auf „Teilen“ genügt.',
    play: 'Bei Google Play laden',
    note: 'Kostenlos · ohne Werbung · für Android',
    hero: [
      { img: 'de-04-teilen', alt: 'Speichern-Fenster von ReelsBox: Ordner für ein geteiltes Instagram-Reel auswählen' },
      { img: 'de-02-ordner', alt: 'ReelsBox-Startseite mit Ordnern wie Rezepte, Workout zu Hause und Reiseideen' },
    ],
    band: [
      ['share', 'Aus jeder App teilen', 'TikTok, YouTube, Instagram, Facebook und mehr.'],
      ['folder', 'Eigene Ordner', 'Mit App-Logo, Emoji oder eigenem Foto.'],
      ['noads', 'Kein Konto, keine Werbung', 'Installieren und sofort loslegen.'],
      ['phone', 'Bleibt auf deinem Handy', 'Alles wird nur auf deinem Handy gespeichert.'],
    ],
    featuresTitle: 'Das kann ReelsBox',
    features: [
      // video: später z. B. 'video/de-teilen.mp4' eintragen (Video-Platz 1).
      { img: 'de-04-teilen', video: null, alt: 'Speichern-Fenster mit Ordner-Auswahl, Bild und Sprachnotiz',
        h: 'Teilen in 3 Taps', p: 'Im Video auf „Teilen“ tippen, ReelsBox wählen, Ordner aussuchen. Fertig – ReelsBox merkt sich nur den Link.' },
      { img: 'de-07-ordnerfoto', alt: 'Große Vorschau des Ordnerfotos „Reiseideen“ mit den Knöpfen Öffnen, Bild ändern, Bearbeiten', badge: 'NEU: eigenes Ordnerfoto',
        h: 'Ordner wie im Chat', p: 'Sortiere nach Rezepten, Sport oder Reisen – mit App-Logo, Emoji oder eigenem Foto. Ein Tipp aufs Ordnerbild zeigt es groß.' },
      { img: 'de-03-rezepte', alt: 'Ordner „Rezepte“ mit großen Karten, Vorschaubild und Notiz',
        h: 'Mit Bild und Notiz', p: 'Bei TikTok und YouTube kommen Vorschaubild und Titel von selbst. Dazu eigene Bilder, Notizen, Suchwörter und Sprachnotizen.' },
      { img: 'de-05-suche', alt: 'Suche nach „Minute“ mit zwei Treffern aus verschiedenen Ordnern',
        h: 'Schnell wiederfinden', p: 'Die Suche findet Ordner und Einträge aus allen Ordnern. Ein Tipp öffnet das Video wieder.' },
      // video: später z. B. 'video/de-playlist.mp4' eintragen (Video-Platz 2).
      { img: 'de-06-playlist', video: null, alt: 'Ordner „Workout zu Hause“ mit dem Knopf „Playlist abspielen (4)“', badge: 'NEU',
        h: 'Ordner als Playlist', p: 'Mehrere YouTube-Videos in einem Ordner? Ein Tipp auf „Playlist abspielen“, und YouTube spielt sie nacheinander ab.' },
      { img: 'de-08-statistik', alt: 'Profil mit der Karte „Woher deine Einträge kommen“: Balken für TikTok, YouTube, Instagram und Facebook', badge: 'NEU',
        h: 'Woher kommen deine Reels?', p: 'Im Profil siehst du, wie viele Einträge aus TikTok, Instagram, YouTube und anderen Apps stammen. Gezählt wird nur auf deinem Handy.' },
    ],
    moreTitle: 'Und noch mehr',
    more: [
      ['Sicherung als Datei', 'Zum Aufbewahren oder für ein neues Handy.'],
      ['Auch Fotos und Dateien', 'PDF, Word, Excel und PowerPoint gleich mit ablegen.'],
      ['Schon gespeichert?', 'ReelsBox sagt Bescheid, wenn ein Video schon da ist.'],
    ],
    ctaTitle: 'Deine Reels. <span class="hl">Endlich sortiert.</span>',
    ctaText: 'Kostenlos, ohne Werbung, keine Anmeldung – alles bleibt auf deinem Handy.',
  },
  en: {
    kicker: 'A wallet for your reels',
    h1: 'All Reels. <span class="hl">One Place.</span>',
    lead: 'Save videos from TikTok, YouTube, Instagram and Facebook in your own folders. One tap on “Share” is all it takes.',
    play: 'Get it on Google Play',
    note: 'Free · no ads · for Android',
    hero: [
      { img: 'en-04-share', alt: 'ReelsBox save screen: picking a folder for a shared Instagram reel' },
      { img: 'en-02-folders', alt: 'ReelsBox home screen with folders like Recipes, Home workout and Travel ideas' },
    ],
    band: [
      ['share', 'Share from any app', 'TikTok, YouTube, Instagram, Facebook and more.'],
      ['folder', 'Your own folders', 'With app logo, emoji or your own photo.'],
      ['noads', 'No account, no ads', 'Install and get started right away.'],
      ['phone', 'Stays on your phone', 'Everything is stored only on your phone.'],
    ],
    featuresTitle: 'What ReelsBox can do',
    features: [
      { img: 'en-04-share', video: null, alt: 'Save screen with folder choice, picture and voice note',
        h: 'Share in 3 taps', p: 'Tap “Share” on a video, choose ReelsBox, pick a folder. Done – ReelsBox only keeps the link.' },
      { img: 'en-07-folder-photo', alt: 'Big preview of the folder photo “Travel ideas” with the buttons Open, Change picture, Edit', badge: 'NEW: your own folder photo',
        h: 'Folders like a chat', p: 'Sort into recipes, sport or travel – with app logo, emoji or your own photo. Tap a folder picture to see it big.' },
      { img: 'en-03-recipes', alt: 'Folder “Recipes” with large cards, thumbnail and note',
        h: 'With picture and note', p: 'Thumbnail and title for TikTok and YouTube are added automatically. Add your own pictures, notes, search words and voice notes.' },
      { img: 'en-05-search', alt: 'Search for “minute” with two results from different folders',
        h: 'Find everything fast', p: 'Search finds folders and items across all folders. One tap opens the video again.' },
      { img: 'en-06-playlist', video: null, alt: 'Folder “Home workout” with the button “Play as playlist (4)”', badge: 'NEW',
        h: 'Folder as a playlist', p: 'Several YouTube videos in one folder? Tap “Play as playlist” and YouTube plays them one after another.' },
      { img: 'en-08-stats', alt: 'Profile with the card “Where your items come from”: bars for TikTok, YouTube, Instagram and Facebook', badge: 'NEW',
        h: 'Where your reels come from', p: 'Your profile shows how many items come from TikTok, Instagram, YouTube and other apps. Counted only on your phone.' },
    ],
    moreTitle: 'And there’s more',
    more: [
      ['Backup as a file', 'To keep safe or move to a new phone.'],
      ['Photos and files too', 'Keep PDFs, Word, Excel and PowerPoint files as well.'],
      ['Already saved?', 'ReelsBox tells you when a video is already there.'],
    ],
    ctaTitle: 'Your reels. <span class="hl">Finally sorted.</span>',
    ctaText: 'Free, no ads, no sign-up – everything stays on your phone.',
  },
};

function home(lang) {
  const t = HOME_TEXT[lang];
  const hasVideo = t.features.some((f) => f.video);
  return `
<section class="hero"><div class="wrap hero-grid">
  <div class="hero-text">
    <p class="kicker">${t.kicker}</p>
    <h1>${t.h1}</h1>
    <p class="lead">${t.lead}</p>
    ${playButton(lang, t.play)}
    <p class="note">${t.note}</p>
  </div>
  <div class="hero-phones">
    ${phone({ ...t.hero[0], eager: true, cls: 'back' })}
    ${phone({ ...t.hero[1], eager: true, cls: 'front' })}
  </div>
</div></section>
<section class="band"><div class="wrap band-grid">
${t.band.map(([ic, h, p]) => `  <div class="band-item"><span class="band-icon">${icon(ic)}</span><strong>${h}</strong><span>${p}</span></div>`).join('\n')}
</div></section>
<section class="features"><div class="wrap">
  <h2 class="section-title">${t.featuresTitle}</h2>
${t.features.map((f) => `  <div class="feature">
    <div class="feature-text">${f.badge ? `<span class="badge">${f.badge}</span>` : ''}<h3>${f.h}</h3><p>${f.p}</p></div>
    <div class="feature-media">${phone(f)}</div>
  </div>`).join('\n')}
</div></section>
<section class="more"><div class="wrap">
  <h2 class="section-title">${t.moreTitle}</h2>
  <div class="more-grid">
${t.more.map(([h, p]) => `    <div><strong>${h}</strong><span>${p}</span></div>`).join('\n')}
  </div>
</div></section>
<section class="cta"><div class="wrap">
  <h2>${t.ctaTitle}</h2>
  <p>${t.ctaText}</p>
  ${playButton(lang, t.play)}
  <p class="note">${t.note}</p>
</div></section>
${hasVideo ? VIDEO_SCRIPT : ''}`;
}

// Die Texte in docs/*.md: oben Deutsch, nach "---" Englisch.
function split(file) {
  const [de, en] = fs.readFileSync(path.join(DOCS, file), 'utf8').replace(/\r/g, '').split(/\n---\n/);
  return { de: md(de), en: md(en) };
}

const css = `:root{--bg:#F7F7F7;--surface:#fff;--text:#111B21;--muted:#667781;--accent:#25D366;--accent-dark:#128C7E;--chip:#E7FCE3;--border:#E9EDEF;--hl:#128C7E;--badge:#0B6B5F;--bezel:#111B21;--phone-shadow:0 18px 40px rgba(17,27,33,.18),0 2px 6px rgba(17,27,33,.12)}
@media (prefers-color-scheme:dark){:root{--bg:#0B141A;--surface:#111B21;--text:#E9EDEF;--muted:#8696A0;--chip:#103529;--border:#22313A;--hl:#25D366;--badge:#25D366;--bezel:#2A3942;--phone-shadow:0 18px 40px rgba(0,0,0,.5)}}
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
.play{display:inline-flex;align-items:center;gap:8px;background:var(--accent-dark);color:#fff;border-radius:999px;padding:12px 24px;min-height:48px;font-weight:700;font-size:18px;text-decoration:none;margin-top:8px}
.play:hover{background:#0F7A6E}
.play:focus-visible,.lang:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.note{color:var(--muted);font-size:15px;margin:10px 0 0}
main.home{max-width:none;padding:0}
.wrap{max-width:1120px;margin:0 auto;padding:0 16px}
.hl{color:var(--hl);white-space:nowrap}
.hero{padding:28px 0 44px;overflow:hidden}
.hero-grid{display:grid;gap:36px;align-items:center}
.kicker{color:var(--hl);font-weight:700;font-size:19px;margin:0 0 6px}
.hero h1{font-size:clamp(38px,6.2vw,64px);line-height:1.08;letter-spacing:-.02em;margin:0 0 16px}
.lead{font-size:19px;color:var(--muted);margin:0 0 20px;max-width:34em}
.hero-phones{display:flex;align-items:flex-start;justify-content:center;gap:clamp(14px,3vw,28px);padding-bottom:8px}
.hero-phones .phone{flex:0 1 250px}
.hero-phones .front{order:1}
.hero-phones .back{order:2;margin-top:clamp(36px,6vw,64px)}
.phone{margin:0;padding:clamp(5px,1.2vw,8px);border-radius:clamp(22px,4vw,34px);background:var(--bezel);box-shadow:var(--phone-shadow)}
.phone img,.phone video{display:block;width:100%;height:auto;border-radius:clamp(17px,3.2vw,27px);background:var(--surface)}
.band{background:var(--chip);padding:32px 0}
.band-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px 16px}
.band-item{display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px}
.band-item strong{font-size:17px;line-height:1.3}
.band-item span:last-child{color:var(--muted);font-size:15px;line-height:1.45}
.band-icon{display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;border-radius:50%;background:var(--surface);color:var(--hl);margin-bottom:6px}
.section-title{font-size:clamp(28px,4vw,40px);line-height:1.15;text-align:center;margin:0 0 8px}
.features{padding:56px 0 24px}
.feature{display:grid;gap:24px;align-items:center;padding:40px 0}
.feature+.feature{border-top:1px solid var(--border)}
.feature-text h3{font-size:clamp(24px,3vw,32px);line-height:1.2;margin:8px 0 10px}
.feature-text p{font-size:18px;color:var(--muted);margin:0;max-width:30em}
.feature-media .phone{width:62%;max-width:270px;margin:0 auto}
.badge{display:inline-block;background:var(--chip);color:var(--badge);font-size:13px;font-weight:700;letter-spacing:.04em;border-radius:999px;padding:3px 12px}
.more{padding:24px 0 64px}
.more-grid{display:grid;gap:12px;margin-top:24px}
.more-grid div{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:4px}
.more-grid span{color:var(--muted);font-size:15px}
.cta{background:var(--surface);border-top:1px solid var(--border);padding:56px 0 64px;text-align:center}
.cta h2{font-size:clamp(30px,5vw,48px);line-height:1.12;letter-spacing:-.01em;margin:0 0 12px}
.cta p{color:var(--muted);font-size:18px;margin:0 auto 16px;max-width:32em}
.cta .note{margin-top:10px;font-size:15px}
@media (min-width:640px){.more-grid{grid-template-columns:repeat(3,1fr)}}
@media (min-width:860px){
.hero{padding:64px 0 80px}
.hero-grid{grid-template-columns:1.05fr 1fr;gap:48px}
.band-grid{grid-template-columns:repeat(4,1fr)}
.feature{grid-template-columns:1fr 1fr;gap:64px;padding:56px 0}
.feature:nth-of-type(even) .feature-text{order:2}
.feature-media .phone{width:100%}
}
footer{text-align:center;color:var(--muted);font-size:14px;padding:24px 16px 40px;border-top:1px solid var(--border)}
footer .small{margin-top:6px}
footer .social{margin-top:8px}
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
    body: home(lang),
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
