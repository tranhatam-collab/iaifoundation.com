import { execFileSync } from 'node:child_process';

const targetUrl = process.argv[2] || 'http://127.0.0.1:4173/vi/';

const stateScript = [
  'JSON.stringify((() => {',
  'const toggle = document.querySelector(".menu-toggle");',
  'const menu = document.getElementById("mobile-menu");',
  'const nav = document.querySelector(".desktop-nav");',
  'const header = document.querySelector(".site-header");',
  'const lang = document.querySelector(".lang-switch");',
  'const rect = menu.getBoundingClientRect();',
  'return {',
  'width: window.innerWidth,',
  'toggleDisplay: getComputedStyle(toggle).display,',
  'navDisplay: getComputedStyle(nav).display,',
  'menuHidden: menu.hidden,',
  'menuExpanded: toggle.getAttribute("aria-expanded"),',
  'bodyMenuOpen: document.body.classList.contains("menu-open"),',
  'headerMenuOpen: header.classList.contains("is-menu-open"),',
  'langVisible: getComputedStyle(lang).display !== "none",',
  'menuRect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width },',
  'viewport: { width: window.innerWidth, height: window.innerHeight },',
  'hash: window.location.hash',
  '};',
  '})())',
].join(' ');

const actions = {
  clickToggle: 'document.querySelector(".menu-toggle").click(); "ok";',
  clickFirstMenuLink: 'document.querySelector("#mobile-menu a").click(); "ok";',
};

const viewports = {
  desktop: [20, 40, 1460, 1020],
  tablet: [20, 40, 854, 1180],
  mobile: [20, 40, 410, 920],
};

try {
  await run();
} catch (error) {
  const detail = String(error?.stderr || error?.message || error);
  if (detail.includes('Allow JavaScript from Apple Events')) {
    console.error('Safari browser QA requires "Allow JavaScript from Apple Events" in Safari > Settings > Advanced > Show Develop menu, then Develop > Allow JavaScript from Apple Events.');
    process.exit(1);
  }
  throw error;
}

async function run() {
  const results = [];

  await openAt(viewports.desktop);
  results.push({ step: 'desktop-closed', state: readState() });

  await openAt(viewports.tablet);
  results.push({ step: 'tablet-closed', state: readState() });

  runJs(actions.clickToggle);
  await wait(600);
  results.push({ step: 'tablet-open', state: readState() });

  runJs(actions.clickFirstMenuLink);
  await wait(600);
  results.push({ step: 'tablet-after-link-click', state: readState() });

  await openAt(viewports.mobile);
  runJs(actions.clickToggle);
  await wait(600);
  results.push({ step: 'mobile-open', state: readState() });

  setWindowBounds(viewports.desktop);
  await wait(800);
  results.push({ step: 'mobile-after-resize-to-desktop', state: readState() });

  process.stdout.write(`${JSON.stringify({ targetUrl, results }, null, 2)}\n`);
}

function runAppleScript(lines) {
  const args = lines.flatMap((line) => ['-e', line]);
  return execFileSync('osascript', args, { encoding: 'utf8' }).trim();
}

async function openAt(bounds) {
  runAppleScript([
    'tell application "Safari"',
    'activate',
    'if (count of windows) = 0 then make new document',
    `set URL of front document to "${targetUrl}"`,
    `set bounds of front window to {${bounds.join(', ')}}`,
    'end tell',
  ]);
  await wait(1800);
}

function setWindowBounds(bounds) {
  runAppleScript([
    'tell application "Safari"',
    `set bounds of front window to {${bounds.join(', ')}}`,
    'end tell',
  ]);
}

function runJs(script) {
  const escaped = escapeAppleScriptString(script);
  return runAppleScript([
    'tell application "Safari"',
    `do JavaScript "${escaped}" in front document`,
    'end tell',
  ]);
}

function readState() {
  const raw = runJs(stateScript);
  return JSON.parse(raw);
}

function escapeAppleScriptString(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
