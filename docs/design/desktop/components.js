/* Renders the shared pieces of the desktop mockups with sample data (today = Mon 9 Nov 2026).
   Only the layout around them differs between the two options. */
(function () {
  const BANKS = {
    HSBC: ['#db0011', '#ffffff'],
    HDFC: ['#004c8f', '#ffffff'],
    AXIS: ['#97144d', '#ffffff'],
    ICICI: ['#b02a30', '#ffffff'],
    SBI: ['#1a4f9c', '#ffffff'],
    ONE: ['#1f1f1f', '#ffffff'],
    AMEX: ['#016fd0', '#ffffff'],
  };
  const badge = (b) =>
    `<span class="badge" style="background:${BANKS[b][0]};color:${BANKS[b][1]}">${b === 'ONE' ? 'OC' : b}</span>`;
  const pencil =
    '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const chip =
    '<svg class="chip" viewBox="0 0 52 40" aria-hidden="true"><rect width="52" height="40" rx="8" fill="#d9b45a"/><rect x="1" y="1" width="50" height="38" rx="7" fill="none" stroke="#fff" stroke-opacity=".35"/><path d="M0 14h14M0 26h14M38 14h14M38 26h14M14 5v30M38 5v30M14 20h24" stroke="#8a6a1c" stroke-width="1.5" fill="none"/></svg>';
  const undo =
    '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 7L4.5 11.5 9 16M5 11.5h9.5a5 5 0 010 10H11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const TILES = [
    {
      bank: 'HSBC',
      name: 'Travel One',
      last4: '3719',
      tone: 'sand',
      pat: 'diamonds',
      due: 'Due Tue, 17 Nov',
    },
    {
      bank: 'AXIS',
      name: 'Flipkart',
      last4: '9033',
      tone: 'olive',
      pat: 'dots',
      due: 'Due Wed, 18 Nov',
    },
    {
      bank: 'HDFC',
      name: 'Swiggy Orange',
      last4: '5322',
      tone: 'terracotta',
      pat: 'lines',
      due: 'Due Sat, 21 Nov',
      pill: 'Pay day in 3 days',
    },
  ];
  const DECKS = [
    {
      title: 'Recently added',
      cards: [
        {
          bank: 'AXIS',
          name: 'Airtel',
          last4: '7437',
          tone: 'burgundy',
          pat: 'lines',
          st: 'Bill generates Tue, 10 Nov',
          note: 'Pay day Wed, 25 Nov · Due Mon, 30 Nov',
        },
        {
          bank: 'ONE',
          name: 'One card',
          last4: '9650',
          tone: 'black',
          pat: 'plain',
          st: 'Bill generates Wed, 11 Nov',
          note: 'Pay day Wed, 25 Nov · Due Mon, 30 Nov',
        },
        {
          bank: 'AXIS',
          name: 'Atlas',
          last4: '2153',
          tone: 'sand',
          pat: 'dots',
          st: 'Bill generates Thu, 12 Nov',
          note: 'Pay day Wed, 25 Nov · Due Mon, 30 Nov',
        },
        {
          bank: 'AMEX',
          name: 'Amex Privilege',
          last4: '6003',
          tone: 'burgundy',
          pat: 'diamonds',
          st: 'Bill generates Tue, 10 Nov',
          note: 'Pay day Wed, 25 Nov · Due Mon, 30 Nov',
        },
      ],
    },
    {
      title: 'Paid this cycle',
      cards: [
        {
          bank: 'AXIS',
          name: 'Magnus',
          last4: '2222',
          tone: 'slate',
          pat: 'diamonds',
          st: 'Paid',
          tick: true,
          note: 'Next bill Thu, 3 Dec',
        },
        {
          bank: 'HDFC',
          name: 'Regalia',
          last4: '4821',
          tone: 'forest',
          pat: 'diamonds',
          st: 'Paid',
          tick: true,
          note: 'Next bill Fri, 4 Dec',
        },
      ],
    },
    {
      title: 'Bill generated',
      cards: [
        {
          bank: 'SBI',
          name: 'Cashback',
          last4: '1207',
          tone: 'olive',
          pat: 'lines',
          st: 'Pay day in 16 days',
          note: 'Due Thu, 26 Nov',
        },
        {
          bank: 'ICICI',
          name: 'Amazon',
          last4: '6564',
          tone: 'terracotta',
          pat: 'diamonds',
          st: 'Pay day in 16 days',
          note: 'Due Thu, 26 Nov',
        },
      ],
    },
  ];

  const tile = (t) => `
    <li><article class="tile tone-${t.tone} pat-${t.pat}" aria-label="${t.name} ending ${t.last4}, ${t.due}">
      <div class="top">${badge(t.bank)}<h3 class="name">${t.name}</h3><a class="edit" href="#" aria-label="Edit ${t.name}">${pencil}</a></div>
      <div class="mid">${chip}<span class="mono-xs">•••• ${t.last4}</span></div>
      <div class="due">${t.due}</div>
      <div class="actions"><button class="btn-tile">Mark as paid</button></div>
    </article></li>`;

  const deck = (d) => `
    <section aria-label="${d.title}">
      <h2 class="sec-h">${d.title}<span class="count count-quiet">${d.cards.length}</span></h2>
      <ol class="deck" style="--count:${d.cards.length}">
        ${d.cards
          .map((c, i) => {
            const front = i === d.cards.length - 1;
            return `<li class="tone-${c.tone} pat-${c.pat} ${front ? 'front' : ''}" style="--pos:${i}">
            ${
              front
                ? `<div class="face"><div class="row">${badge(c.bank)}<span class="nm">${c.name}</span><span class="mono-xs">•••• ${c.last4}</span></div>
                 <p class="st">${c.st}${c.tick ? ' ✓' : ''}</p><p class="note">${c.note}</p></div>`
                : `<button class="strip" aria-label="${c.name}, show this card">${badge(c.bank)}<span class="nm">${c.name}</span><span class="mono-xs">•••• ${c.last4}</span></button>`
            }
          </li>`;
          })
          .join('')}
      </ol>
    </section>`;

  const calendar = () => {
    const wd = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      .map((w) => `<span class="wd">${w}</span>`)
      .join('');
    const cells = ['<span></span>'.repeat(6)];
    for (let d = 1; d <= 30; d += 1) {
      const cls = d === 9 ? 'today' : d === 12 || d === 25 ? 'pay' : '';
      cells.push(`<span class="${cls}">${d}</span>`);
    }
    return `<figure class="card cal" style="margin:0" aria-label="November 2026. Pay days Thu 12 Nov and Wed 25 Nov.">
      <figcaption class="cal-title">November 2026</figcaption>
      <div class="cal-grid" aria-hidden="true">${wd}${cells.join('')}</div>
      <div class="cal-legend" aria-hidden="true"><span><i style="background:var(--cal-today)"></i>Today</span><span><i style="background:var(--cal-pay)"></i>Pay day</span></div>
    </figure>`;
  };

  const timeline = (bare) => `
    <section class="${bare ? '' : 'card'}" style="${bare ? '' : 'padding:16px'}" aria-labelledby="tl-h">
      <h2 class="tl-h" id="tl-h">Reminders on</h2><p class="tl-time">9:00 am</p>
      <ol class="tl">
        <li class="today"><span class="dot"></span><b>Today</b><small>Mon, 9 Nov</small></li>
        <li class="pay"><span class="dot"></span><b>Pay day</b><small>Thu, 12 Nov · 3 bills</small></li>
        <li class="pay"><span class="dot"></span><b>Pay day</b><small>Wed, 25 Nov · 4 bills</small></li>
      </ol>
    </section>`;

  const tiles = () => `<ol class="tiles">${TILES.map(tile).join('')}</ol>`;
  const tilePill = () => `<span class="pill"><i></i>${TILES[TILES.length - 1].pill}</span>`;
  const decks = () => DECKS.map(deck).join('');

  /* ---- spends ---- */
  const MONTHS = [
    ['Jun', 0],
    ['Jul', 0],
    ['Aug', 0],
    ['Sep', 18200],
    ['Oct', 26450],
    ['Nov', 41198],
  ];
  const TX = [
    { name: 'Swiggy Orange', last4: '5322', date: 'Sun, 8 Nov', amt: '₹28,400', ok: true },
    { name: 'Travel One', last4: '3719', date: 'Fri, 6 Nov', amt: '₹12,798', ok: true },
    { name: 'Magnus', last4: '2222', date: 'Tue, 20 Oct', amt: '₹26,450', ok: true },
    { name: 'Regalia', last4: '4821', date: 'Thu, 15 Oct', amt: 'No amount logged', ok: true },
    { name: 'Regalia', last4: '4821', date: 'Tue, 15 Sep', amt: '₹18,200', ok: false },
  ];
  const spends = () => {
    const max = 41198;
    const bars = MONTHS.map(
      ([m, v]) =>
        `<div class="col ${m === 'Nov' ? 'on' : ''}"><div class="well"><div class="bar" style="height:${v ? Math.max(2, (v / max) * 100) : 0}%"></div></div><span class="lbl">${m}</span></div>`,
    ).join('');
    const rows = TX.map(
      (
        t,
      ) => `<li class="tx"><div><div class="nm">${t.name}</div><div class="meta">•••• ${t.last4} · ${t.date}</div></div><span class="amt">${t.amt}</span>
      <button class="revert" ${t.ok ? '' : 'disabled'} title="${t.ok ? 'Revert this payment' : 'Only the latest payment of a card can be reverted'}" aria-label="Revert payment of ${t.amt} on ${t.date}">${undo}</button></li>`,
    ).join('');
    return `<div class="spends">
      <div class="sp-head"><p class="hero-k">Paid in November</p><p class="hero-n">₹41,198</p><p class="para-s muted">Based on 3 payments you logged. 1 marked paid without an amount is not counted.</p></div>
      <div class="sp-main">
        <div class="sp-chart card" style="padding:16px">
          <div class="seg" style="max-width:320px;margin-bottom:16px" role="tablist"><button class="on" role="tab" aria-selected="true">All cards</button><button role="tab">Each card</button></div>
          <div class="plot" aria-label="Paid per month, last 6 months">${bars}</div>
          <p class="para-s muted" style="margin-top:12px">Tap a month to see it above.</p>
        </div>
        <section class="sp-tx" aria-labelledby="alltx"><h2 class="sec-h" id="alltx">All transactions<span class="count count-quiet">${TX.length}</span></h2><ul style="display:grid;gap:8px">${rows}</ul></section>
      </div></div>`;
  };

  /* ---- mockup chrome: theme + view switch ---- */
  const chrome = () => {
    const bar = document.createElement('div');
    bar.className = 'mock-bar';
    bar.innerHTML =
      '<span style="padding:0 8px">Mockup</span><button data-theme-set="light">Light</button><button data-theme-set="dark">Dark</button><a href="index.html">All options</a>';
    document.body.append(bar);
    bar.addEventListener('click', (e) => {
      const t = e.target.closest('[data-theme-set]');
      if (t) document.documentElement.dataset.theme = t.dataset.themeSet;
    });
    document.querySelectorAll('[data-view]').forEach((b) =>
      b.addEventListener('click', () => {
        document.querySelectorAll('[data-view]').forEach((x) => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-selected', x === b);
        });
        document.querySelectorAll('[data-pane]').forEach((p) => {
          p.hidden = p.dataset.pane !== b.dataset.view;
        });
      }),
    );
  };

  window.CQ = { calendar, timeline, tiles, tilePill, decks, spends, chrome };
})();
