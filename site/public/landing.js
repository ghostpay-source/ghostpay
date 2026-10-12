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
