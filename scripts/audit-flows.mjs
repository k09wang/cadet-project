// ArtBridge 인터랙션 플로우 감사 (Part B: 신청 → 수락 → 계약/결제 실제 수행)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:3000';
const OUT = path.resolve('.audit');
const SHOT = path.join(OUT, 'screenshots');

const txt = async (page) => (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim())).slice(0, 500);

async function loginAs(page, role) {
  await page.goto(`${BASE}/login`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle').catch(() => {});
  const label = role === 'creator' ? '크리에이터로 시작하기' : '팬으로 시작하기';
  await Promise.all([
    page.waitForURL((u) => !u.toString().includes('/login'), { timeout: 15000 }).catch(() => {}),
    page.getByRole('button', { name: label }).first().click(),
  ]);
  await page.waitForLoadState('networkidle').catch(() => {});
}

const snap = async (page, name) => {
  const f = path.join(SHOT, `flow-${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  return `screenshots/flow-${name}.png`;
};

async function run() {
  const browser = await chromium.launch({ channel: 'chrome' });
  const result = { startedAt: new Date().toISOString(), flows: [] };
  try {
    // ===== FAN: 프로그램 참여 신청 =====
    const fanCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const fan = await fanCtx.newPage();
    const fanErr = [];
    fan.on('console', (m) => { if (m.type() === 'error') fanErr.push(m.text().slice(0, 200)); });
    await loginAs(fan, 'fan');
    await fan.goto(`${BASE}/programs`, { waitUntil: 'load' });
    await fan.waitForLoadState('networkidle').catch(() => {});
    // 모집 중인 프로그램 우선 탐색
    const progLinks = await fan.locator('a[href^="/programs/"]').evaluateAll((as) =>
      [...new Set(as.map((a) => a.getAttribute('href')))]).catch(() => []);
    const flow1 = { name: 'fan-apply', candidates: progLinks, steps: [] };
    let applied = false;
    for (const p of progLinks.filter((h) => !h.includes('demo2-program-1'))) {
      await fan.goto(`${BASE}${p}`, { waitUntil: 'load' });
      await fan.waitForLoadState('networkidle').catch(() => {});
      const btn = fan.getByRole('button', { name: /참여 신청|신청하기/ }).first();
      const vis = await btn.isVisible().catch(() => false);
      if (!vis) { flow1.steps.push({ program: p, applyVisible: false }); continue; }
      await btn.click();
      await fan.waitForLoadState('networkidle').catch(() => {});
      await fan.waitForTimeout(1200);
      const body = await txt(fan);
      const hasErr = /(이미 신청|중복|오류|에러|Error)/.test(body);
      flow1.steps.push({ program: p, applyVisible: true, afterUrl: fan.url().replace(BASE, ''), text: body.slice(0, 250), possibleError: hasErr });
      flow1.shot = await snap(fan, 'fan-apply-after');
      applied = !hasErr;
      break;
    }
    flow1.applied = applied;
    flow1.consoleErrors = fanErr.slice();
    result.flows.push(flow1);

    // 알림 확인
    await fan.goto(`${BASE}/notifications`, { waitUntil: 'load' });
    await fan.waitForLoadState('networkidle').catch(() => {});
    result.flows.push({ name: 'fan-notif-after-apply', text: (await txt(fan)).slice(0, 400), shot: await snap(fan, 'fan-notif-after') });

    // ===== CREATOR: 신청 수락 =====
    const crCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const cr = await crCtx.newPage();
    await loginAs(cr, 'creator');
    await cr.goto(`${BASE}/dashboard/creator/programs`, { waitUntil: 'load' });
    await cr.waitForLoadState('networkidle').catch(() => {});
    const appsLinks = await cr.locator('a[href*="/applications"]').evaluateAll((as) => as.map((a) => a.getAttribute('href'))).catch(() => []);
    const flow2 = { name: 'creator-accept', appsLinks, steps: [] };
    let accepted = false;
    for (const a of appsLinks) {
      await cr.goto(`${BASE}${a}`, { waitUntil: 'load' });
      await cr.waitForLoadState('networkidle').catch(() => {});
      const acceptBtn = cr.getByRole('button', { name: /^수락$/ }).first();
      const vis = await acceptBtn.isVisible().catch(() => false);
      if (!vis) { flow2.steps.push({ appsPage: a, acceptVisible: false, text: (await txt(cr)).slice(0, 200) }); continue; }
      await acceptBtn.click();
      await cr.waitForLoadState('networkidle').catch(() => {});
      await cr.waitForTimeout(1200);
      const after = await txt(cr);
      flow2.steps.push({ appsPage: a, acceptVisible: true, afterText: after.slice(0, 300), shot: await snap(cr, 'creator-accept-after') });
      accepted = true;
      break;
    }
    flow2.accepted = accepted;
    result.flows.push(flow2);
    await crCtx.close();
    await fanCtx.close();
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'flows-report.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
