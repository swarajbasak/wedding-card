// Card renderer + share-link encoding. Used by card.html and the editor preview.
(function () {
  const enc = (obj) => {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let s = "";
    bytes.forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };
  const dec = (str) => {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    const bin = atob(str);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };
  window.CardCodec = { enc, dec };

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const fmtDate = (iso, opts) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString(undefined, opts);
  };
  const fmtTime = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  };
  const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? u : "");
  const safeImg = (u) => (/^(https?:\/\/|data:image\/(jpeg|png|webp|gif);base64,)/i.test(u || "") ? u : "");

  const LEAF = '<svg viewBox="0 0 100 110" aria-hidden="true"><defs><linearGradient id="lg%ID%" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5fb55a"/><stop offset="1" stop-color="#1f6b32"/></linearGradient></defs><path d="M50 4C85 25 108 60 80 93C69 105 57 103 50 90C43 103 31 105 20 93C-8 60 15 25 50 4Z" fill="url(#lg%ID%)" stroke="#164f25" stroke-width="1.5"/><path d="M50 10V92M50 40L28 26M50 40L72 26M50 58L22 46M50 58L78 46M50 74L26 66M50 74L74 66" stroke="#b9e6a8" stroke-width="1.6" fill="none" opacity=".75"/></svg>';
  let L = {};
  let ORN = "";
  let ALTA = false;
  let CREST = false;
  let STITCH = false;
  let stopParticles = null;
  let countdownTimer = null;

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    let data = window.__CARD__ || null;
    try { if (p.get("d")) data = dec(p.get("d")); } catch (e) {}
    return { data: data || window.DEMO_CARD, preview: p.get("p") === "1" };
  }

  function render(root, data, { preview }) {
    if (stopParticles) stopParticles();
    clearInterval(countdownTimer);
    root.innerHTML = "";
    const tpl = window.TEMPLATES[data.template] || window.TEMPLATES.royal;
    L = tpl.labels || {};
    ORN = tpl.ornament || "";
    ALTA = !!tpl.alta;
    CREST = tpl.crest === "mukut";
    STITCH = !!tpl.stitch;
    document.body.className = "theme-" + (window.TEMPLATES[data.template] ? data.template : "royal");
    applyColors(data.colors);
    document.title = `${data.bride || "Bride"} & ${data.groom || "Groom"} — Wedding Invitation`;

    if (tpl.waves) root.appendChild(wavesEl());
    if (tpl.scene) root.appendChild(sceneEl(tpl.scene));
    const canvas = el("canvas", "fx");
    root.appendChild(canvas);
    stopParticles = startParticles(canvas, tpl.particles);

    const main = el("main", "card");
    main.appendChild(hero(data));
    if (data.message) main.appendChild(section("reveal", [el("p", "message", data.message)]));
    const pics = (data.gallery || []).map(safeImg).filter(Boolean);
    if (pics.length) main.appendChild(gallery(pics));
    if (data.date) main.appendChild(countdown(data.date));
    if ((data.events || []).length) main.appendChild(events(data.events));
    if (data.venue || data.address) main.appendChild(venue(data));
    if (data.rsvp) main.appendChild(rsvp(data));
    main.appendChild(el("footer", "foot", `${data.bride || ""} & ${data.groom || ""}`));
    root.appendChild(main);

    if (data.music && safeUrl(data.music)) root.appendChild(musicButton(data.music));

    observeReveals(root);
    if (!preview) root.appendChild((tpl.intro === "subho" ? subhoDrishti : envelope)(main, data));
    else main.classList.add("open");
  }

  function hero(d) {
    const s = el("section", "hero");
    if (CREST) { const c = el("div", "crest"); c.innerHTML = crestSvg(); s.appendChild(c); }
    if (STITCH) s.appendChild(el("div", "stitch"));
    if (ORN) { const a = el("div", "alpona"); a.innerHTML = ORN === "star8" ? starSvg() : alponaSvg(); s.appendChild(a); }
    const photo = safeImg(d.photo);
    if (photo) {
      const f = el("div", "photo");
      const im = el("img"); im.src = photo; im.alt = `${d.bride || ""} & ${d.groom || ""}`;
      f.appendChild(im); s.appendChild(f);
    }
    s.appendChild(el("p", "kicker", L.invite || "Together with their families"));
    if (L.kicker1) s.appendChild(el("p", "kicker bn", L.kicker1));
    const names = el("h1", "names");
    names.appendChild(el("span", "n1", d.bride || "Bride"));
    names.appendChild(el("span", "amp", "&"));
    names.appendChild(el("span", "n2", d.groom || "Groom"));
    s.appendChild(names);
    s.appendChild(el("p", "kicker", L.married || "are getting married"));
    if (d.date) s.appendChild(el("p", "when", fmtDate(d.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })));
    s.appendChild(el("div", "scroll-hint", "↓"));
    return s;
  }

  function section(cls, kids) {
    const s = el("section", "sec " + cls);
    kids.forEach((k) => s.appendChild(k));
    return s;
  }

  function gallery(pics) {
    const s = section("reveal", [el("h2", null, L.moments || "Our moments")]);
    const grid = el("div", "gallery g" + Math.min(pics.length, 4));
    pics.forEach((src, i) => {
      const f = el("figure", "shot");
      f.style.transitionDelay = i * 100 + "ms";
      const im = el("img"); im.src = src; im.alt = ""; im.loading = "lazy";
      f.appendChild(im); grid.appendChild(f);
      f.addEventListener("click", () => lightbox(src));
    });
    s.appendChild(grid);
    return s;
  }

  function lightbox(src) {
    const o = el("div", "lightbox");
    const im = el("img"); im.src = src;
    o.appendChild(im);
    o.onclick = () => o.remove();
    document.body.appendChild(o);
  }

  function countdown(iso) {
    const s = section("reveal", [el("h2", null, L.countdown || "Counting down")]);
    const row = el("div", "cd");
    const cells = {};
    ["Days", "Hours", "Minutes", "Seconds"].forEach((l) => {
      const c = el("div", "cd-cell");
      const v = el("b", null, "0");
      c.appendChild(v); c.appendChild(el("span", null, l));
      row.appendChild(c); cells[l] = v;
    });
    s.appendChild(row);
    const target = new Date(iso).getTime();
    const tick = () => {
      let diff = Math.max(0, target - Date.now());
      if (isNaN(target)) diff = 0;
      const sec = Math.floor(diff / 1000);
      cells.Days.textContent = Math.floor(sec / 86400);
      cells.Hours.textContent = Math.floor((sec % 86400) / 3600);
      cells.Minutes.textContent = Math.floor((sec % 3600) / 60);
      cells.Seconds.textContent = sec % 60;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
    return s;
  }

  function events(list) {
    const s = section("reveal", [el("h2", null, L.events || "Celebrations")]);
    const wrap = el("div", "events");
    list.forEach((e, i) => {
      const item = el("div", "event");
      item.style.transitionDelay = i * 120 + "ms";
      item.appendChild(el("h3", null, e.name));
      const when = [fmtDate(e.time, { weekday: "short", day: "numeric", month: "short" }), fmtTime(e.time)].filter(Boolean).join(" · ");
      if (when) item.appendChild(el("p", "ev-when", when));
      if (e.place) item.appendChild(el("p", "ev-place", e.place));
      wrap.appendChild(item);
    });
    s.appendChild(wrap);
    if (ALTA) { const f = el("div", "alta"); f.innerHTML = altaSvg(); s.appendChild(f); }
    return s;
  }

  function venue(d) {
    const s = section("reveal", [el("h2", null, L.venue || "Venue")]);
    if (d.venue) s.appendChild(el("p", "venue-name", d.venue));
    if (d.address) s.appendChild(el("p", null, d.address));
    const url = safeUrl(d.mapUrl);
    if (url) {
      const a = el("a", "btn", "View on map");
      a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
      s.appendChild(a);
    }
    return s;
  }

  function rsvp(d) {
    const s = section("reveal", [el("h2", null, L.rsvp || "Will you join us?")]);
    const raw = d.rsvp.trim();
    const a = el("a", "btn", "RSVP");
    if (safeUrl(raw)) a.href = raw;
    else if (/^[+\d][\d\s()-]{6,}$/.test(raw)) {
      const num = raw.replace(/[^\d]/g, "");
      const text = encodeURIComponent(`Hi! I'll be attending ${d.bride} & ${d.groom}'s wedding 🎉`);
      a.href = `https://wa.me/${num}?text=${text}`;
    } else if (raw.includes("@")) a.href = "mailto:" + raw;
    else return s;
    a.target = "_blank"; a.rel = "noopener noreferrer";
    s.appendChild(a);
    return s;
  }

  function musicButton(src) {
    const audio = new Audio(src);
    audio.loop = true;
    const b = el("button", "music", "♪");
    b.title = "Toggle music";
    b.onclick = () => {
      if (audio.paused) { audio.play().catch(() => {}); b.classList.add("on"); }
      else { audio.pause(); b.classList.remove("on"); }
    };
    b._audio = audio;
    return b;
  }

  function envelope(main, d) {
    const wrap = el("div", "env-wrap");
    const env = el("div", "env");
    env.appendChild(el("div", "env-back"));
    const letter = el("div", "env-letter");
    letter.appendChild(el("span", null, `${d.bride || ""} & ${d.groom || ""}`));
    env.appendChild(letter);
    env.appendChild(el("div", "env-front"));
    env.appendChild(el("div", "env-flap"));
    env.appendChild(el("div", "seal", "♥"));
    wrap.appendChild(env);
    wrap.appendChild(el("p", "env-hint", "Tap to open your invitation"));
    document.body.classList.add("locked");
    const open = () => {
      wrap.classList.add("opening");
      const m = document.querySelector(".music");
      if (m && m._audio) m._audio.play().then(() => m.classList.add("on")).catch(() => {});
      setTimeout(() => {
        wrap.classList.add("gone");
        main.classList.add("open");
        document.body.classList.remove("locked");
        burst();
      }, 1400);
      setTimeout(() => wrap.remove(), 2400);
    };
    wrap.addEventListener("click", open, { once: true });
    return wrap;
  }





  function crestSvg() {
    let g = "";
    [-62, -42, -21, 0, 21, 42, 62].forEach((a) => {
      const len = a === 0 ? 76 : 62 - Math.abs(a) / 8;
      const rad = (a * Math.PI) / 180;
      g += `<ellipse cx="80" cy="${92 - len / 2}" rx="${a === 0 ? 10 : 8}" ry="${len / 2}" transform="rotate(${a} 80 92)"/>`;
      g += `<circle cx="${80 + Math.sin(rad) * (len + 5)}" cy="${92 - Math.cos(rad) * (len + 5)}" r="3.6" class="b"/>`;
    });
    return `<svg viewBox="0 0 160 104" aria-hidden="true"><g>${g}<rect x="30" y="88" width="100" height="11" rx="5" class="band"/></g></svg>`;
  }
  function sceneEl(name) {
    const w = el("div", "scene " + name);
    if (name === "kash") {
      let h = "";
      for (let i = 0; i < 26; i++) {
        const ht = 110 + Math.round(Math.random() * 90);
        h += `<svg viewBox="0 0 30 200" style="--h:${ht}px;--d:${(Math.random() * -4).toFixed(2)}s"><path d="M15 200C14 140 16 70 15 22" stroke="#b9ad86" stroke-width="1.6" fill="none"/><ellipse cx="15" cy="40" rx="10" ry="30" fill="#fff" opacity=".92"/><ellipse cx="11" cy="46" rx="7" ry="24" fill="#fff" opacity=".7"/><ellipse cx="19" cy="48" rx="7" ry="22" fill="#f4efe0" opacity=".8"/></svg>`;
      }
      w.innerHTML = h;
      return w;
    }
    // kolkata: Howrah-bridge style cantilever silhouette + a yellow taxi driving by
    const chord = (x) => (x < 360 ? 25 + ((360 - x) / 230) * 45 : x > 840 ? 25 + ((x - 840) / 230) * 45 : 70 - 45 * Math.pow((x - 600) / 240, 2));
    let top = "", truss = "";
    for (let x = 130; x <= 1070; x += 10) top += (x === 130 ? "M" : "L") + x + " " + (x < 130 ? 130 : chord(x)).toFixed(1);
    for (let x = 130, i = 0; x <= 1070; x += 24, i++) {
      const y = chord(x);
      truss += `<line x1="${x}" y1="132" x2="${x}" y2="${y.toFixed(1)}"/>`;
      if (x + 24 <= 1070) truss += i % 2 ? `<line x1="${x}" y1="132" x2="${x + 24}" y2="${chord(x + 24).toFixed(1)}"/>` : `<line x1="${x}" y1="${y.toFixed(1)}" x2="${x + 24}" y2="132"/>`;
    }
    const bridge = `<svg class="bridge" viewBox="0 0 1200 160" preserveAspectRatio="xMidYMax slice"><g stroke="#3b2a4a" fill="none" stroke-width="1.4" opacity=".55">${truss}<path d="${top}" stroke-width="3.5"/><rect x="110" y="132" width="980" height="7" fill="#3b2a4a" stroke="none"/><line x1="355" y1="25" x2="355" y2="132" stroke-width="6"/><line x1="845" y1="25" x2="845" y2="132" stroke-width="6"/></g></svg>`;
    const taxi = `<svg class="taxi" viewBox="0 0 100 44"><rect x="4" y="20" width="92" height="15" rx="5" fill="#f6c90e"/><path d="M24 20L32 8H68L78 20Z" fill="#f6c90e"/><path d="M30 19L35 11H48V19ZM52 19V11H66L73 19Z" fill="#cfe8f2"/><rect x="40" y="3" width="20" height="5" rx="1.5" fill="#222"/><rect x="4" y="29" width="92" height="3" fill="#222" opacity=".85"/><g class="wh"><circle cx="26" cy="36" r="7" fill="#222"/><circle cx="26" cy="36" r="3" fill="#999"/></g><g class="wh"><circle cx="76" cy="36" r="7" fill="#222"/><circle cx="76" cy="36" r="3" fill="#999"/></g><circle cx="94" cy="25" r="2.2" fill="#fff6b0"/></svg>`;
    w.innerHTML = bridge + taxi;
    return w;
  }

  function starSvg() {
    let g = "";
    for (let i = 0; i < 8; i++) g += `<path d="M100 22L108 70L100 60L92 70Z" transform="rotate(${i * 45} 100 100)" class="o"/>`;
    for (let i = 0; i < 2; i++) g += `<rect x="45" y="45" width="110" height="110" transform="rotate(${i * 45} 100 100)"/>`;
    for (let i = 0; i < 16; i++) g += `<circle cx="100" cy="9" r="2.2" transform="rotate(${i * 22.5} 100 100)" class="d"/>`;
    g += '<circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="18"/><circle cx="100" cy="100" r="5" class="d"/>';
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><g class="ring">${g}</g></svg>`;
  }
  function wavesEl() {
    const w = el("div", "waves");
    const path = "M0 60Q150 0 300 60T600 60T900 60T1200 60V120H0Z";
    w.innerHTML = [1, 2, 3].map((i) => `<svg class="wv w${i}" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="${path}"/></svg>`).join("");
    return w;
  }
  // user-picked colors override the template's theme variables
  function applyColors(c) {
    const b = document.body;
    b.removeAttribute("style");
    if (!c) return;
    const ok = (v) => /^#[0-9a-f]{6}$/i.test(v || "");
    const lum = (h) => (0.299 * parseInt(h.slice(1, 3), 16) + 0.587 * parseInt(h.slice(3, 5), 16) + 0.114 * parseInt(h.slice(5, 7), 16)) / 255;
    const set = (k, v) => b.style.setProperty(k, v);
    if (ok(c.bg1)) {
      set("--bg", ok(c.bg2) ? `linear-gradient(180deg, ${c.bg1}, ${c.bg2})` : c.bg1);
      const dark = lum(c.bg1) < 0.5;
      if (!ok(c.text)) set("--text", dark ? "#f6f1e7" : "#2b2024");
      set("--card", dark ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.62)");
    }
    if (ok(c.text)) set("--text", c.text);
    if (ok(c.accent)) {
      set("--accent", c.accent); set("--particle", c.accent);
      set("--env", c.accent); set("--env2", `color-mix(in srgb, ${c.accent} 70%, black)`);
      set("--orn", c.accent); set("--orn-dot", c.accent);
    }
  }

  // static decorative SVGs (no user data)
  function alponaSvg() {
    let g = "";
    for (let i = 0; i < 8; i++) g += `<ellipse cx="100" cy="52" rx="13" ry="30" transform="rotate(${i * 45} 100 100)"/>`;
    for (let i = 0; i < 16; i++) g += `<ellipse cx="100" cy="24" rx="6" ry="15" transform="rotate(${i * 22.5 + 11.25} 100 100)" class="o"/>`;
    for (let i = 0; i < 32; i++) g += `<circle cx="100" cy="6" r="2" transform="rotate(${i * 11.25} 100 100)" class="d"/>`;
    return `<svg viewBox="0 0 200 200" aria-hidden="true"><g class="ring">${g}<circle cx="100" cy="100" r="14"/><circle cx="100" cy="100" r="7" class="d"/></g></svg>`;
  }
  function altaSvg() {
    const foot = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse cx="0" cy="6" rx="6" ry="11"/><ellipse cx="0" cy="-8" rx="6" ry="4"/>${[-7, -3.5, 0, 3.5, 7].map((t, i) => `<circle cx="${t}" cy="${-15 - (i === 0 || i === 4 ? 0 : 1)}" r="1.8"/>`).join("")}</g>`;
    return `<svg viewBox="0 0 180 50" aria-hidden="true">${foot(40, 28, -8).replace("<g ", '<g class="ft f1" ')}${foot(70, 22, 8).replace("<g ", '<g class="ft f2" ')}${foot(110, 28, -8).replace("<g ", '<g class="ft f3" ')}${foot(140, 22, 8).replace("<g ", '<g class="ft f4" ')}</svg>`;
  }

  // Bengali "Shubho Drishti": the couple is hidden behind two betel leaves that part on tap
  function subhoDrishti(main, d) {
    const wrap = el("div", "env-wrap sd-wrap");
    const stage = el("div", "sd-stage");
    const med = el("div", "sd-medal");
    med.appendChild(el("span", "sd-title", L.sd || "Shubho Drishti"));
    med.appendChild(el("span", "sd-names", `${d.bride || ""} & ${d.groom || ""}`));
    stage.appendChild(med);
    ["l", "r"].forEach((side) => {
      const leaf = el("div", "sd-leaf " + side);
      leaf.innerHTML = LEAF.replace(/%ID%/g, side); // static markup only, no user data
      stage.appendChild(leaf);
    });
    wrap.appendChild(stage);
    wrap.appendChild(el("p", "env-hint", L.tap || "Tap to reveal"));
    document.body.classList.add("locked");
    wrap.addEventListener("click", () => {
      wrap.classList.add("opening");
      const m = document.querySelector(".music");
      if (m && m._audio) m._audio.play().then(() => m.classList.add("on")).catch(() => {});
      setTimeout(() => {
        wrap.classList.add("gone");
        main.classList.add("open");
        document.body.classList.remove("locked");
        burst();
      }, 1800);
      setTimeout(() => wrap.remove(), 2800);
    }, { once: true });
    return wrap;
  }

  function observeReveals(root) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.15 }
    );
    root.querySelectorAll(".reveal").forEach((n) => io.observe(n));
  }

  // ---- particles ----
  function startParticles(canvas, kind) {
    const ctx = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, raf, parts = [];
    const css = getComputedStyle(document.body);
    const STEADY = ["petal", "heart", "leaf", "bloom", "shiuli"];
    const leafCol = () => css.getPropertyValue("--leaf1").trim() || "#3f9a4c";
    const dotCol = () => css.getPropertyValue("--leaf2").trim() || "#e8a317";
    const color = () => css.getPropertyValue("--particle").trim() || "#fff";
    const resize = () => {
      const dpr = devicePixelRatio || 1;
      w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    };
    const make = (fromEdge) => ({
      x: Math.random() * w, y: fromEdge ? (kind === "bubble" ? h + 20 : -20) : Math.random() * h,
      r: (kind === "bubble" ? 3 + Math.random() * 8 : kind === "bloom" || kind === "shiuli" ? 6 + Math.random() * 6 : kind === "petal" ? 6 + Math.random() * 8 : kind === "heart" ? 7 + Math.random() * 7 : kind === "leaf" ? 7 + Math.random() * 7 : 1 + Math.random() * 2.5) * (devicePixelRatio || 1),
      vy: kind === "bubble" ? -(0.3 + Math.random() * 0.7) : (STEADY.includes(kind) ? 0.6 : kind === "star" ? 0.05 : 0.25) + Math.random() * 0.6,
      vx: (Math.random() - 0.5) * 0.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.04,
      ph: Math.random() * 6, a: 0.3 + Math.random() * 0.6,
      dot: Math.random() > 0.65,
    });
    resize();
    const n = reduce ? 0 : kind === "bubble" ? 26 : kind === "petal" ? 28 : STEADY.includes(kind) ? 22 : 70;
    for (let i = 0; i < n; i++) parts.push(make(false));
    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color();
      parts.forEach((p, i) => {
        p.y += p.vy * (devicePixelRatio || 1);
        p.x += p.vx + Math.sin(t / 1500 + p.ph) * 0.4;
        p.rot += p.vr;
        if (kind === "star") p.vy = 0.05;
        const tw = kind === "bubble" ? p.a * 0.8 : STEADY.includes(kind) ? p.a : p.a * (0.5 + 0.5 * Math.sin(t / 600 + p.ph));
        ctx.globalAlpha = tw;
        if (kind === "petal") {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 7); ctx.fill(); ctx.restore();
        } else if (kind === "leaf") {
          const r = p.r;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.dot ? dotCol() : leafCol();
          ctx.beginPath();
          if (p.dot) { ctx.arc(0, 0, r * 0.45, 0, 7); }
          else {
            ctx.moveTo(0, -r * 1.2);
            ctx.bezierCurveTo(r * 0.9, -r * 0.6, r * 1.3, r * 0.4, r * 0.5, r * 0.9);
            ctx.quadraticCurveTo(r * 0.15, r * 1.05, 0, r * 0.7);
            ctx.quadraticCurveTo(-r * 0.15, r * 1.05, -r * 0.5, r * 0.9);
            ctx.bezierCurveTo(-r * 1.3, r * 0.4, -r * 0.9, -r * 0.6, 0, -r * 1.2);
          }
          ctx.fill();
          if (!p.dot) { ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r * 0.7); ctx.stroke(); }
          ctx.restore();
        } else if (kind === "heart") {
          ctx.font = p.r * 2 + "px serif"; ctx.textAlign = "center";
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.rot) * 0.4);
          ctx.fillText("\u2665", 0, 0); ctx.restore();
        } else if (kind === "bloom" || kind === "shiuli") {
          const k = kind === "bloom" ? 8 : 5, r = p.r;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = "#fff"; ctx.strokeStyle = kind === "bloom" ? color() : "rgba(35,64,92,.28)"; ctx.lineWidth = 0.8;
          for (let i = 0; i < k; i++) {
            ctx.rotate((Math.PI * 2) / k);
            ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * (kind === "bloom" ? 0.26 : 0.3), r * 0.62, 0, 0, 7); ctx.fill(); ctx.stroke();
          }
          ctx.fillStyle = kind === "bloom" ? color() : "#f08a1c";
          ctx.beginPath(); ctx.arc(0, 0, r * 0.2, 0, 7); ctx.fill();
          ctx.restore();
        } else if (kind === "bubble") {
          ctx.strokeStyle = color(); ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.stroke();
          ctx.beginPath(); ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.2, 0, 7); ctx.fill();
        } else if (kind === "star") {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        } else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4);
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.restore();
        }
        if ((kind === "bubble" ? p.y < -20 : p.y > h + 20) || p.x < -30 || p.x > w + 30) parts[i] = make(true);
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }

  // celebratory burst when the envelope opens
  function burst() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 40; i++) {
      const s = el("i", "confetti");
      s.style.left = 50 + (Math.random() - 0.5) * 20 + "vw";
      s.style.setProperty("--dx", (Math.random() - 0.5) * 80 + "vw");
      s.style.setProperty("--dy", 20 + Math.random() * 60 + "vh");
      s.style.setProperty("--r", Math.random() * 720 + "deg");
      s.style.animationDelay = Math.random() * 0.3 + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 2600);
    }
  }

  window.CardApp = {
    mount(root) {
      let override = null;
      const go = () => {
        const r = readHash();
        render(root, override || r.data, r);
      };
      go();
      addEventListener("hashchange", () => { override = null; go(); });
      // the editor streams card data (including uploaded photos) via postMessage
      addEventListener("message", (e) => {
        if (e.source === parent && e.data && e.data.type === "vows-card") { override = e.data.data; go(); }
      });
      if (parent !== window) parent.postMessage({ type: "vows-ready" }, "*");
    },
  };
})();
