(function () {
  const form = document.getElementById("form");
  const preview = document.getElementById("preview");
  const evBox = document.getElementById("events");
  const themesBox = document.getElementById("themes");
  const KEY = "vows-draft";

  let state = JSON.parse(JSON.stringify(window.DEMO_CARD));
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved) state = saved;
  } catch (e) {}
  state.gallery = state.gallery || [];
  state.photo = state.photo || "";
  const t = new URLSearchParams(location.search).get("t");
  if (t && TEMPLATES[t]) state.template = t;

  // theme picker
  Object.entries(TEMPLATES).forEach(([k, v]) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = v.name; b.dataset.k = k;
    b.onclick = () => { state.template = k; sync(); };
    themesBox.appendChild(b);
  });

  // simple fields
  ["bride", "groom", "message", "date", "venue", "address", "mapUrl", "rsvp", "music"].forEach((n) => {
    form.elements[n].value = state[n] || "";
    form.elements[n].addEventListener("input", (e) => { state[n] = e.target.value; update(); });
  });

  // events list
  function renderEvents() {
    evBox.innerHTML = "";
    state.events.forEach((ev, i) => {
      const box = document.createElement("div"); box.className = "ev";
      const x = document.createElement("button"); x.type = "button"; x.className = "x"; x.textContent = "×";
      x.onclick = () => { state.events.splice(i, 1); renderEvents(); update(); };
      const mk = (label, key, type) => {
        const l = document.createElement("label"); l.textContent = label;
        const inp = document.createElement("input"); inp.type = type || "text"; inp.value = ev[key] || "";
        inp.oninput = () => { ev[key] = inp.value; update(); };
        box.append(l, inp);
      };
      box.appendChild(x);
      mk("Event name", "name"); mk("When", "time", "datetime-local"); mk("Place", "place");
      evBox.appendChild(box);
    });
  }
  document.getElementById("addEv").onclick = () => {
    state.events.push({ name: "", time: "", place: "" }); renderEvents(); update();
  };

  // ---- photos ----
  const MAX_GALLERY = 8;
  const isData = (u) => /^data:/.test(u || "");
  function shrink(file, max) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
      img.src = url;
    });
  }
  function thumb(src, onRemove) {
    const d = document.createElement("div"); d.className = "t";
    const im = document.createElement("img"); im.src = src;
    const x = document.createElement("button"); x.type = "button"; x.textContent = "×"; x.onclick = onRemove;
    d.append(im, x); return d;
  }
  function renderPhotos() {
    const ct = document.getElementById("coverThumb"); ct.innerHTML = "";
    if (state.photo) ct.appendChild(thumb(state.photo, () => { state.photo = ""; form.elements.photo.value = ""; renderPhotos(); update(); }));
    const gt = document.getElementById("galThumbs"); gt.innerHTML = "";
    state.gallery.forEach((g, i) => gt.appendChild(thumb(g, () => { state.gallery.splice(i, 1); renderPhotos(); update(); })));
  }
  document.getElementById("coverFile").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    state.photo = await shrink(f, 900); form.elements.photo.value = ""; e.target.value = "";
    renderPhotos(); update();
  };
  form.elements.photo.value = isData(state.photo) ? "" : state.photo;
  form.elements.photo.addEventListener("input", (e) => { state.photo = e.target.value.trim(); renderPhotos(); update(); });
  document.getElementById("galFile").onchange = async (e) => {
    for (const f of e.target.files) {
      if (state.gallery.length >= MAX_GALLERY) break;
      try { state.gallery.push(await shrink(f, 800)); } catch (err) {}
    }
    e.target.value = ""; renderPhotos(); update();
  };
  document.getElementById("galAdd").onclick = () => {
    const inp = document.getElementById("galUrl"), v = inp.value.trim();
    if (/^https?:\/\//i.test(v) && state.gallery.length < MAX_GALLERY) { state.gallery.push(v); inp.value = ""; renderPhotos(); update(); }
  };

  // ---- preview ----
  let timer, ready = false;
  preview.addEventListener("load", () => { ready = true; push(); });
  window.addEventListener("message", (e) => { if (e.source === preview.contentWindow && e.data && e.data.type === "vows-ready") { ready = true; push(); } });
  preview.src = "card.html#p=1";
  function push() {
    if (ready && preview.contentWindow) preview.contentWindow.postMessage({ type: "vows-card", data: state }, "*");
  }
  function shareState() {
    // uploaded photos are too big for a URL, so links keep only photos given as web URLs
    const out = Object.assign({}, state);
    out.photo = isData(state.photo) ? "" : state.photo;
    out.gallery = state.gallery.filter((g) => !isData(g));
    out.dropped = (isData(state.photo) ? 1 : 0) + state.gallery.filter(isData).length;
    return out;
  }
  function update() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
      push();
      const sh = shareState();
      delete sh.dropped;
      document.getElementById("open").href = cardUrl(CardCodec.enc(sh));
      const n = shareState().dropped;
      document.getElementById("photoNote").textContent = n
        ? `${n} uploaded photo${n > 1 ? "s are" : " is"} not included in the share link (too large for a URL). Use “Download .html” to send a card with all photos, or paste web image URLs instead.`
        : "";
    }, 200);
  }
  function cardUrl(q) {
    return new URL("card.html", location.href).href + "#d=" + q;
  }
  function sync() {
    themesBox.querySelectorAll("button").forEach((b) => b.classList.toggle("sel", b.dataset.k === state.template));
    update();
  }
  const flash = (msg) => {
    const toast = document.getElementById("toast");
    toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 2000);
  };

  document.getElementById("copy").onclick = async () => {
    const sh = shareState(); delete sh.dropped;
    const url = cardUrl(CardCodec.enc(sh));
    document.getElementById("shareOut").textContent = url;
    try { await navigator.clipboard.writeText(url); } catch (e) {}
    flash("Link copied!");
  };

  // self-contained card file (all CSS/JS/data/photos inlined) — works offline, photos included
  document.getElementById("dl").onclick = async () => {
    try {
      const [css, tpl, js] = await Promise.all(["css/card.css", "js/templates.js", "js/card.js"].map((u) => fetch(u).then((r) => r.text())));
      const json = JSON.stringify(state).replace(/</g, "\\u003c");
      const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(state.bride || "").replace(/[<&]/g, "")} &amp; ${(state.groom || "").replace(/[<&]/g, "")}</title><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600&family=Great+Vibes&family=Jost:wght@300;400&display=swap" rel="stylesheet"><style>${css}</style></head><body><div id="app"></div><script>window.__CARD__=${json};<\/script><script>${tpl}<\/script><script>${js}<\/script><script>CardApp.mount(document.getElementById("app"));<\/script></body></html>`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
      a.download = `${(state.bride || "wedding").toLowerCase()}-${(state.groom || "card").toLowerCase()}.html`.replace(/[^a-z0-9.-]/g, "");
      a.click(); URL.revokeObjectURL(a.href);
    } catch (e) { flash("Download needs the site served over http (python3 -m http.server)"); }
  };

  renderEvents(); renderPhotos(); sync();
})();
