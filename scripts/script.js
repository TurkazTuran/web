const pages = [
  {
    title: "Namaz Vakti",
    href: "namaz.html",
    desc: "Namaz vaxtları və məlumat",
    icon: "moon",
    colors: ["#0f172a", "#1d4ed8"],
  },
  {
    title: "Quran",
    href: "quran/quran.html",
    desc: "Quran-i Kərim",
    icon: "quran",
    colors: ["#0f172a", "#1d4ed8"],
  },
  {
    title: "Aylıq Xərclər",
    href: "masraflar.html",
    desc: "Aylıq xərclər kalkulyatoru",
    icon: "calc",
    colors: ["#111827", "#0f766e"],
  },
  {
    title: "Valyuta Kursu",
    href: "currency.html",
    desc: "Kurslar və çevirici",
    icon: "money",
    colors: ["#0f172a", "#7c3aed"],
  },
];

function iconSVG(kind) {
  switch (kind) {
    case "calc":
      return `
      <img src="images/calc.svg" width="100%" height="100%" alt="calc" decoding="async" />
    `;
    case "money":
      return `
      <img src="images/money.svg" width="100%" height="100%" alt="money" decoding="async" />
    `;
    case "moon":
      return `
      <img src="images/moon.svg" width="100%" height="100%" alt="moon" decoding="async" />
    `;
    case "quran":
      return `
      <img src="images/quran.png" width="100%" height="100%" alt="Quran" decoding="async" />
    `;
    default:
      return ``;
  }
}

const list = document.getElementById("cards");
const empty = document.getElementById("empty");

function cardHTML(p) {
  return `
  <article class="card" role="listitem">
    <a class="head" href="${p.href}" aria-label="${p.title}">
      <div class="icon" aria-hidden="true">${iconSVG(p.icon)}</div>
      <div class="meta">
        <div class="title">${p.title}</div>
        <div class="desc">${p.desc || ""}</div>
      </div>
      <div class="arrow" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <defs>
            <linearGradient
              id="cardArrowGradient"
              x1="5"
              y1="5"
              x2="21"
              y2="19"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stop-color="#6ee7ff" />
              <stop offset="50%" stop-color="#7c5cff" />
              <stop offset="100%" stop-color="#22d3ee" />
            </linearGradient>
          </defs>
          <path d="M5 12h14M13 5l7 7-7 7" stroke="url(#cardArrowGradient)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </a>
  </article>
`;
}

function render(items) {
  list.innerHTML = "";
  if (!items.length) {
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";
  items.forEach((p, i) => {
    const container = document.createElement("div");
    container.innerHTML = cardHTML(p);
    const el = container.firstElementChild;
    el.style.animation =
      "fadeInUp 500ms cubic-bezier(.2,.8,.2,1) forwards";
    el.style.opacity = "0";
    el.style.animationDelay = 70 * i + "ms";
    list.appendChild(el);
  });
}

// Initial render
render(pages);

// Search
const search = document.getElementById("searchInput");
search.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      p.href.toLowerCase().includes(q)
  );
  render(filtered);
});
