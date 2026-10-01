import { avviaV60 } from "./v60.js";

const $ = (s, r = document) => r.querySelector(s);
const STATICO = /statico/.test(location.search); // solo per i controlli: tutto visibile subito
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* testata che si stacca allo scorrimento */
const top = $(".top");
addEventListener("scroll", () => top.classList.toggle("is-scroll", scrollY > 8), { passive: true });

/* aperto ora? martedì-domenica 7:30-20:00, ora di Roma */
function oraRoma() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  const g = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { g, m: (+p.hour % 24) * 60 + +p.minute };
}
function stato() {
  const { g, m } = oraRoma();
  const apre = 450, chiude = 1200;
  if (g !== 1 && m >= apre && m < chiude) return { aperto: true, testo: "Aperto ora · fino alle 20:00" };
  if (g !== 1 && m < apre) return { aperto: false, testo: "Chiuso ora · apre oggi alle 7:30" };
  const domani = (g + 1) % 7;
  if (domani === 1) return { aperto: false, testo: "Chiuso ora · riapre martedì alle 7:30" };
  if (g === 1) return { aperto: false, testo: "Chiuso il lunedì · riapre domani alle 7:30" };
  return { aperto: false, testo: "Chiuso ora · riapre domani alle 7:30" };
}
const st = stato();
$$("[data-stato]").forEach((el) => {
  el.classList.toggle("is-aperto", st.aperto);
  el.lastChild.textContent = st.testo;
});
const oggi = oraRoma().g;
$$(".orari tr").forEach((tr) => { if (+tr.dataset.g === (oggi + 6) % 7) tr.classList.add("oggi"); });

/* ingressi: le foto si scoprono dall'angolo, le tessere girano, i titoli salgono */
const daRivelare = [...$$(".quarto"), ...$$(".tessere"), ...$$(".testa"), ...$$(".cartellini"), ...$$(".caro--caffe")];
$$(".cartellini li").forEach((li, k) => li.style.setProperty("--k", k));
if (STATICO) {
  document.querySelectorAll("img").forEach((i) => (i.loading = "eager"));
  daRivelare.forEach((el) => el.classList.add("in"));
} else if ("IntersectionObserver" in window) {
  daRivelare.forEach((el) => { if (!el.closest(".hero")) el.classList.add("rivela"); });
  $$(".hero .tessere").forEach((el) => el.classList.add("in"));
  const io = new IntersectionObserver((voci) => voci.forEach((v) => {
    if (v.isIntersecting) { v.target.classList.add("in"); io.unobserve(v.target); }
  }), { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
  daRivelare.forEach((el) => io.observe(el));
}

/* caroselli: frecce, trascinamento col mouse, tastiera */
$$("[data-caro]").forEach((c) => {
  const pista = $(".caro__pista", c), prev = $("[data-prev]", c), next = $("[data-next]", c);
  const passo = () => (pista.firstElementChild?.getBoundingClientRect().width || 300) + 16;
  const agg = () => {
    prev.disabled = pista.scrollLeft < 4;
    next.disabled = pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 4;
  };
  prev.addEventListener("click", () => pista.scrollBy({ left: -passo(), behavior: "smooth" }));
  next.addEventListener("click", () => pista.scrollBy({ left: passo(), behavior: "smooth" }));
  pista.addEventListener("scroll", agg, { passive: true });
  pista.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); pista.scrollBy({ left: passo(), behavior: "smooth" }); }
    if (e.key === "ArrowLeft") { e.preventDefault(); pista.scrollBy({ left: -passo(), behavior: "smooth" }); }
  });
  let x0 = 0, s0 = 0, giu = false, mosso = false;
  pista.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    giu = true; mosso = false; x0 = e.clientX; s0 = pista.scrollLeft;
  });
  addEventListener("pointermove", (e) => {
    if (!giu) return;
    if (Math.abs(e.clientX - x0) > 4) { mosso = true; pista.classList.add("is-drag"); }
    pista.scrollLeft = s0 - (e.clientX - x0);
  });
  addEventListener("pointerup", () => {
    if (!giu) return; giu = false;
    if (mosso) {
      pista.classList.remove("is-drag");
      const i = Math.round(pista.scrollLeft / passo());
      pista.scrollTo({ left: i * passo(), behavior: "smooth" });
    }
  });
  agg(); addEventListener("resize", agg);
});

/* estrazione V60 + avviso «filtro pronto» */
const pronto = $("[data-pronto]");
const v60 = $("[data-v60]");
if (v60) {
  avviaV60(v60, () => {
    if (!pronto) return;
    pronto.hidden = false;
    setTimeout(() => (pronto.hidden = true), 9000);
  });
}
pronto && $("[data-chiudi]", pronto).addEventListener("click", () => (pronto.hidden = true));

/* menù: filtri dieta + sezione corrente */
const menu = $("[data-menu]");
if (menu) {
  const bott = $$("[data-filtri] [data-f]");
  const vuoto = $("[data-vuoto]");
  bott.forEach((b) => b.addEventListener("click", () => {
    bott.forEach((x) => x.setAttribute("aria-pressed", x === b));
    const f = b.dataset.f;
    let n = 0;
    $$(".voce", menu).forEach((v) => { const ok = f === "tutto" || v.dataset[f] === "1"; v.hidden = !ok; n += ok; });
    $$(".msez", menu).forEach((s) => { s.hidden = !$$(".voce:not([hidden])", s).length; });
    vuoto.hidden = n > 0;
  }));
  const link = $$(".filtri__sez a");
  const io = new IntersectionObserver((voci) => voci.forEach((v) => {
    if (!v.isIntersecting) return;
    link.forEach((a) => {
      const qui = a.hash === "#" + v.target.id;
      a.classList.toggle("is-qui", qui);
      if (qui) a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$(".msez", menu).forEach((s) => io.observe(s));
}

/* modulo contatti → WhatsApp */
const mod = $("[data-modulo]");
if (mod) {
  mod.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = mod.nome.value.trim();
    const err = $("[data-err]", mod);
    if (!nome) { mod.nome.setAttribute("aria-invalid", "true"); err.hidden = false; mod.nome.focus(); return; }
    mod.nome.removeAttribute("aria-invalid"); err.hidden = true;
    let giorno = "";
    if (mod.giorno.value) {
      const d = new Date(mod.giorno.value + "T12:00");
      giorno = `\nGiorno: ${d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}`;
    }
    const msg = `Ciao Roberto, sono ${nome}.\n${mod.motivo.value}${giorno}${mod.messaggio.value.trim() ? "\n" + mod.messaggio.value.trim() : ""}`;
    window.open("https://wa.me/393403539341?text=" + encodeURIComponent(msg), "_blank", "noopener");
  });
}
