// L'estrazione: un V60 che filtra davvero. 2:30 di tempo reale, lo scorrimento lo accelera.
const DURATA = 150;
const FASI = [
  { fino: 35, nome: "Bloom", versa: [0, 8], goccia: 0.9 },
  { fino: 105, nome: "Versata", versa: [35, 100], goccia: 0.22 },
  { fino: 150, nome: "Drawdown", versa: null, goccia: 0.55 },
];
const NS = "http://www.w3.org/2000/svg";

export function avviaV60(root, alPronto) {
  const t$ = root.querySelector("[data-t]");
  const fase$ = root.querySelector("[data-fase]");
  const livello = root.querySelector(".v60__livello");
  const gocce = root.querySelector(".v60__gocce");
  const ridotto = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mostraLivello = (p) => {
    // la caraffa va da y=240 (vuota) a y=176 (piena)
    const y = 240 - 64 * p;
    livello.setAttribute("y", y.toFixed(2));
    return y;
  };
  const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  if (ridotto) {
    mostraLivello(1);
    t$.textContent = "2:30";
    fase$.textContent = "Pronto";
    root.classList.add("fatto");
    return;
  }

  const inizio = performance.now();
  let t = 0, bonus = 0, ultimo = inizio, prossima = 0, visibile = true, finito = false;
  const tempo = () => Math.min(DURATA, (performance.now() - inizio) / 1000 + bonus);
  const attive = [];

  new IntersectionObserver(([en]) => { visibile = en.isIntersecting; }).observe(root);

  let yScroll = scrollY;
  addEventListener("scroll", () => {
    const d = Math.abs(scrollY - yScroll); yScroll = scrollY;
    if (!finito) bonus += Math.min(d, 240) * 0.035;
  }, { passive: true });

  function goccia(yFine) {
    const c = document.createElementNS(NS, "ellipse");
    c.setAttribute("cx", 85); c.setAttribute("rx", 2.6); c.setAttribute("ry", 3.6);
    gocce.appendChild(c);
    attive.push({ el: c, y: 140, v: 30, fine: yFine });
  }

  function frame() {
    const adesso = performance.now();
    const dt = Math.min(Math.max((adesso - ultimo) / 1000, 0), 0.1); ultimo = adesso;
    if (!finito) t = tempo();
    const f = FASI.find((x) => t < x.fino) || FASI[2];
    const versa = !finito && f.versa && t >= f.versa[0] && t < f.versa[1];
    // la caraffa segue il caffè passato, con un ritardo morbido
    const p = Math.min(1, Math.max(0, (t - 12) / (DURATA - 12)));
    const yLiv = mostraLivello(1 - Math.pow(1 - p, 1.6));

    if (visibile) {
      root.classList.toggle("versa", versa);
      root.classList.toggle("bloom", t > 2 && t < 40);
      t$.textContent = fmt(t);
      fase$.textContent = finito ? "Pronto" : f.nome;
      if (!finito && adesso / 1000 > prossima) {
        goccia(yLiv);
        prossima = adesso / 1000 + f.goccia * (0.7 + Math.random() * 0.6);
      }
      for (let i = attive.length - 1; i >= 0; i--) {
        const g = attive[i];
        g.v += 420 * dt; g.y += g.v * dt;
        if (g.y >= g.fine) { g.el.remove(); attive.splice(i, 1); continue; }
        g.el.setAttribute("cy", g.y.toFixed(1));
      }
    }
    if (!finito && t >= DURATA) {
      finito = true;
      root.classList.remove("versa", "bloom");
      root.classList.add("fatto");
      fase$.textContent = "Pronto";
      alPronto && alPronto();
    }
    if (!finito || attive.length) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
