// ArtBridge 화면 감사 스크립트 (Part A: 전체 화면 캡처 + 에러/네비게이션 수집)
// 실행: node scripts/audit-screens.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = path.resolve('.audit');
const SHOT = path.join(OUT, 'screenshots');
fs.mkdirSync(SHOT, { recursive: true });

const report = { base: BASE, startedAt: new Date().toISOString(), sessions: [] };

const slugify = (s) => String(s).replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 80);

function mkSession() {
  const errors = [];
  return {
    errors,
    onConsole: (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text().slice(0, 300)}`); },
    onPageError: (e) => errors.push(`[pageerror] ${String(e.message || e).slice(0, 300)}`),
    onReqFailed: (r) => {
      const u = r.url();
      if (u.includes('favicon') || u.includes('_next/webpack') || u.includes('chrome-extension')) return;
      errors.push(`[reqfail] ${u.replace(BASE,'')} :: ${r.failure()?.errorText || ''}`);
    },
  };
}

async function newSession(browser, name) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const s = mkSession();
  s.name = name; s.ctx = ctx; s.page = page; s.entries = [];
  page.on('console', s.onConsole);
  page.on('pageerror', s.onPageError);
  page.on('requestfailed', s.onReqFailed);
  return s;
}

async function visit(s, label, url, { wait = 15000 } = {}) {
  const before = s.errors.length;
  const e = { label, requestedUrl: url.replace(BASE, '') };
  try {
    const resp = await s.page.goto(url, { waitUntil: 'load', timeout: wait });
    await s.page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await s.page.waitForTimeout(500);
    e.status = resp?.status();
    e.finalUrl = s.page.url().replace(BASE, '');
    e.meta = await s.page.evaluate(() => {
      const pick = (el) => (el?.innerText || '').trim();
      const links = [...document.querySelectorAll('a[href]')]
        .map((a) => ({ h: a.getAttribute('href'), t: pick(a).slice(0, 40) }))
        .filter((x) => x.h && x.h.startsWith('/') && x.t);
      const btns = [...document.querySelectorAll('button')].map((b) => pick(b)).filter(Boolean);
      const text = document.body.innerText.replace(/\s+/g, ' ').trim();
      const hints = [...text.matchAll(/(에러|오류|Error:|Exception|찾을 수 없|존재하지 않|404|500|Unauthorized|Forbidden|cannot read|is not defined|is not a function|NaN)/gi)].map((m) => m[0]);
      return {
        title: document.title,
        h1: pick(document.querySelector('h1')),
        links: [...new Map(links.map((l) => [l.h, l])).values()].slice(0, 50),
        btns: [...new Set(btns)].slice(0, 40),
        textPreview: text.slice(0, 500),
        errorHints: [...new Set(hints)].slice(0, 12),
      };
    });
    const file = `${slugify(s.name)}-${slugify(label)}.png`;
    await s.page.screenshot({ path: path.join(SHOT, file), fullPage: true });
    e.shot = `screenshots/${file}`;
  } catch (err) {
    e.error = String(err.message || err).split('\n')[0].slice(0, 200);
  }
  e.errors = s.errors.slice(before);
  s.entries.push(e);
  return e;
}

async function loginAs(s, role) {
  const page = s.page;
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle').catch(() => {});
  const label = role === 'creator' ? '크리에이터로 시작하기' : '팬으로 시작하기';
  const btn = page.getByRole('button', { name: label }).first();
  await Promise.all([
    page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => {}),
    btn.click(),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(700);
  return page.url();
}

const firstLink = (meta, regex) => meta?.links?.find((x) => regex.test(x.h))?.h || null;

async function run() {
  const browser = await chromium.launch({ channel: 'chrome' });
  report.browser = 'chrome';
  try {
    // ===== Anonymous =====
    const anon = await newSession(browser, 'anon');
    await visit(anon, 'home', `${BASE}/`);
    await visit(anon, 'login', `${BASE}/login`);
    await visit(anon, 'signup', `${BASE}/signup`);
    await visit(anon, 'creators-anon', `${BASE}/creators`);
    await visit(anon, 'programs-anon', `${BASE}/programs`);
    report.sessions.push({ name: anon.name, entries: anon.entries });
    await anon.ctx.close();

    // ===== Fan =====
    const fan = await newSession(browser, 'fan');
    await loginAs(fan, 'fan');
    await visit(fan, 'fan-home', `${BASE}/dashboard/fan`);
    const cr = await visit(fan, 'creators', `${BASE}/creators`);
    const creatorHref = firstLink(cr.meta, /^\/creators\/[^/]+$/);
    let creatorDetail = null;
    if (creatorHref) creatorDetail = await visit(fan, 'creator-detail', `${BASE}${creatorHref}`);
    await visit(fan, 'programs', `${BASE}/programs`);
    const progHref = firstLink(fan.entries.at(-1).meta, /^\/programs\/[^/]+$/);
    if (progHref) await visit(fan, 'program-detail', `${BASE}${progHref}`);
    await visit(fan, 'program-completed', `${BASE}/programs/demo-program-completed`);
    if (creatorDetail?.meta?.links) {
      const postHref = creatorDetail.meta.links.find((l) => /^\/posts\/[^/]+$/.test(l.h))?.h;
      if (postHref) await visit(fan, 'post-detail', `${BASE}${postHref}`);
    }
    await visit(fan, 'fan-bookmarks', `${BASE}/dashboard/fan/bookmarks`);
    await visit(fan, 'fan-memberships', `${BASE}/dashboard/fan/memberships`);
    await visit(fan, 'fan-payments', `${BASE}/dashboard/fan/payments`);
    await visit(fan, 'notifications', `${BASE}/notifications`);
    await visit(fan, 'fan-guard-creator', `${BASE}/dashboard/creator`);
    report.sessions.push({ name: fan.name, entries: fan.entries });
    await fan.ctx.close();

    // ===== Creator =====
    const c = await newSession(browser, 'creator');
    await loginAs(c, 'creator');
    await visit(c, 'creator-home', `${BASE}/dashboard/creator`);
    await visit(c, 'creator-edit', `${BASE}/dashboard/creator/edit`);
    const progs = await visit(c, 'creator-programs', `${BASE}/dashboard/creator/programs`);
    await visit(c, 'creator-programs-new', `${BASE}/dashboard/creator/programs/new`);
    const ownProgRaw = progs.meta?.links?.find((l) => /\/dashboard\/creator\/programs\/[^/]+\/(applications|edit)$/.test(l.h))?.h;
    const ownProg = ownProgRaw ? ownProgRaw.replace(/\/(applications|edit)$/, '') : null;
    if (ownProg) {
      await visit(c, 'creator-program-detail', `${BASE}${ownProg}`);
      await visit(c, 'creator-program-edit', `${BASE}${ownProg}/edit`);
      await visit(c, 'creator-program-applications', `${BASE}${ownProg}/applications`);
      await visit(c, 'creator-program-participants', `${BASE}${ownProg}/participants`);
    }
    await visit(c, 'creator-memberships-new', `${BASE}/dashboard/creator/memberships/new`);
    await visit(c, 'creator-posts-new', `${BASE}/dashboard/creator/posts/new`);
    await visit(c, 'creator-members', `${BASE}/dashboard/creator/members`);
    await visit(c, 'creator-guard-fan', `${BASE}/dashboard/fan`);
    report.sessions.push({ name: c.name, entries: c.entries });
    await c.ctx.close();
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'audit-report.json'), JSON.stringify(report, null, 2));

  // 요약 출력
  let totalErr = 0, totalFail = 0;
  for (const s of report.sessions) {
    console.log(`\n## ${s.name}: ${s.entries.length} screens`);
    for (const e of s.entries) {
      const flag = e.error ? 'XX' : (e.errors.length ? '!!' : 'ok');
      if (e.error) totalFail++;
      if (e.errors.length) totalErr += e.errors.length;
      console.log(`  [${flag}] ${e.label.padEnd(28)} ${(e.status || '').toString().padEnd(4)} ${(e.finalUrl || '').padEnd(40)} ${e.error ? '-> ' + e.error : ''} ${e.errors.length ? `(${e.errors.length} errs)` : ''}`);
    }
  }
  console.log(`\nTotal: ${totalFail} page failures, ${totalErr} console/runtime errors`);
  console.log(`Report: ${path.join(OUT, 'audit-report.json')}`);
  console.log(`Screenshots: ${SHOT}`);
}

run().catch((e) => { console.error('FATAL', e); process.exit(1); });
