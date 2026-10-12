// Landing: ghost addresses behind the hero, a live name check, the constellation, the two-view list,
// the in-browser stealth demo, grouped assets and the token plate.
const $ = (s) => document.querySelector(s);
const CFG = window.CFG;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const hex = (n) => [...crypto.getRandomValues(new Uint8Array(n))].map((b) => b.toString(16).padStart(2, "0")).join("");
let S = null; // stealth.js, loaded when first needed
const stealth = async () => (S ||= await import("/stealth.js"));

// ghosts: a fixed set of slots; each address appears, holds, fades and comes back somewhere else
const box = $("#ghosts");
const slots = Array.from({ length: 18 }, () => { const s = document.createElement("span"); box.appendChild(s); return s; });
function place(s) { s.textContent = "0x" + hex(20); s.style.left = Math.random() * 80 + "%"; s.style.top = Math.random() * 92 + "%"; }
slots.forEach((s, i) => { place(s); if (reduce) s.classList.add("on"); else setTimeout(() => s.classList.add("on"), i * 400); });
if (!reduce) setInterval(() => { const s = slots[Math.floor(Math.random() * slots.length)]; s.classList.remove("on"); setTimeout(() => { place(s); s.classList.add("on"); }, 2600); }, 900);

// name check: read the registry straight from the chain
$("#claimForm").onsubmit = async (e) => {
  e.preventDefault();
  const n = $("#claimName").value.trim().toLowerCase().replace(/^@/, ""), st = $("#claimSt");
  if (!/^[a-z0-9_]{3,20}$/.test(n)) { st.className = "claimst bad"; st.textContent = "3-20 characters: a-z, 0-9, _"; return; }
  st.className = "claimst"; st.textContent = "checking @" + n + " on Robinhood Chain…";
  try {
    const m = await stealth(), W = m.makeChain(CFG);
    const dep = await fetch("/deployment.json").then((r) => r.json());
    const [owner] = await W.pub.readContract({ address: dep.stealthPay, abi: m.ABI, functionName: "lookup", args: [n] });
    if (/^0x0{40}$/i.test(owner)) { st.className = "claimst ok"; st.innerHTML = "@" + n + " is free · <a href=\"/app/?name=" + n + "#receive\">claim it now</a>"; }
    else { st.className = "claimst bad"; st.innerHTML = "@" + n + " is taken · <a href=\"/pay/" + n + "\">pay @" + n + "</a> or try another"; }
  } catch { st.className = "claimst bad"; st.textContent = "could not reach the chain, try again"; }
};

// constellation: one receiver, twenty payments; the world sees strangers, the key holder sees one inbox
const cv = $("#constel"), cg = cv.getContext("2d");
let view = "world", pts = [], CW = 0, CH = 0, born = 0;
function sizeC() {
  const dpr = Math.min(2, devicePixelRatio || 1); CW = cv.clientWidth; CH = cv.clientHeight;
  cv.width = CW * dpr; cv.height = CH * dpr; cg.setTransform(dpr, 0, 0, dpr, 0, 0);
  pts = Array.from({ length: 20 }, (_, i) => {
    const a = (i / 20) * Math.PI * 2 + Math.random() * 0.25, r = 0.28 + Math.random() * 0.17;
    return { x: CW / 2 + Math.cos(a) * r * CW, y: CH / 2 + 4 + Math.sin(a) * r * CH * 0.78, addr: "0x" + hex(2) + "…" + hex(2), t: i * 9, ph: Math.random() * 6 };
  });
}
let mix = 0, frame = 0;
function drawC() {
  frame++; born++;
  mix += ((view === "owner" ? 1 : 0) - mix) * 0.08;
  cg.clearRect(0, 0, CW, CH);
  const cx = CW / 2, cy = CH / 2 + 4;
  // owner view: lines from the inbox to each payment
  for (const p of pts) {
    if (born < p.t) continue;
    if (mix > 0.02) { cg.strokeStyle = `rgba(185,198,255,${0.32 * mix})`; cg.lineWidth = 1; cg.beginPath(); cg.moveTo(cx, cy); cg.lineTo(p.x, p.y); cg.stroke(); }
  }
  for (const p of pts) {
    if (born < p.t) continue;
    const k = Math.min(1, (born - p.t) / 30), tw = 0.6 + 0.4 * Math.sin(frame / 30 + p.ph);
    cg.fillStyle = `rgba(185,198,255,${0.1 * k})`; cg.beginPath(); cg.arc(p.x, p.y, 13, 0, 7); cg.fill();
    cg.fillStyle = mix > 0.5 ? `rgba(159,227,191,${k})` : `rgba(185,198,255,${k * tw})`; cg.beginPath(); cg.arc(p.x, p.y, 3.5, 0, 7); cg.fill();
    cg.fillStyle = `rgba(138,146,168,${0.8 * k})`; cg.font = "10.5px JetBrains Mono, monospace"; cg.textAlign = "center"; cg.fillText(p.addr, p.x, p.y + 22);
  }
  // the inbox itself only exists for the key holder
  if (mix > 0.02) {
    cg.fillStyle = `rgba(185,198,255,${0.14 * mix})`; cg.beginPath(); cg.arc(cx, cy, 34, 0, 7); cg.fill();
    cg.fillStyle = `rgba(237,240,247,${mix})`; cg.font = "500 13px JetBrains Mono, monospace"; cg.textAlign = "center"; cg.fillText("@you", cx, cy + 5);
  } else { cg.fillStyle = "rgba(84,92,115,.8)"; cg.font = "12px JetBrains Mono, monospace"; cg.textAlign = "center"; cg.fillText("?", cx, cy + 4); }
  const shown = pts.filter((p) => born >= p.t).length;
  $("#cLegend").innerHTML = view === "world" ? "<b>" + shown + "</b> addresses · <b>" + shown + "</b> different owners as far as anyone can tell" : "<b>" + shown + "</b> payments · <b>1</b> inbox · linked only by your viewing key";
  if (!reduce) requestAnimationFrame(drawC);
}
$("#cSeg").querySelectorAll("button").forEach((b) => (b.onclick = () => {
  view = b.dataset.v; $("#cSeg").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  $("#cTitle").textContent = view === "world" ? "Public explorer" : "Your inbox";
  if (reduce) drawC();
}));
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); sizeC(); if (reduce) born = 999; drawC(); } }, { rootMargin: "200px" }).observe(cv);
addEventListener("resize", () => { if (CW) sizeC(); });

// explorer / inbox switch on the same three rows
$("#vSeg").querySelectorAll("button").forEach((b) => (b.onclick = () => {
  const mine = b.dataset.v === "mine";
  $("#vSeg").querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  $("#views").classList.toggle("mine", mine);
  document.querySelectorAll("#views .o").forEach((o) => (o.textContent = mine ? o.dataset.mine : o.dataset.pub));
}));

// run the math: the app's own stealth code on demo keys for the typed name
let tryKeys = null, tryN = 0;
const cleanName = () => ($("#tryName").value.toLowerCase().replace(/[^a-z0-9_]/g, "") || "maya").slice(0, 20);
async function demoKeys(name) {
  const h = async (s) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
  const a = await h("ghost demo spend " + name), b = await h("ghost demo view " + name);
  return (await stealth()).keysFromSignature("0x" + [...a, ...b, 27].map((x) => x.toString(16).padStart(2, "0")).join(""));
}
async function tryReset() {
  tryKeys = await demoKeys(cleanName()); tryN = 0; $("#tryList").innerHTML = "";
  $("#tryMeta").textContent = "@" + cleanName() + " → st:rh:" + tryKeys.meta.slice(0, 26) + "…" + tryKeys.meta.slice(-8) + "  (demo keys)";
  for (let i = 0; i < 3; i++) tryPay();
}
function tryPay() {
  if (!tryKeys) return;
  const s = S.newStealth(tryKeys.meta), ok = !!S.claimKey(tryKeys, s.ephemeral, s.viewTag, s.address);
  const row = document.createElement("div"); row.className = "tryrow";
  row.innerHTML = '<span class="n">#' + ++tryN + '</span><span class="a">' + s.address + "<small>ephemeral " + s.ephemeral.slice(0, 18) + "… · view tag " + s.viewTag + '</small></span><span class="ok">' + (ok ? "✓ found by @" + cleanName() : "not found") + "</span>";
  $("#tryList").prepend(row);
  while ($("#tryList").children.length > 6) $("#tryList").lastChild.remove();
}
let tt; $("#tryName").addEventListener("input", () => { clearTimeout(tt); tt = setTimeout(tryReset, 300); });
$("#tryGo").onclick = tryPay;
new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { o.disconnect(); tryReset().catch(() => ($("#tryMeta").textContent = "could not load the crypto library, refresh")); } }, { rootMargin: "300px" }).observe($("#try"));

// assets in groups
const pill = (t) => '<span class="as"><img src="' + t.logo + '" alt="">' + t.symbol + "</span>";
const FUNDS = ["SPY", "QQQ", "GLD"], MONEY = ["ETH", "USDG"];
$("#gMoney").innerHTML = CFG.tokens.filter((t) => MONEY.includes(t.symbol)).map(pill).join("");
$("#gFunds").innerHTML = CFG.tokens.filter((t) => FUNDS.includes(t.symbol)).map(pill).join("");
$("#gStocks").innerHTML = CFG.tokens.filter((t) => !MONEY.includes(t.symbol) && !FUNDS.includes(t.symbol)).map(pill).join("");

fetch("/token.json", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((t) => {
  if (!t?.ca) return;
  $("#caBox").innerHTML = '<div class="ca" id="ca"><span>$' + t.ticker + " CA</span>" + t.ca + "</div>";
  $("#ca").onclick = () => { navigator.clipboard.writeText(t.ca); $("#ca").querySelector("span").textContent = "Copied"; };
  if (t.url) { $("#tokLink").textContent = "$" + t.ticker; $("#tokLink").href = t.url; }
}).catch(() => {});
