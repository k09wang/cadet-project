# ArtBridge 화면 생성 — GLM 5.2 투입용 프롬프트 패키지

> 작성일: 2026-06-24 · 정본 fileKey `kRXui45SIlfWK80VhLJnt9` · Screens 페이지 `80:793`
> 대상 화면: 04~07(공통 미완) · 15~39(팬/크리에이터/거래/작품커머스)
> 이미 완료: 01~14 (건드리지 말 것)

---

## 0. 사용법 (중요)

- **GLM 세션 1개 = 화면 1개.** 절대 여러 화면을 한 세션에 시키지 말 것(섞임).
- 각 GLM 프롬프트 = **[A. 절대규칙] + [B. 공통 PREAMBLE 코드] + [C. 해당 화면 블록]** 을 이어 붙여 투입.
- 실행 순서를 GLM에 강제: ① `figma-use` 스킬 로드 → ② `use_figma`로 (PREAMBLE+화면코드) 실행 → ③ `get_screenshot`(node=반환된 screenId)으로 확인 → ④ 클리핑/여백/겹침 있으면 수정 후 재실행 → ⑤ 한국어로 결과 보고.
- 화면들은 **x좌표가 미리 배정**되어 충돌하지 않음(아래 표). 병렬로 동시에 돌려도 안전.

---

## A. 절대규칙 (모든 프롬프트 맨 앞에 복붙)

```
[절대 규칙 — 어기면 실패]
1. use_figma 호출 전 figma-use 스킬을 먼저 로드한다(skillNames:"figma-use").
2. 페이지 전환은 await figma.setCurrentPageAsync(page) 한 번만. (figma.currentPage = ... 금지)
3. 제공된 JS(PREAMBLE+화면코드)를 "그대로" use_figma의 code로 실행한다. 임의로 값을 바꾸지 마라.
4. layoutSizingHorizontal='FILL'/'HUG'는 appendChild 다음 줄에서만 설정한다.
5. auto-layout 프레임에 resize(w,h) 후에는 세로가 FIXED로 굳으니, 세로는 primaryAxisSizingMode='AUTO'로 둔다.(PREAMBLE이 이미 처리)
6. 텍스트/인스턴스 추가 전 Noto Sans KR(Bold/Medium/Regular)를 로드한다.(PREAMBLE이 이미 처리)
7. 새 텍스트·프레임을 raw로 만들지 말고, 화면은 컴포넌트 인스턴스로 조립한다. (예외: 섹션 래퍼 프레임·섹션 제목 텍스트·점선 placeholder만 허용)
8. 색/폰트는 ArtBridge Tokens 변수에 바인딩한다.(PREAMBLE의 bound() 사용)
9. 스크립트가 에러나면 즉시 재시도 말고 에러 메시지를 읽고 원인만 고쳐 다시 실행한다. 끝나면 생성/변경 노드 ID를 전부 return 한다.
```

---

## B. 공통 PREAMBLE 코드 (모든 화면 코드 "앞"에 그대로 붙임)

> 이 블록은 페이지 전환·폰트 로드·토큰 바인딩·셸 조립·그리드/리스트/2단 헬퍼를 모두 정의한다. 화면 코드는 이 헬퍼만 호출한다.

```js
// ===== ArtBridge 공통 PREAMBLE (수정 금지) =====
const page = figma.root.children.find(p => p.id === '80:793'); // 🖼 Screens
await figma.setCurrentPageAsync(page);
const FAM = 'Noto Sans KR';
for (const st of ['Bold','Medium','Regular']) await figma.loadFontAsync({family:FAM, style:st});

const V = async (idNum) => figma.variables.getVariableByIdAsync('VariableID:'+idNum);
// 토큰: brand=1:13, brand-strong=1:14, surface=1:15, surface-subtle=1:16,
//       text=1:17, text-muted=1:18, border=1:19, success=1:20, warning=1:21,
//       danger=1:22, info=1:23, membership=1:24, program=1:25, community=1:26,
//       radius sm=1:27 / md=1:28 / lg=1:29
const bound = async (idNum) => figma.variables.setBoundVariableForPaint(
  {type:'SOLID', color:{r:0,g:0,b:0}}, 'color', await V(idNum));

// 컴포넌트/변형 ID로 인스턴스 생성 (COMPONENT·COMPONENT_SET·INSTANCE 모두 대응)
async function instance(id){
  const n = await figma.getNodeByIdAsync(id);
  if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') return n.createInstance();
  return (await n.getMainComponentAsync()).createInstance();
}

// 셸 조립: 헤더(Role) + Main(연회색,중앙) + Content(폭 W, 세로 HUG, 중앙정렬) + Footer
// headerId: Guest='84:792' / Fan='83:792' / Creator='82:792'
async function buildShell({name, x, headerId, contentWidth}){
  const F = figma.createFrame();
  F.name = name; F.x = x; F.y = 0;
  F.layoutMode='VERTICAL'; F.counterAxisSizingMode='FIXED'; F.primaryAxisSizingMode='AUTO';
  F.resize(1440, 100); F.fills=[{type:'SOLID', color:{r:1,g:1,b:1}}];
  page.appendChild(F);
  const header = await instance(headerId);
  F.appendChild(header); header.layoutSizingHorizontal='FILL';
  const main = figma.createAutoLayout('VERTICAL');
  main.name='Main'; main.counterAxisAlignItems='CENTER';
  main.paddingTop=56; main.paddingBottom=72;
  main.fills=[{type:'SOLID', color:{r:0.969,g:0.973,b:0.980}}]; // 쿨그레이 (카드가 떠 보이게)
  F.appendChild(main); main.layoutSizingHorizontal='FILL'; main.primaryAxisSizingMode='AUTO';
  const content = figma.createAutoLayout('VERTICAL');
  content.name='Content'; content.itemSpacing=32; content.fills=[];
  content.counterAxisAlignItems='CENTER'; // 자연폭 컴포넌트는 가운데, FILL은 꽉 채움
  main.appendChild(content);
  content.layoutSizingHorizontal='FIXED'; content.resize(contentWidth||1200, 200);
  content.primaryAxisSizingMode='AUTO'; // 세로 HUG (클리핑 방지)
  const footer = await instance('56:744');
  F.appendChild(footer); footer.layoutSizingHorizontal='FILL';
  return { F, header, main, content, footer };
}

// 제목 블록
async function titleBlock(parent, title, sub){
  const h=figma.createAutoLayout('VERTICAL'); h.name='Header'; h.itemSpacing=6; h.fills=[];
  parent.appendChild(h); h.layoutSizingHorizontal='FILL';
  const t=figma.createText(); t.fontName={family:FAM,style:'Bold'}; t.fontSize=28; t.letterSpacing={unit:'PERCENT',value:-1}; t.characters=title; t.fills=[await bound('1:17')];
  h.appendChild(t); t.layoutSizingHorizontal='FILL'; t.textAutoResize='HEIGHT';
  if (sub){ const s=figma.createText(); s.fontName={family:FAM,style:'Regular'}; s.fontSize=14; s.characters=sub; s.fills=[await bound('1:18')];
    h.appendChild(s); s.layoutSizingHorizontal='FILL'; s.textAutoResize='HEIGHT'; }
  return h;
}
// 섹션 소제목
async function sectionTitle(parent, text){
  const t=figma.createText(); t.fontName={family:FAM,style:'Bold'}; t.fontSize=18; t.characters=text; t.fills=[await bound('1:17')];
  parent.appendChild(t); t.layoutSizingHorizontal='FILL'; t.textAutoResize='HEIGHT'; return t;
}
// 카드 그리드: 같은 컴포넌트 N개를 perRow열로 (각 카드 FILL)
async function cardGrid(parent, cardId, count, perRow, gap){
  let row;
  for (let i=0;i<count;i++){
    if (i % perRow === 0){
      row=figma.createAutoLayout('HORIZONTAL'); row.name='Row'; row.itemSpacing=gap||20; row.fills=[];
      parent.appendChild(row); row.layoutSizingHorizontal='FILL';
      row.primaryAxisSizingMode='FIXED'; row.counterAxisSizingMode='AUTO';
    }
    const c = await instance(cardId); row.appendChild(c); c.layoutSizingHorizontal='FILL';
  }
}
// 세로 리스트: 컴포넌트 ID 배열을 위→아래로 (각 FILL)
async function listCol(parent, ids, gap){
  const col=figma.createAutoLayout('VERTICAL'); col.name='List'; col.itemSpacing=gap||16; col.fills=[];
  parent.appendChild(col); col.layoutSizingHorizontal='FILL';
  for (const id of ids){ const n=await instance(id); col.appendChild(n); n.layoutSizingHorizontal='FILL'; }
  return col;
}
// 2단 레이아웃: 반환된 {row,left,right} 의 left/right에 자식 추가. ratio=[좌비율,우고정폭]
function twoCol(parent, rightWidth, gap){
  const row=figma.createAutoLayout('HORIZONTAL'); row.name='Cols'; row.itemSpacing=gap||24; row.fills=[]; row.counterAxisAlignItems='MIN';
  parent.appendChild(row); row.layoutSizingHorizontal='FILL'; row.primaryAxisSizingMode='FIXED'; row.counterAxisSizingMode='AUTO';
  const left=figma.createAutoLayout('VERTICAL'); left.name='Left'; left.itemSpacing=16; left.fills=[];
  row.appendChild(left); left.layoutSizingHorizontal='FILL';
  const right=figma.createAutoLayout('VERTICAL'); right.name='Right'; right.itemSpacing=16; right.fills=[];
  row.appendChild(right); right.layoutSizingHorizontal='FIXED'; right.resize(rightWidth||380, 100); right.primaryAxisSizingMode='AUTO';
  return { row, left, right };
}
// 가로 탭바 (활성 탭 2px 브랜드 언더라인). labels=['개요','신청자',...], activeIdx
async function tabBar(parent, labels, activeIdx){
  const bar=figma.createAutoLayout('HORIZONTAL'); bar.name='TabBar'; bar.itemSpacing=24; bar.fills=[];
  bar.strokes=[await bound('1:19')]; bar.strokeBottomWeight=1; bar.strokeTopWeight=0; bar.strokeLeftWeight=0; bar.strokeRightWeight=0;
  parent.appendChild(bar); bar.layoutSizingHorizontal='FILL';
  for (let i=0;i<labels.length;i++){
    const tab=figma.createAutoLayout('VERTICAL'); tab.name='Tab'; tab.fills=[]; tab.paddingBottom=10; tab.paddingTop=4;
    bar.appendChild(tab);
    if (i===activeIdx){ tab.strokes=[await bound('1:13')]; tab.strokeBottomWeight=2; tab.strokeTopWeight=0; tab.strokeLeftWeight=0; tab.strokeRightWeight=0; }
    const t=figma.createText(); t.fontName={family:FAM,style: i===activeIdx?'Bold':'Medium'}; t.fontSize=15;
    t.characters=labels[i]; t.fills=[await bound(i===activeIdx?'1:17':'1:18')]; tab.appendChild(t); t.textAutoResize='WIDTH_AND_HEIGHT';
  }
  return bar;
}
// 단순 정보 Card (라벨/값 행들). rows=[['라벨','값'],...]
async function infoCard(parent, title, rows){
  const c=figma.createAutoLayout('VERTICAL'); c.name='InfoCard'; c.itemSpacing=12;
  c.paddingLeft=20; c.paddingRight=20; c.paddingTop=20; c.paddingBottom=20;
  for (const k of ['topLeftRadius','topRightRadius','bottomLeftRadius','bottomRightRadius']) c.setBoundVariable(k, await V('1:28'));
  c.fills=[await bound('1:15')]; c.strokes=[await bound('1:19')]; c.strokeWeight=1;
  parent.appendChild(c); c.layoutSizingHorizontal='FILL';
  if (title){ const h=figma.createText(); h.fontName={family:FAM,style:'Bold'}; h.fontSize=16; h.characters=title; h.fills=[await bound('1:17')]; c.appendChild(h); h.layoutSizingHorizontal='FILL'; h.textAutoResize='HEIGHT'; }
  for (const [k,v] of rows){
    const r=figma.createAutoLayout('HORIZONTAL'); r.name='Row'; r.fills=[]; r.primaryAxisAlignItems='SPACE_BETWEEN'; r.itemSpacing=16;
    c.appendChild(r); r.layoutSizingHorizontal='FILL';
    const lt=figma.createText(); lt.fontName={family:FAM,style:'Medium'}; lt.fontSize=14; lt.characters=k; lt.fills=[await bound('1:18')]; r.appendChild(lt); lt.textAutoResize='WIDTH_AND_HEIGHT';
    const vt=figma.createText(); vt.fontName={family:FAM,style:'Bold'}; vt.fontSize=14; vt.characters=v; vt.fills=[await bound('1:17')]; vt.textAlignHorizontal='RIGHT'; r.appendChild(vt); vt.textAutoResize='HEIGHT'; vt.layoutSizingHorizontal='FILL'; }
  return c;
}
```

---

## C. 화면별 코드 블록 (PREAMBLE 뒤에 붙여 1세션씩 실행)

각 블록 끝에 `return {...}` 으로 screenId를 돌려준다 → GLM이 그 id로 get_screenshot.

### x좌표·헤더·폭 배정표

| # | 화면 | x | 헤더 | content폭 |
|---|---|---|---|---|
| 04 | 이용약관 | 21360 | Guest 84:792 | 760 |
| 05 | 개인정보처리방침 | 22860 | Guest | 760 |
| 06 | 고객지원/FAQ | 24360 | Guest | 760 |
| 07 | 404·에러 | 25860 | Guest | 760 |
| 15 | 관심 작가 | 27360 | Fan 83:792 | 1200 |
| 16 | 내 멤버십 | 28860 | Fan | 1200 |
| 17 | 내 신청·결제 | 30360 | Fan | 900 |
| 18 | 프로필/설정 | 31860 | Fan | 480 |
| 19 | 크리에이터 대시보드 | 33360 | Creator 82:792 | 1200 |
| 20 | 스튜디오 편집 | 34860 | Creator | 560 |
| 21 | 멤버십(플랜·멤버 탭) | 36360 | Creator | 1200 |
| 22 | 멤버십 생성/수정 폼 | 37860 | Creator | 600 |
| 23 | 포스트 작성 | 39360 | Creator | 600 |
| 24 | 프로그램 관리 | 40860 | Creator | 1200 |
| 25 | 프로그램 생성/수정 폼 | 42360 | Creator | 600 |
| 26 | 프로그램 운영(탭) | 43860 | Creator | 800 |
| 27 | 정산 현황 | 45360 | Creator | 1200 |
| 28 | 알림 센터 | 46860 | Fan | 760 |
| 29 | 계약서/약관 동의 | 48360 | Fan | 620 |
| 30 | 작품 관리 | 49860 | Creator | 1200 |
| 31 | 작품 주문 관리 | 51360 | Creator | 760 |
| 32 | 팬 작품 주문 목록 | 52860 | Fan | 760 |
| 33 | 작품 주문 상세 | 54360 | Fan | 760 |
| 34 | 작품 구매 결제 | 55860 | Fan | 1100 |
| 35 | 프로그램 신청 결제 | 57360 | Fan | 1100 |
| 36 | 멤버십 가입 결제 | 58860 | Fan | 1100 |
| 37 | 결제 영수증 | 60360 | Fan | 640 |
| 38 | 정산 지급 설정 | 61860 | Creator | 1100 |
| 39 | 멤버 관리 | 63360 | Creator | 800 |

---

### 화면 15 — 관심 작가 (예시 템플릿 ①: 그리드형)

```js
const { content } = await buildShell({ name:'15 관심 작가', x:27360, headerId:'83:792', contentWidth:1200 });
await titleBlock(content, '관심 작가', '북마크한 크리에이터를 모아봤어요');
await cardGrid(content, '2:69', 6, 3);            // CreatorCard ×6, 3열
const empty = await instance('5:383'); content.appendChild(empty); // EmptyState 예시
return { screenId: content.parent.parent.id };
```
완료조건: ①Fan 헤더 ②작가카드 6개 3열 ③여백/클리핑 없음 ④Footer ⑤스크린샷

### 화면 16 — 내 멤버십
```js
const { content } = await buildShell({ name:'16 내 멤버십', x:28860, headerId:'83:792', contentWidth:1200 });
await titleBlock(content, '내 멤버십', '구독 중인 멤버십 플랜');
await cardGrid(content, '2:93', 3, 3);            // MembershipPlanCard ×3
const empty = await instance('5:383'); content.appendChild(empty);
return { screenId: content.parent.parent.id };
```

### 화면 17 — 내 신청·결제
```js
const { content } = await buildShell({ name:'17 내 신청·결제', x:30360, headerId:'83:792', contentWidth:900 });
await titleBlock(content, '내 신청·결제', '결제 내역과 정산 상태');
await cardGrid(content, '10:474', 3, 3);          // Stat Card ×3 (요약 지표)
await sectionTitle(content, '결제 내역');
await listCol(content, ['27:814','27:844']);      // MyApplicationItem Paid/Completed
return { screenId: content.parent.parent.id };
```

### 화면 18 — 프로필/설정 (폼형)
```js
const { content } = await buildShell({ name:'18 프로필/설정', x:31860, headerId:'83:792', contentWidth:480 });
await titleBlock(content, '프로필 설정', '내 정보를 관리하세요');
const av = await instance('10:424'); content.appendChild(av);        // Avatar
await listCol(content, ['2:20','2:20','2:20']);   // InputField(Default) 이름/이메일/소개
const btn = await instance('2:6'); content.appendChild(btn); btn.layoutSizingHorizontal='FILL'; // Button Primary 저장
return { screenId: content.parent.parent.id };
```

### 화면 19 — 크리에이터 대시보드
```js
const { content } = await buildShell({ name:'19 크리에이터 대시보드', x:33360, headerId:'82:792', contentWidth:1200 });
const summary = await instance('94:792'); content.appendChild(summary); summary.layoutSizingHorizontal='FILL'; // Studio Summary Card
await sectionTitle(content, '바로가기');
const tiles=['91:792','92:792','92:805','92:817','92:830']; // Quick Action Tile 5색
let row;
for (let i=0;i<tiles.length;i++){ if(i%2===0){ row=figma.createAutoLayout('HORIZONTAL'); row.itemSpacing=20; row.fills=[]; content.appendChild(row); row.layoutSizingHorizontal='FILL'; row.counterAxisSizingMode='AUTO'; }
  const t=await instance(tiles[i]); row.appendChild(t); t.layoutSizingHorizontal='FILL'; }
return { screenId: content.parent.parent.id };
```

### 화면 20 — 스튜디오 편집
```js
const { content } = await buildShell({ name:'20 스튜디오 편집', x:34860, headerId:'82:792', contentWidth:560 });
await titleBlock(content, '스튜디오 편집', '공개 프로필을 수정하세요');
const editor = await instance('5:310'); content.appendChild(editor); // StudioHeaderEditor
return { screenId: content.parent.parent.id };
```

### 화면 21 — 멤버십(플랜·멤버 탭)
```js
const { content } = await buildShell({ name:'21 멤버십 관리', x:36360, headerId:'82:792', contentWidth:1200 });
await titleBlock(content, '멤버십', '플랜과 멤버를 관리하세요');
await tabBar(content, ['플랜','멤버'], 0);
await cardGrid(content, '2:93', 3, 3);            // MembershipPlanCard
await sectionTitle(content, '멤버');
await listCol(content, ['10:438','10:438','10:438']); // ListItem (멤버 행)
return { screenId: content.parent.parent.id };
```

### 화면 22 — 멤버십 생성/수정 폼
```js
const { content } = await buildShell({ name:'22 멤버십 폼', x:37860, headerId:'82:792', contentWidth:600 });
await titleBlock(content, '멤버십 만들기', '플랜 정보와 혜택을 입력하세요');
const form = await instance('5:345'); content.appendChild(form);  // MembershipPlanForm
const ai = await instance('5:358'); content.appendChild(ai);      // AiSuggestPanel
return { screenId: content.parent.parent.id };
```

### 화면 23 — 포스트 작성
```js
const { content } = await buildShell({ name:'23 포스트 작성', x:39360, headerId:'82:792', contentWidth:600 });
await titleBlock(content, '포스트 작성', '공개 범위를 선택하고 글을 작성하세요');
const tab = await instance('89:812'); content.appendChild(tab);   // Visibility Tab(set)
const composer = await instance('25:720'); content.appendChild(composer); // PostComposer Public
return { screenId: content.parent.parent.id };
```

### 화면 24 — 프로그램 관리
```js
const { content } = await buildShell({ name:'24 프로그램 관리', x:40860, headerId:'82:792', contentWidth:1200 });
await titleBlock(content, '프로그램 관리', '모집 중인 프로그램과 신청 현황');
const btn = await instance('2:6'); content.appendChild(btn);      // Button "새 프로그램"
await cardGrid(content, '2:81', 6, 3);            // ProgramCard ×6
return { screenId: content.parent.parent.id };
```

### 화면 25 — 프로그램 생성/수정 폼
```js
const { content } = await buildShell({ name:'25 프로그램 폼', x:42360, headerId:'82:792', contentWidth:600 });
await titleBlock(content, '프로그램 만들기', '일정·정원·금액을 입력하세요');
const form = await instance('5:319'); content.appendChild(form);  // ProgramForm
const ai = await instance('5:358'); content.appendChild(ai);      // AiSuggestPanel
return { screenId: content.parent.parent.id };
```

### 화면 26 — 프로그램 운영(개요·신청자·참여자 탭)
```js
const { content } = await buildShell({ name:'26 프로그램 운영', x:43860, headerId:'82:792', contentWidth:800 });
await titleBlock(content, '프로그램 운영', '신청자 검토와 참여자 관리');
await tabBar(content, ['개요','신청자','참여자'], 1);
await listCol(content, ['5:123','5:137','5:145']); // ApplicationReviewItem 3상태
await sectionTitle(content, '참여자');
await listCol(content, ['5:153']);                // ParticipantCard
return { screenId: content.parent.parent.id };
```

### 화면 27 — 정산 현황
```js
const { content } = await buildShell({ name:'27 정산 현황', x:45360, headerId:'82:792', contentWidth:1200 });
await titleBlock(content, '정산 현황', '완료 승인과 지급 내역');
const sum = await instance('21:729'); content.appendChild(sum); sum.layoutSizingHorizontal='FILL'; // SettlementSummary
await listCol(content, ['22:720','22:731','22:745','22:759']); // 헤더 + 3상태 행
return { screenId: content.parent.parent.id };
```

### 화면 28 — 알림 센터
```js
const { content } = await buildShell({ name:'28 알림 센터', x:46860, headerId:'83:792', contentWidth:760 });
await titleBlock(content, '알림', '계약·결제·커뮤니티 소식');
await listCol(content, ['10:438','10:438','10:438','10:438']); // ListItem(알림 행) ×4
const empty = await instance('5:383'); content.appendChild(empty);
return { screenId: content.parent.parent.id };
```

### 화면 29 — 계약서/약관 동의
```js
const { content } = await buildShell({ name:'29 계약서', x:48360, headerId:'83:792', contentWidth:620 });
await titleBlock(content, '계약서', '금액 합의 후 양측이 서명합니다');
const amt = await instance('5:98'); content.appendChild(amt);   // AmountNegotiationPanel
const panel = await instance('5:79'); content.appendChild(panel); // ContractPanel Dual Signature
return { screenId: content.parent.parent.id };
```

### 화면 30 — 작품 관리
```js
const { content } = await buildShell({ name:'30 작품 관리', x:49860, headerId:'82:792', contentWidth:1200 });
await titleBlock(content, '작품 관리', '판매 작품을 등록하고 관리하세요');
const form = await instance('247:1262'); content.appendChild(form); // ArtworkForm (자연폭 480, 가운데)
await sectionTitle(content, '판매 중인 작품');
await cardGrid(content, '245:1263', 6, 3);        // ArtworkProductCard(Published) ×6
return { screenId: content.parent.parent.id };
```

### 화면 31 — 작품 주문 관리 (배송)
```js
const { content } = await buildShell({ name:'31 작품 주문 관리', x:51360, headerId:'82:792', contentWidth:760 });
await titleBlock(content, '작품 주문 관리', '결제된 주문을 발송 처리하세요');
await listCol(content, ['246:1262','246:1272','246:1282']); // OrderCard PendingPayment/Preparing/Shipped
await sectionTitle(content, '발송 처리');
const ship = await instance('248:1262'); content.appendChild(ship); ship.layoutSizingHorizontal='FILL'; // ShipmentForm
return { screenId: content.parent.parent.id };
```

### 화면 32 — 팬 작품 주문 목록
```js
const { content } = await buildShell({ name:'32 작품 주문 목록', x:52860, headerId:'83:792', contentWidth:760 });
await titleBlock(content, '내 작품 주문', '구매한 작품의 배송 상태');
// 상태 필터칩 행 (전체/배송중/수령완료)
const chips=figma.createAutoLayout('HORIZONTAL'); chips.itemSpacing=8; chips.fills=[]; content.appendChild(chips); chips.layoutSizingHorizontal='FILL';
for (const [id,label] of [['223:1211','전체'],['223:1209','배송 중'],['223:1209','수령 완료']]){ const c=await instance(id); chips.appendChild(c); const t=c.findOne(n=>n.type==='TEXT'); if(t) t.characters=label; }
await listCol(content, ['245:1288','246:1282','246:1292','246:1302']); // Paid/Shipped/Received/IssueOpened
return { screenId: content.parent.parent.id };
```

### 화면 33 — 작품 주문 상세
```js
const { content } = await buildShell({ name:'33 작품 주문 상세', x:54360, headerId:'83:792', contentWidth:760 });
const bc = await instance('10:26'); content.appendChild(bc);     // Breadcrumb
const order = await instance('246:1282'); content.appendChild(order); order.layoutSizingHorizontal='FILL'; // OrderCard Shipped
await infoCard(content, '배송 정보', [['수령자','김한진'],['연락처','010-1234-5678'],['배송지','서울 마포구 …'],['송장','CJ대한통운 · 1234567890']]);
const recv = await instance('2:6'); content.appendChild(recv); recv.layoutSizingHorizontal='FILL'; // Button 수령 확인
return { screenId: content.parent.parent.id };
```

### 화면 34 — 작품 구매 결제 (예시 템플릿 ②: 2단형)
```js
const { content } = await buildShell({ name:'34 작품 구매 결제', x:55860, headerId:'83:792', contentWidth:1100 });
await titleBlock(content, '작품 결제', '주문 정보를 확인하고 결제하세요');
const { left, right } = twoCol(content, 380);
await infoCard(left, '배송 정보', [['수령자','김한진'],['연락처','010-1234-5678'],['배송지','서울 마포구 …'],['요청사항','부재시 문 앞']]);
const sum = await instance('249:1262'); right.appendChild(sum); sum.layoutSizingHorizontal='FILL'; // CheckoutSummaryCard
return { screenId: content.parent.parent.id };
```

### 화면 35 — 프로그램 신청 결제
```js
const { content } = await buildShell({ name:'35 프로그램 결제', x:57360, headerId:'83:792', contentWidth:1100 });
await titleBlock(content, '프로그램 신청 결제', '신청 내용을 확인하고 결제하세요');
const { left, right } = twoCol(content, 380);
const detail = await instance('54:721'); left.appendChild(detail); detail.layoutSizingHorizontal='FILL'; // ProgramDetail
await sectionTitle(left, '자주 묻는 질문');
await listCol(left, ['10:467','10:467','10:467']); // Accordion Item (FAQ)
const sum = await instance('249:1262'); right.appendChild(sum); sum.layoutSizingHorizontal='FILL';
return { screenId: content.parent.parent.id };
```

### 화면 36 — 멤버십 가입 결제
```js
const { content } = await buildShell({ name:'36 멤버십 결제', x:58860, headerId:'83:792', contentWidth:1100 });
await titleBlock(content, '멤버십 가입 결제', '플랜 혜택을 확인하고 결제하세요');
const { left, right } = twoCol(content, 380);
const plan = await instance('2:93'); left.appendChild(plan); plan.layoutSizingHorizontal='FILL'; // MembershipPlanCard
const sum = await instance('249:1262'); right.appendChild(sum); sum.layoutSizingHorizontal='FILL';
return { screenId: content.parent.parent.id };
```

### 화면 37 — 결제 영수증
```js
const { content } = await buildShell({ name:'37 결제 영수증', x:60360, headerId:'83:792', contentWidth:640 });
const receipt = await instance('252:1262'); content.appendChild(receipt); // ReceiptCard (자연폭 560, 가운데)
return { screenId: content.parent.parent.id };
```

### 화면 38 — 정산 지급 설정 (2단형)
```js
const { content } = await buildShell({ name:'38 정산 설정', x:61860, headerId:'82:792', contentWidth:1100 });
await titleBlock(content, '정산 설정', '정산 받을 계좌와 지급 정보를 등록하세요');
const { left, right } = twoCol(content, 520);
const status = await instance('253:1262'); left.appendChild(status); status.layoutSizingHorizontal='FILL'; // PayoutStatusCard
const form = await instance('253:1278'); right.appendChild(form); form.layoutSizingHorizontal='FILL';  // PayoutSettingsForm
return { screenId: content.parent.parent.id };
```

### 화면 39 — 멤버 관리
```js
const { content } = await buildShell({ name:'39 멤버 관리', x:63360, headerId:'82:792', contentWidth:800 });
await titleBlock(content, '멤버 관리', '내 스튜디오의 활성 멤버');
await listCol(content, ['10:438','10:438','10:438','10:438','10:438']); // ListItem (멤버 행) ×5
const empty = await instance('5:383'); content.appendChild(empty);
return { screenId: content.parent.parent.id };
```

### 화면 04 — 이용약관 (본문 텍스트 허용)
```js
const { content } = await buildShell({ name:'04 이용약관', x:21360, headerId:'84:792', contentWidth:760 });
await titleBlock(content, '이용약관', '시행일 2026-06-01');
for (const [h,b] of [['제1조 (목적)','본 약관은 ArtBridge 서비스 이용에 관한 조건을 정합니다.'],['제2조 (정의)','“회원”이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.'],['제3조 (서비스)','크리에이터 후원·프로그램 신청·작품 거래 기능을 제공합니다.']]){
  await sectionTitle(content, h);
  const p=figma.createText(); p.fontName={family:FAM,style:'Regular'}; p.fontSize=14; p.lineHeight={unit:'PIXELS',value:22}; p.characters=b; p.fills=[await bound('1:18')];
  content.appendChild(p); p.layoutSizingHorizontal='FILL'; p.textAutoResize='HEIGHT';
}
return { screenId: content.parent.parent.id };
```

### 화면 05 — 개인정보처리방침 (04와 동일 패턴, x=22860, name '05 개인정보처리방침', 제목/본문만 교체)

### 화면 06 — 고객지원/FAQ
```js
const { content } = await buildShell({ name:'06 고객지원/FAQ', x:24360, headerId:'84:792', contentWidth:760 });
await titleBlock(content, '고객지원', '자주 묻는 질문');
await listCol(content, ['10:467','10:467','10:467','10:467']); // Accordion Item ×4
return { screenId: content.parent.parent.id };
```

### 화면 07 — 404·에러
```js
const { content } = await buildShell({ name:'07 에러', x:25860, headerId:'84:792', contentWidth:760 });
const err = await instance('5:395'); content.appendChild(err);   // ErrorState / Retry
return { screenId: content.parent.parent.id };
```

---

## D. 컴포넌트 ID 부록 (전수)

### 셸 (App Shell 페이지)
| 컴포넌트 | ID |
|---|---|
| App Header | set 84:813 → Creator 82:792 / Fan 83:792 / Guest 84:792 |
| Footer | 56:744 |
| Page Header | 86:792 |
| Studio Summary Card | 94:792 |
| Quick Action Tile | set 92:844 → Brand 91:792 / Program 92:792 / Membership 92:805 / Success 92:817 / Community 92:830 |
| Visibility Tab | set 89:812 → True 89:808 / False 89:810 |

### 카드·디스커버리
| 컴포넌트 | ID |
|---|---|
| CreatorCard 2:69 · ProgramCard 2:81 · MembershipPlanCard 2:93 · LockedPostCard 2:105 ||
| FeatureBannerCard 157:918 · CompactThumbCard 157:926 · ListRowCard 157:932 ||
| SectionHeader WithAction 30:728 / Plain 30:742 · ExploreHero 30:720 ||
| FilterChip set 223:1213 → True 223:1211 / False 223:1209 ||
| Pagination 10:39 · Chip 10:431 · Stat Card 10:474 · Avatar 10:424 ||

### 포스트·커뮤니티
| PostDetail Free 53:724 / Members 53:739 / Paid 53:760 · PostArticle 203:924 |
| PostComposer Public 25:720 / Membership 25:739 / Paid 25:761 · PostPurchasePrompt 5:252 |
| CommentSortBar 213:924 · CommentInput 213:925 · CommentRow 213:926 · CommentReply 213:927 · RelatedPostItem 213:928 · Divider Line 213:929 |
| CommunityPostItem 5:236 · CommunityComposer 5:226 · CommunityLockedNotice 5:244 · Breadcrumb 10:26 |

### 프로그램·신청·리뷰
| ProgramDetail Recruiting 54:721 / Closed 54:736 |
| ApplicationForm Default 26:720 / Submitting 26:738 / AlreadyApplied 26:756 |
| MyApplicationItem Pending 27:720 / Accepted 27:750 / Contracted 27:782 / Paid 27:814 / Completed 27:844 / Rejected 27:876 |
| ApplicationReviewItem Pending 5:123 / Accepted 5:137 / Rejected 5:145 · ParticipantCard 5:153 |
| ReviewItem 5:293 · RatingSummary 5:303 · ReviewForm 5:266 · Rating Control 10:675 |

### 계약·결제·정산
| ContractPanel 5:79 · AmountNegotiationPanel 5:98 · PaymentDialog 5:61 · PaymentResultCard 5:112 |
| SettlementStatusBadge Pending 21:723 / Approvable 21:725 / Settled 21:727 |
| SettlementSummary Default 21:729 / Empty 21:744 · SettlementListHeader 22:720 |
| SettlementListItem Pending 22:731 / Approvable 22:745 / Settled 22:759 |
| CompletionApprovalDialog Default 22:772 / Loading 22:783 |

### 스튜디오 폼·프로필·상태
| StudioProfileHeader Default 29:720 / Guest 29:737 / Member 29:752 |
| StudioHeaderEditor 5:310 · MembershipPlanForm 5:345 · ProgramForm 5:319 · AiSuggestPanel 5:358 |
| Badge/Domain Status set 2:64 · EmptyState 5:383 · ErrorState 5:395 · AccessNotice 5:52 |
| ListItem 10:438 · Accordion Item 10:467 · InputField Default 2:20 / Focused 2:24 / Error 2:28 · Textarea 10:141 · Checkbox 10:145 · Button Primary 2:6 / Outline 2:12 / Ghost 2:16 |

### 🆕 작품 커머스 (2026-06-24 생성)
| ArtworkProductCard set 245:1287 → Published 245:1263 / Sold 245:1271 / Draft 245:1279 |
| ArtworkOrderCard set 246:1312 → Paid 245:1288 / PendingPayment 246:1262 / Preparing 246:1272 / Shipped 246:1282 / Received 246:1292 / IssueOpened 246:1302 |
| ArtworkForm 247:1262 · ShipmentForm 248:1262 · CheckoutSummaryCard 249:1262 |
| ReceiptCard 252:1262 · PayoutStatusCard 253:1262 · PayoutSettingsForm 253:1278 |

---

## E. GLM 1세션 투입 예시 (화면 15)

```
[A. 절대규칙 9개 그대로]

너는 Figma use_figma로 ArtBridge 화면 1개를 조립한다. 아래 JS(공통 PREAMBLE + 화면 코드)를
use_figma의 code로 "그대로" 실행하라(skillNames:"figma-use"). 실행 후 반환된 screenId로
get_screenshot을 찍어 ①Fan 헤더 ②작가카드 6개가 3열 ③오른쪽 여백/세로 클리핑 없음 ④Footer 를 확인하고,
문제가 있으면 원인만 고쳐 다시 실행한 뒤 한국어로 결과를 보고하라.

[B. 공통 PREAMBLE 코드 블록 전체]

[C. 화면 15 코드 블록]
```

> 화면별로 [C]만 바꿔 끼우면 04~39 전부 동일 방식으로 투입 가능.
