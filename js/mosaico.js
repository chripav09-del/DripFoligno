// Il fronte del bancone di Drip, ricostruito: fondo prugna, quarti e mezzi cerchi che attraversano le tessere,
// fagioli, pallini e il filetto curvo del chicco. Si compone all'apertura, gira scorrendo e sotto il dito.
const NS = "http://www.w3.org/2000/svg";
const C = {
  fondo: "hsl(339 30% 15%)",
  prugna: "hsl(339 26% 21%)",
  vino: "hsl(345 52% 28%)",
  cremisi: "hsl(350 66% 46%)",
  corallo: "hsl(4 70% 62%)",
  pesca: "hsl(20 70% 70%)",
  sabbia: "hsl(27 72% 80%)",
  marrone: "hsl(8 38% 32%)",
};
const CHIARI = ["pesca", "sabbia", "corallo"];
const SCURI = ["vino", "cremisi", "marrone", "prugna"];

// generatore deterministico: il bancone è sempre lo stesso
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const U = 100; // lato tessera in unità SVG
const forme = {
  // quarto di cerchio con il perno nell'angolo in alto a sinistra, raggio = lato
  quarto: (n) => `M0 0H${n * U}A${n * U} ${n * U} 0 0 1 0 ${n * U}Z`,
  mezzo: (n) => `M0 ${n * U}A${(n * U) / 2} ${(n * U) / 2} 0 0 1 ${n * U} ${n * U}Z`,
  fagiolo: (n) => `M0 ${n * U}V${(n * U) / 2}A${(n * U) / 2} ${(n * U) / 2} 0 0 1 ${(n * U) / 2} 0H${n * U}V${(n * U) / 2}A${(n * U) / 2} ${(n * U) / 2} 0 0 1 ${(n * U) / 2} ${n * U}Z`,
  cerchio: (n) => `M${(n * U) / 2} ${n * U * 0.08}a${n * U * 0.42} ${n * U * 0.42} 0 1 0 .01 0Z`,
  triangolo: (n) => `M0 ${n * U}L${n * U} 0V${n * U}Z`,
  goccia: (n) => `M0 0H${n * U * 0.5}A${n * U * 0.5} ${n * U * 0.5} 0 0 1 ${n * U} ${n * U * 0.5}V${n * U}H${n * U * 0.5}A${n * U * 0.5} ${n * U * 0.5} 0 0 1 0 ${n * U * 0.5}Z`,
};
const NOMI = ["quarto", "quarto", "mezzo", "fagiolo", "cerchio", "triangolo", "goccia", "quarto"];

export function mosaico(el) {
  const cols = +el.dataset.cols, rows = +el.dataset.rows;
  const seed = +(el.dataset.seme || 7);
  const buco = (el.dataset.foto || "").split(",").map(Number); // c,r,w,h lasciati alla foto
  const r = rng(seed);
  const libero = Array.from({ length: rows }, (_, y) => Array.from({ length: cols }, (_, x) =>
    !(buco.length === 4 && x >= buco[0] && x < buco[0] + buco[2] && y >= buco[1] && y < buco[1] + buco[3])));

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${cols * U} ${rows * U}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = `<rect width="${cols * U}" height="${rows * U}" fill="${C.fondo}"/>`;
  const pezzi = [];
  const scegli = (lista) => lista[Math.floor(r() * lista.length)];
  let ultimoColore = "";

  function posa(x, y, n) {
    for (let j = y; j < y + n; j++) for (let i = x; i < x + n; i++) libero[j][i] = false;
    const g = document.createElementNS(NS, "g");
    g.setAttribute("transform", `translate(${x * U} ${y * U})`);
    // fondo della tessera: a volte un altro scuro, come sul bancone
    if (r() < 0.35) {
      const f = document.createElementNS(NS, "rect");
      f.setAttribute("width", n * U); f.setAttribute("height", n * U);
      f.setAttribute("fill", C[scegli(["prugna", "vino", "marrone"])]);
      g.appendChild(f);
    }
    const forma = scegli(NOMI);
    let col; do { col = r() < 0.6 ? scegli(CHIARI) : scegli(SCURI); } while (col === ultimoColore);
    ultimoColore = col;
    const giro = Math.floor(r() * 4) * 90;
    const p = document.createElementNS(NS, "g");
    p.setAttribute("class", "pezzo");
    p.style.setProperty("--g", giro + "deg");
    p.style.setProperty("--c", `${(n * U) / 2}px ${(n * U) / 2}px`);
    const box = document.createElementNS(NS, "rect"); // tiene il perno al centro della tessera
    box.setAttribute("width", n * U); box.setAttribute("height", n * U); box.setAttribute("fill", "none");
    p.appendChild(box);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", forme[forma](n));
    path.setAttribute("fill", C[col]);
    p.appendChild(path);
    // filetto curvo del chicco sulle forme chiare grandi
    if (n > 1 && CHIARI.includes(col) && r() < 0.6) {
      const l = document.createElementNS(NS, "path");
      l.setAttribute("d", `M${n * U * 0.15} ${n * U * 0.85}C${n * U * 0.35} ${n * U * 0.35} ${n * U * 0.65} ${n * U * 0.95} ${n * U * 0.85} ${n * U * 0.2}`);
      l.setAttribute("fill", "none"); l.setAttribute("stroke", C.corallo); l.setAttribute("stroke-width", "2");
      p.appendChild(l);
    }
    g.appendChild(p);
    // pallino scuro, come i bottoni del bancone
    if (r() < 0.22) {
      const d = document.createElementNS(NS, "circle");
      d.setAttribute("cx", (n * U) * (0.25 + r() * 0.5)); d.setAttribute("cy", (n * U) * (0.25 + r() * 0.5));
      d.setAttribute("r", 9); d.setAttribute("fill", C.prugna); d.setAttribute("class", "pallino");
      g.appendChild(d);
    }
    svg.appendChild(g);
    pezzi.push({ p, n, x: x + n / 2, y: y + n / 2, giro, gira: forma !== "cerchio" });
  }

  // prima le forme grandi 2x2, poi riempio il resto
  for (let k = 0; rows > 1 && cols > 1 && k < Math.floor((cols * rows) / 3); k++) {
    const x = Math.floor(r() * (cols - 1)), y = Math.floor(r() * (rows - 1));
    if (libero[y][x] && libero[y][x + 1] && libero[y + 1][x] && libero[y + 1][x + 1]) posa(x, y, 2);
  }
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (libero[y][x]) {
    if (r() < 0.04) { libero[y][x] = false; continue; } // qualche tessera resta vuota, prugna
    posa(x, y, 1);
  }
  el.prepend(svg);

  const fermo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (fermo) { el.classList.add("pronto"); return; }

  // composizione: le tessere entrano a onda dal centro della foto (o dall'angolo)
  const cx = buco.length === 4 ? buco[0] + buco[2] / 2 : 0, cy = buco.length === 4 ? buco[1] + buco[3] / 2 : 0;
  pezzi.forEach((t) => t.p.style.setProperty("--d", (Math.hypot(t.x - cx, t.y - cy) * 70 + r() * 90).toFixed(0) + "ms"));
  let avviato = false;
  const avvia = () => { if (avviato) return; avviato = true; requestAnimationFrame(() => {
    el.classList.add("pronto");
    setTimeout(() => el.classList.add("vivo"), 2600); // finita la posa, le rotazioni rispondono subito
  }); };
  setTimeout(avvia, 2000); // sicurezza: la foto non resta mai nascosta
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(([v]) => { if (v.isIntersecting) { avvia(); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
  } else avvia();

  // scorrendo, le tessere girano di un quarto, poche alla volta, come un meccanismo
  const giranti = pezzi.filter((t) => t.gira);
  let passo = -1;
  const suScroll = () => {
    const b = el.getBoundingClientRect();
    if (b.bottom < 0 || b.top > innerHeight) return;
    const s = Math.floor((innerHeight - b.top) / 70);
    if (s === passo) return; passo = s;
    giranti.forEach((t, i) => {
      if ((i * 5 + s) % 9 === 0) { t.giro += 90; t.p.style.setProperty("--g", t.giro + "deg"); }
    });
  };
  addEventListener("scroll", suScroll, { passive: true });

  // col mouse o col dito: la tessera sotto gira di un quarto
  el.addEventListener("pointermove", (e) => {
    const b = svg.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * cols, y = ((e.clientY - b.top) / b.height) * rows;
    const t = giranti.find((q) => Math.abs(q.x - x) < q.n / 2 && Math.abs(q.y - y) < q.n / 2);
    if (t && t !== el._ultimo) { el._ultimo = t; t.giro += 90; t.p.style.setProperty("--g", t.giro + "deg"); }
  });
}
