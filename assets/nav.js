/*! nav.js — 포트폴리오 전역 내비게이션 드로어 (plan portfolio/0005)
 *
 *  좌측 햄버거 → 슬라이드아웃 패널. "지금 보는 곳" + 읽는 순서(동선) + "다음에 볼 것" 1장.
 *
 *  적용 대상 28개 — 프로젝트 4 · 이력서 1 · 워크스루 23.
 *   - 랜딩(index.html)은 제외: 랜딩 자체가 메뉴다(plan 0005 D1).
 *   - 워크스루는 데스크톱에 고정 레일이 이미 있으므로 ≤960px에서만 버튼을 띄운다(D2).
 *     그 폭에서 레일이 display:none 되어 내비게이션이 0이 되는 구간을 대체한다.
 *   - 토큰은 --cn-* 만 소비한다. canon v2 토큰은 :root가 아니라 .canon 스코프에 있으므로
 *     드로어 루트에 class="canon"을 직접 단다(D5).
 */
(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────────
     1. 사이트맵 — 배열 순서가 곧 읽는 순서(동선)다. 번호는 여기서 파생된다.
     ─────────────────────────────────────────────────────────────── */
  var MAIN = [
    { href: 'index.html',                              label: '포트폴리오 홈',     hint: '대표작 4장 한눈에' },
    { href: 'walkthroughs/워크스루-시스템오버뷰.html', label: '시스템 오버뷰',     hint: '전체가 어떻게 맞물리나' },
    { href: 'projects/erp.html',                       label: '제조 웹 ERP',       hint: '14개 도메인 1인 구축' },
    { href: 'projects/production.html',                label: '생산 관리',         hint: '카톡 수주 → APS → 실시간 지시' },
    { href: 'projects/dochub-ontology.html',           label: '문서허브·온톨로지', hint: 'AI 레이어 — 시멘틱 검색·RAG' },
    { href: 'projects/ai-engineering.html',            label: 'AI 엔지니어링',     hint: 'OSS · 개인 R&D' },
    { href: 'walkthroughs/워크스루.html',              label: '워크스루 22편',     hint: '왜 이렇게 만들었나' },
    { href: 'resume.html',                             label: '이력서',            hint: '경력 · 스택 정리' }
  ];
  var HUB = 6; /* MAIN에서 '워크스루 22편'의 인덱스 — 워크스루 상세의 소속 구역 */

  /* 워크스루 상세 21편 — 허브(워크스루.html) 나열 순서. 동선 밖이므로 "다음"은 이 안에서 이어지고,
     마지막 편은 동선 마지막 항목(이력서)으로 복귀시킨다. */
  var WALKS = [
    ['워크스루-재고이벤트소싱.html', '재고 이벤트 소싱 코어'],
    ['워크스루-생산일지분해.html',   '생산일지 분해 (BOM)'],
    ['워크스루-일정문의챗봇.html',   '일정문의 · 챗봇'],
    ['워크스루-자금채권.html',       '자금 · 채권'],
    ['워크스루-생산로스율.html',     '생산 · 로스율'],
    ['워크스루-샘플관리.html',       '샘플관리 saga'],
    ['워크스루-거래처마스터.html',   '거래처 마스터'],
    ['워크스루-협업보드.html',       '협업보드'],
    ['워크스루-발주출고-SSoT.html',  '발주 · 출고 SSoT'],
    ['워크스루-마이그레이션.html',   '데이터 마이그레이션'],
    ['워크스루-APS.html',            'APS 생산계획 자동화'],
    ['워크스루-관리회계.html',       '관리회계 · 제품별 손익'],
    ['워크스루-현장모바일.html',     '현장 · 모바일 실행'],
    ['워크스루-권한감사.html',       '권한 · 감사 · 보안 백본'],
    ['워크스루-거버넌스.html',       '거버넌스 체계'],
    ['워크스루-기타요약.html',       '그 외 plan 요약'],
    ['워크스루-온톨로지.html',       '도메인 온톨로지 지식그래프'],
    ['워크스루-문서허브.html',       '문서허브'],
    ['워크스루-코퍼스적재.html',     '사내 코퍼스 지식그래프 적재'],
    ['워크스루-온톨로지확장.html',   '온톨로지 확장'],
    ['워크스루-디자인가독성.html',   '디자인 · 가독성 시스템']
  ];

  /* ───────────────────────────────────────────────────────────────
     2. 현재 위치 판정 — GitHub Pages 하위 경로에서도 깨지지 않도록 상대경로로 산출한다.
     ─────────────────────────────────────────────────────────────── */
  var segs = decodeURIComponent(location.pathname).split('/').filter(Boolean);
  var file = segs.length ? segs[segs.length - 1] : '';
  var dir  = segs.length > 1 ? segs[segs.length - 2] : '';
  var inSub = (dir === 'projects' || dir === 'walkthroughs');
  var base = inSub ? '../' : '';
  var key  = inSub ? dir + '/' + file : file;

  var mainIdx = -1, walkIdx = -1, i;
  for (i = 0; i < MAIN.length; i++) if (MAIN[i].href === key) { mainIdx = i; break; }
  if (mainIdx < 0 && dir === 'walkthroughs') {
    for (i = 0; i < WALKS.length; i++) if ('walkthroughs/' + WALKS[i][0] === key) { walkIdx = i; break; }
  }
  if (mainIdx < 0 && walkIdx < 0) return; /* 사이트맵에 없는 페이지 — 드로어를 붙이지 않는다 */

  var activeIdx = mainIdx >= 0 ? mainIdx : HUB;
  var hereLabel = mainIdx >= 0 ? MAIN[mainIdx].label
                               : MAIN[HUB].label + ' › ' + WALKS[walkIdx][1];

  /* "다음에 볼 것" — 동선 안이면 다음 동선 항목, 워크스루 상세면 다음 편(끝이면 동선 복귀). */
  var next = null;
  if (mainIdx >= 0) {
    if (mainIdx + 1 < MAIN.length) next = { no: mainIdx + 2, href: MAIN[mainIdx + 1].href, label: MAIN[mainIdx + 1].label, hint: MAIN[mainIdx + 1].hint };
  } else if (walkIdx + 1 < WALKS.length) {
    next = { no: 0, href: 'walkthroughs/' + WALKS[walkIdx + 1][0], label: WALKS[walkIdx + 1][1], hint: '워크스루 계속 읽기' };
  } else {
    next = { no: MAIN.length, href: MAIN[MAIN.length - 1].href, label: MAIN[MAIN.length - 1].label, hint: MAIN[MAIN.length - 1].hint };
  }

  /* ───────────────────────────────────────────────────────────────
     3. 스타일 — 색·간격·그림자는 --cn-* 토큰만 소비(raw hex 금지, DESIGN.md §3F).
        간격은 4px 스케일(§11A): 4 · 8 · 12 · 16 · 24 · 32.
     ─────────────────────────────────────────────────────────────── */
  var CSS = [
    /* 루트: 페이지 인라인 CSS의 .canon{min-height:100vh;background:mesh}를 무력화해야 하므로 클래스 2회 */
    '.pnav-root.pnav-root{position:fixed;inset:0;z-index:120;pointer-events:none;min-height:0;background:none;',
      'font-family:\'Pretendard\',\'Noto Sans KR\',sans-serif;line-height:1.5}',
    '.pnav-root *{box-sizing:border-box}',

    '.pnav-btn{position:fixed;top:16px;left:16px;width:40px;height:40px;pointer-events:auto;',
      'display:flex;align-items:center;justify-content:center;cursor:pointer;',
      'border:1px solid var(--cn-line-strong);border-radius:999px;background:var(--cn-card);color:var(--cn-ink);',
      'box-shadow:var(--cn-shadow-1);transition:border-color .18s,box-shadow .2s}',
    '.pnav-btn:hover{border-color:var(--cn-primary);color:var(--cn-primary-deep);box-shadow:var(--cn-shadow-2)}',

    '.pnav-scrim{position:fixed;inset:0;background:var(--cn-ink);opacity:0;pointer-events:none;',
      'transition:opacity .25s var(--cn-ease)}',
    '.pnav-root.is-open .pnav-scrim{opacity:.35;pointer-events:auto}',

    /* 떠 있는 표면은 이 패널 하나 — v2 절제 원칙(블러 1곳) */
    '.pnav-panel{position:fixed;top:0;left:0;bottom:0;width:300px;max-width:86vw;pointer-events:auto;',
      'display:flex;flex-direction:column;gap:24px;padding:24px;overflow-y:auto;visibility:hidden;',
      'background:var(--cn-card-glass);backdrop-filter:blur(14px);border-right:1px solid var(--cn-line);',
      'box-shadow:var(--cn-shadow-2);color:var(--cn-ink);transform:translateX(-100%);',
      'transition:transform .25s var(--cn-ease),visibility 0s linear .25s}',
    '.pnav-root.is-open .pnav-panel{visibility:visible;transform:none;',
      'transition:transform .25s var(--cn-ease),visibility 0s}',

    '.pnav-head{display:flex;align-items:center;justify-content:space-between;gap:12px}',
    '.pnav-title{font-size:14px;font-weight:800;letter-spacing:-.01em}',
    '.pnav-x{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer;',
      'border:1px solid var(--cn-line);border-radius:999px;background:var(--cn-card);color:var(--cn-muted);transition:border-color .18s,color .18s}',
    '.pnav-x:hover{border-color:var(--cn-primary);color:var(--cn-primary-deep)}',

    '.pnav-cap{font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:10px;font-weight:700;',
      'letter-spacing:.08em;text-transform:uppercase;color:var(--cn-faint);margin-bottom:8px}',
    '.pnav-here{font-size:13.5px;font-weight:700;line-height:1.5;color:var(--cn-primary-deep)}',

    '.pnav-list{display:flex;flex-direction:column;gap:4px}',
    '.pnav-item{display:flex;gap:12px;align-items:baseline;padding:8px 12px;border-radius:8px;',
      'text-decoration:none;color:var(--cn-ink);transition:background .18s,color .18s}',
    '.pnav-item:hover{background:var(--cn-tint);color:var(--cn-primary-deep)}',
    '.pnav-item[aria-current="page"]{background:var(--cn-tint-deep);color:var(--cn-primary-deep)}',
    '.pnav-item .no{flex:none;font-family:\'JetBrains Mono\',ui-monospace,monospace;font-variant-numeric:tabular-nums;',
      'font-size:10.5px;font-weight:700;color:var(--cn-faint)}',
    '.pnav-item[aria-current="page"] .no{color:var(--cn-primary)}',
    '.pnav-item .tx{display:flex;flex-direction:column;gap:4px;min-width:0}',
    '.pnav-item .lb{font-size:13px;font-weight:700;line-height:1.35}',
    '.pnav-item .ht{font-size:11px;color:var(--cn-muted);line-height:1.4}',

    '.pnav-next{display:flex;gap:12px;align-items:center;padding:16px;border-radius:12px;text-decoration:none;',
      'color:var(--cn-ink);background:var(--cn-card);border:1px solid var(--cn-line);box-shadow:var(--cn-shadow-1);',
      'transition:border-color .18s,box-shadow .2s,transform .2s var(--cn-ease)}',
    '.pnav-next:hover{border-color:var(--cn-primary);box-shadow:var(--cn-shadow-2);transform:translateY(-2px)}',
    '.pnav-next .tx{display:flex;flex-direction:column;gap:4px;min-width:0}',
    '.pnav-next .lb{font-size:13.5px;font-weight:800;line-height:1.35}',
    '.pnav-next .ht{font-size:11px;color:var(--cn-muted);line-height:1.4}',
    '.pnav-next .go{flex:none;color:var(--cn-primary)}',

    /* 이 페이지 목차 — 레일이 숨는 폭에서 페이지 내부 이동 수단을 대체한다(plan 0006 W2) */
    '.pnav-toc-list{display:flex;flex-direction:column;gap:4px}',
    '.pnav-toc-item{display:block;padding:8px 12px;border-radius:8px;font-size:12.5px;font-weight:600;',
      'color:var(--cn-ink);text-decoration:none;transition:background .18s,color .18s}',
    '.pnav-toc-item:hover{background:var(--cn-tint);color:var(--cn-primary-deep)}',

    '.pnav-foot{margin-top:auto;padding-top:16px;border-top:1px solid var(--cn-line);font-size:11px;color:var(--cn-faint)}',

    /* 고정 버튼이 본문 좌상단과 겹치지 않도록 상단 여백 보정(D8) */
    'body.pnav-free .wrap{padding-top:80px}',
    /* 워크스루: 데스크톱은 기존 레일이 담당 → 버튼 숨김. 레일이 사라지는 ≤960px에서만 노출(D2) */
    'body.pnav-rail .pnav-btn{display:none}',
    '@media (max-width:960px){body.pnav-rail .pnav-btn{display:flex}',
      'body.pnav-rail .cn-main{padding-top:76px!important}}',
    /* 인쇄: 드로어 전체 숨김 + 보정 여백 원복(§3E) */
    '@media print{.pnav-root{display:none!important}body.pnav-free .wrap{padding-top:0!important}}'
  ].join('');

  /* ───────────────────────────────────────────────────────────────
     4. 마크업 — 아이콘은 인라인 SVG(이력서는 Material Symbols를 로드하지 않는다, D7)
     ─────────────────────────────────────────────────────────────── */
  function svg(d, size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
           ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
  }
  var ICON_MENU = svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 18);
  var ICON_X    = svg('<path d="M6 6l12 12M18 6L6 18"/>', 15);
  var ICON_GO   = svg('<path d="M5 12h14M13 6l6 6-6 6"/>', 18);

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var items = '';
  for (i = 0; i < MAIN.length; i++) {
    items += '<a class="pnav-item" href="' + base + MAIN[i].href + '"' +
             (i === activeIdx ? ' aria-current="page"' : '') + '>' +
             '<span class="no">' + pad(i + 1) + '</span>' +
             '<span class="tx"><span class="lb">' + MAIN[i].label + '</span>' +
             '<span class="ht">' + MAIN[i].hint + '</span></span></a>';
  }

  var nextHtml = '';
  if (next) {
    nextHtml = '<div><div class="pnav-cap">다음에 볼 것</div>' +
      '<a class="pnav-next" href="' + base + next.href + '">' +
      '<span class="tx"><span class="lb">' + (next.no ? pad(next.no) + ' · ' : '') + next.label + '</span>' +
      '<span class="ht">' + next.hint + '</span></span>' +
      '<span class="go">' + ICON_GO + '</span></a></div>';
  }

  var root = document.createElement('div');
  root.className = 'canon pnav-root';
  root.innerHTML =
    '<button class="pnav-btn" type="button" aria-label="포트폴리오 메뉴 열기" aria-expanded="false">' + ICON_MENU + '</button>' +
    '<div class="pnav-scrim"></div>' +
    '<nav class="pnav-panel" aria-label="포트폴리오 내비게이션">' +
      '<div class="pnav-head"><span class="pnav-title">포트폴리오 둘러보기</span>' +
        '<button class="pnav-x" type="button" aria-label="메뉴 닫기">' + ICON_X + '</button></div>' +
      /* "다음에 볼 것"을 동선 목록보다 위에 둔다 — 목록이 길어 아래에 두면 접힘선 밖으로 밀린다 */
      '<div><div class="pnav-cap">지금 보는 곳</div><div class="pnav-here">' + hereLabel + '</div></div>' +
      /* 목차는 레일에서 런타임에 긁어온다 — 채워질 때까지 숨겨둔다 */
      (dir === 'walkthroughs'
        ? '<div class="pnav-toc" style="display:none"><div class="pnav-cap">이 페이지 목차</div>' +
          '<div class="pnav-toc-list"></div></div>'
        : '') +
      nextHtml +
      '<div><div class="pnav-cap">동선</div><div class="pnav-list">' + items + '</div></div>' +
      '<div class="pnav-foot">moongioh · awsgioh@gmail.com</div>' +
    '</nav>';

  var style = document.createElement('style');
  style.textContent = CSS;

  function mount() {
    document.head.appendChild(style);
    document.body.appendChild(root);
    document.body.classList.add(dir === 'walkthroughs' ? 'pnav-rail' : 'pnav-free');
    wire();
    refresh();
  }

  /* 레일의 목차(#앵커 링크)를 드로어로 옮겨 심는다. 레일은 템플릿 런타임이 나중에 렌더하므로
     지연 등장에 대비해 MutationObserver 쪽에서도 재시도한다. 한 번 채우면 끝. */
  var tocFilled = false;
  function buildToc() {
    if (tocFilled || dir !== 'walkthroughs') return;
    var box = root.querySelector('.pnav-toc');
    var rail = document.querySelector('.cn-rail');
    if (!box || !rail) return;
    var links = rail.querySelectorAll('a[href^="#"]');
    if (!links.length) return;

    var list = box.querySelector('.pnav-toc-list');
    for (var n = 0; n < links.length; n++) {
      /* 레일 링크는 <span class="mi">아이콘</span>라벨 구조라 아이콘 글자가 라벨에 섞인다 — 떼고 쓴다 */
      var copy = links[n].cloneNode(true);
      var icon = copy.querySelector('.mi');
      if (icon) icon.parentNode.removeChild(icon);
      var label = copy.textContent.replace(/\s+/g, ' ').trim();
      if (!label) continue;
      var a = document.createElement('a');
      a.className = 'pnav-toc-item';
      a.setAttribute('href', links[n].getAttribute('href'));
      a.textContent = label;
      list.appendChild(a);
    }
    /* 같은 페이지 안 이동이라 드로어가 덮은 채로 남으면 안 된다 */
    list.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    box.style.display = '';
    tocFilled = true;
  }

  /* ───────────────────────────────────────────────────────────────
     5. 동작 — 열기/닫기 · Esc · 배경 클릭 · 포커스 복귀 · 테마 추종
     ─────────────────────────────────────────────────────────────── */
  var btn, panel, lastFocus = null;

  function onKey(e) { if (e.key === 'Escape') close(); }

  function open() {
    root.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
    lastFocus = document.activeElement;
    var first = panel.querySelector('a,button');
    if (first) first.focus();
    document.addEventListener('keydown', onKey);
  }
  function close() {
    root.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function wire() {
    btn = root.querySelector('.pnav-btn');
    panel = root.querySelector('.pnav-panel');
    btn.addEventListener('click', function () {
      if (root.classList.contains('is-open')) close(); else open();
    });
    root.querySelector('.pnav-x').addEventListener('click', close);
    root.querySelector('.pnav-scrim').addEventListener('click', close);
  }

  /* 페이지의 .canon(워크스루는 템플릿 런타임이 나중에 렌더한다)에서 테마를 읽어 따라간다.
     페이지가 .canon을 갖고 있으면 그 값이 정본이고, 아직 없는 구간에서만 localStorage로 폴백한다. */
  var pending = false;
  function refresh() { syncTheme(); buildToc(); }
  function syncTheme() {
    var page = document.querySelector('.canon:not(.pnav-root)');
    var t;
    if (page) {
      /* 페이지가 정하면 그대로 따른다 — 속성 없음 = 라이트.
         여기서 localStorage로 폴백하면 라이트 전용 페이지(이력서)에서 드로어만 어두워진다. */
      t = page.getAttribute('data-theme');
    } else {
      /* .canon이 아직 없는 구간(워크스루는 런타임이 나중에 렌더) — 저장값으로 초기 깜빡임을 막는다 */
      try { t = localStorage.getItem('cn-theme'); } catch (e) { t = null; }
    }
    if (t === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
  }
  function scheduleSync() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; refresh(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  if (window.MutationObserver) {
    new MutationObserver(scheduleSync).observe(document.documentElement, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['data-theme']
    });
  }
})();
