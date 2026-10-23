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
    document.body.className = "theme-" + (window.TEMPLATES[data.template] ? data.template : "royal");
    document.title = `${data.bride || "Bride"} & ${data.groom || "Groom"} — Wedding Invitation`;

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
    if (!preview) root.appendChild(envelope(main, data));
    else main.classList.add("open");
  }

  function hero(d) {
    const s = el("section", "hero");
    const photo = safeImg(d.photo);
    if (photo) {
      const f = el("div", "photo");
      const im = el("img"); im.src = photo; im.alt = `${d.bride || ""} & ${d.groom || ""}`;
      f.appendChild(im); s.appendChild(f);
    }
    s.appendChild(el("p", "kicker", "Together with their families"));
    const names = el("h1", "names");
    names.appendChild(el("span", "n1", d.bride || "Bride"));
    names.appendChild(el("span", "amp", "&"));
    names.appendChild(el("span", "n2", d.groom || "Groom"));
    s.appendChild(names);
    s.appendChild(el("p", "kicker", "are getting married"));
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
    const s = section("reveal", [el("h2", null, "Our moments")]);
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
    const s = section("reveal", [el("h2", null, "Counting down")]);
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
    const s = section("reveal", [el("h2", null, "Celebrations")]);
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
    return s;
  }

  function venue(d) {
    const s = section("reveal", [el("h2", null, "Venue")]);
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
    const s = section("reveal", [el("h2", null, "Will you join us?")]);
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
    const color = () => css.getPropertyValue("--particle").trim() || "#fff";
    const resize = () => {
      const dpr = devicePixelRatio || 1;
      w = canvas.width = innerWidth * dpr; h = canvas.height = innerHeight * dpr;
      canvas.style.width = innerWidth + "px"; canvas.style.height = innerHeight + "px";
    };
    const make = (fromTop) => ({
      x: Math.random() * w, y: fromTop ? -20 : Math.random() * h,
      r: (kind === "petal" ? 6 + Math.random() * 8 : kind === "heart" ? 7 + Math.random() * 7 : 1 + Math.random() * 2.5) * (devicePixelRatio || 1),
      vy: (kind === "petal" || kind === "heart" ? 0.6 : kind === "star" ? 0.05 : 0.25) + Math.random() * 0.6,
      vx: (Math.random() - 0.5) * 0.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.04,
      ph: Math.random() * 6, a: 0.3 + Math.random() * 0.6,
    });
    resize();
    const n = reduce ? 0 : kind === "petal" ? 28 : kind === "heart" ? 20 : 70;
    for (let i = 0; i < n; i++) parts.push(make(false));
    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = color();
      parts.forEach((p, i) => {
        p.y += p.vy * (devicePixelRatio || 1);
        p.x += p.vx + Math.sin(t / 1500 + p.ph) * 0.4;
        p.rot += p.vr;
        if (kind === "star") p.vy = 0.05;
        const tw = kind === "petal" || kind === "heart" ? p.a : p.a * (0.5 + 0.5 * Math.sin(t / 600 + p.ph));
        ctx.globalAlpha = tw;
        if (kind === "petal") {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, 7); ctx.fill(); ctx.restore();
        } else if (kind === "heart") {
          ctx.font = p.r * 2 + "px serif"; ctx.textAlign = "center";
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.sin(p.rot) * 0.4);
          ctx.fillText("\u2665", 0, 0); ctx.restore();
        } else if (kind === "star") {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
        } else {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4);
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.restore();
        }
        if (p.y > h + 20 || p.x < -30 || p.x > w + 30) parts[i] = make(true);
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
