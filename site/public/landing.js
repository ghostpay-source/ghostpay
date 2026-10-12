// Landing: one-time addresses surface and fade behind the headline (they are random, like the real ones),
// the link demo, the asset list, totals and the token plate.
const $ = (s) => document.querySelector(s);
const CFG = window.CFG;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");

// ghosts: a fixed set of slots, each address appears, holds, fades, and comes back somewhere else
const box = $("#ghosts");
const slots = Array.from({ length: 16 }, () => { const s = document.createElement("span"); box.appendChild(s); return s; });
function place(s) {
  s.textContent = "0x" + hex(20);
  s.style.left = Math.random() * 78 + "%";
  s.style.top = Math.random() * 88 + "%";
  s.style.fontSize = 11 + Math.random() * 5 + "px";
}
slots.forEach((s, i) => { place(s); if (reduce) s.classList.add("on"); else setTimeout(() => s.classList.add("on"), i * 500); });
if (!reduce) setInterval(() => {
  const s = slots[Math.floor(Math.random() * slots.length)];
  s.classList.remove("on");
  setTimeout(() => { place(s); s.classList.add("on"); }, 2600);
}, 900);

// demo: type a name, each payment gets its own address
const names = ["maya", "studio_k", "devfund", "alice"];
let ni = 0;
async function demo() {
  const n = names[ni++ % names.length], el = $("#demoName");
  el.textContent = "";
  for (const c of n) { el.textContent += c; await new Promise((r) => setTimeout(r, 110)); }
  const rows = [...document.querySelectorAll("#demoAddrs li")];
  for (const r of rows) { await new Promise((ok) => setTimeout(ok, 800)); const a = hex(20); r.lastChild.textContent = "0x" + a.slice(0, 6) + "…" + a.slice(-4); r.classList.add("new"); }
  await new Promise((r) => setTimeout(r, 2600));
  rows.forEach((r) => { r.classList.remove("new"); r.lastChild.textContent = "waiting"; });
  demo();
}
demo();

$("#cloud").innerHTML = CFG.tokens.map((t) => '<span class="as"><img src="' + t.logo + '" alt="">' + t.symbol + "</span>").join("") + "<small>ETH and USDG plus the Stock Tokens of Robinhood Chain.</small>";

fetch("/token.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((t) => {
  if (!t?.ca) return;
  $("#caBox").innerHTML = '<div class="ca" id="ca"><span>$' + t.ticker + " CA</span>" + t.ca + "</div>";
  $("#ca").onclick = () => { navigator.clipboard.writeText(t.ca); $("#ca").querySelector("span").textContent = "Copied"; };
  if (t.url) { $("#tokLink").textContent = "$" + t.ticker; $("#tokLink").href = t.url; }
}).catch(() => {});

// ---------- "see where the money lands": six payers, one receiver, two outcomes ----------
const reduceMotion2 = matchMedia("(prefers-reduced-motion: reduce)").matches;
function vizSetup(cv) {
  const dpr = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
  cv.width = w * dpr; cv.height = h * dpr;
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { g, w, h };
}
const payers = Array.from({ length: 6 }, (_, i) => i);
function viz() {
  const A = vizSetup($("#vizA")), B = vizSetup($("#vizB"));
  const py = (h, i) => 40 + (i * (h - 80)) / 5, px = 46;
  // Murk: one-time addresses scattered over the right side
  const spots = [], flights = [];
  let t = 0, nextPay = 0, made = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  function payer(g, x, y) { g.fillStyle = "#1f1f23"; g.strokeStyle = "#323238"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); g.stroke(); }
  function frame() {
    t++;
    if (t >= nextPay) {
      const i = Math.floor(Math.random() * 6);
      const spot = { x: rnd(B.w * 0.55, B.w - 30), y: rnd(30, B.h - 30), born: 0, i };
      flights.push({ i, p: 0, spot });
      nextPay = t + 38;
    }
    for (const C of [A, B]) { C.g.clearRect(0, 0, C.w, C.h); }
    // normal: every payment line ends at the same wallet
    const rx = A.w - 60, ry = A.h / 2;
    A.g.strokeStyle = "rgba(240,138,122,.28)"; A.g.lineWidth = 1;
    for (const i of payers) { A.g.beginPath(); A.g.moveTo(px, py(A.h, i)); A.g.bezierCurveTo(A.w * 0.5, py(A.h, i), A.w * 0.55, ry, rx, ry); A.g.stroke(); payer(A.g, px, py(A.h, i)); }
    const pulse = 0.5 + 0.5 * Math.sin(t / 14);
    A.g.fillStyle = `rgba(240,138,122,${0.12 + 0.12 * pulse})`; A.g.beginPath(); A.g.arc(rx, ry, 30 + 6 * pulse, 0, 7); A.g.fill();
    A.g.fillStyle = "#f08a7a"; A.g.beginPath(); A.g.arc(rx, ry, 11, 0, 7); A.g.fill();
    A.g.fillStyle = "#8d8d96"; A.g.font = "11px Geist Mono, monospace"; A.g.textAlign = "center"; A.g.fillText("your wallet", rx, ry + 34);
    // murk: payers, then a fresh dot per payment, no shared endpoint
    for (const i of payers) payer(B.g, px, py(B.h, i));
    for (const s of spots) {
      s.born = Math.min(1, s.born + 0.04);
      B.g.fillStyle = `rgba(127,212,160,${0.12 * s.born})`; B.g.beginPath(); B.g.arc(s.x, s.y, 12, 0, 7); B.g.fill();
      B.g.fillStyle = `rgba(127,212,160,${0.85 * s.born})`; B.g.beginPath(); B.g.arc(s.x, s.y, 4, 0, 7); B.g.fill();
    }
    for (const f of flights) {
      f.p = Math.min(1, f.p + 0.022);
      const e = f.p < 0.5 ? 2 * f.p * f.p : 1 - (-2 * f.p + 2) ** 2 / 2;
      // the same payment travels on both canvases
      const ay = py(A.h, f.i), by = py(B.h, f.i);
      const ax = px + (rx - px) * e, ay2 = ay + (ry - ay) * e;
      A.g.fillStyle = "#b9c6ff"; A.g.beginPath(); A.g.arc(ax, ay2, 3.5, 0, 7); A.g.fill();
      const bx = px + (f.spot.x - px) * e, by2 = by + (f.spot.y - by) * e;
      B.g.fillStyle = "#b9c6ff"; B.g.beginPath(); B.g.arc(bx, by2, 3.5, 0, 7); B.g.fill();
      if (f.p === 1 && !f.done) { f.done = true; spots.push(f.spot); made++; if (spots.length > 26) spots.shift(); $("#vizBn").textContent = made + " one-time address" + (made > 1 ? "es" : "") + " · none linked"; }
    }
    for (let k = flights.length - 1; k >= 0; k--) if (flights[k].done) flights.splice(k, 1);
    if (!reduceMotion2) requestAnimationFrame(frame);
  }
  frame();
}
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); viz(); } }, { rootMargin: "200px" }).observe($("#see"));

// ---------- try the math: the app's own stealth code, run on demo keys for the typed handle ----------
let S2 = null;
async function demoKeys(name) {
  const h = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const a = await h("ghost demo spend " + name), b = await h("ghost demo view " + name);
  const sig = "0x" + [...a, ...b, 27].map((x) => x.toString(16).padStart(2, "0")).join("");
  return S2.keysFromSignature(sig);
}
let tryN = 0, tryKeys = null;
async function tryReset() {
  S2 ||= await import("/stealth.js");
  const name = ($("#tryName").value.toLowerCase().replace(/[^a-z0-9_]/g, "") || "maya").slice(0, 20);
  tryKeys = await demoKeys(name); tryN = 0; $("#tryList").innerHTML = "";
  $("#tryMeta").textContent = "@" + name + " → st:rh:" + tryKeys.meta.slice(0, 26) + "…" + tryKeys.meta.slice(-8) + "  (demo keys)";
  for (let i = 0; i < 3; i++) tryPay();
}
function tryPay() {
  if (!tryKeys) return;
  const s = S2.newStealth(tryKeys.meta);
  const ok = !!S2.claimKey(tryKeys, s.ephemeral, s.viewTag, s.address);
  const row = document.createElement("div"); row.className = "tryrow";
  row.innerHTML = '<span class="n">#' + ++tryN + '</span><span class="a">' + s.address + "<small>ephemeral " + s.ephemeral.slice(0, 18) + "… · view tag " + s.viewTag + '</small></span><span class="ok">' + (ok ? "found by @" + $("#tryName").value.toLowerCase().replace(/[^a-z0-9_]/g, "") + "'s key" : "not found") + "</span>";
  $("#tryList").prepend(row);
  while ($("#tryList").children.length > 6) $("#tryList").lastChild.remove();
}
let tt; $("#tryName").addEventListener("input", () => { clearTimeout(tt); tt = setTimeout(tryReset, 300); });
$("#tryGo").onclick = tryPay;
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); tryReset().catch(() => ($("#tryMeta").textContent = "could not load the crypto library, refresh")); } }, { rootMargin: "300px" }).observe($("#try"));
