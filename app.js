const header = document.querySelector("[data-header]");
const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");

const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 12);
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  menuButton.querySelector(".sr-only").textContent = open ? "Open menu" : "Close menu";
  menu?.classList.toggle("open", !open);
});

menu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    const menuLabel = menuButton?.querySelector(".sr-only");
    if (menuLabel) menuLabel.textContent = "Open menu";
    menu?.classList.remove("open");
  });
});

const tabs = [...document.querySelectorAll("[data-install-tab]")];
const panels = [...document.querySelectorAll("[data-install-panel]")];

function selectTab(name, focus = false) {
  tabs.forEach((tab) => {
    const selected = tab.dataset.installTab === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus();
  });
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.installPanel !== name;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab.dataset.installTab));
  tab.addEventListener("keydown", (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    selectTab(tabs[next].dataset.installTab, true);
  });
});

const userAgent = navigator.userAgent.toLowerCase();
const isIOS = /iphone|ipad|ipod/.test(userAgent);
const isAndroid = /android/.test(userAgent);
const recommended = isIOS ? "ios" : isAndroid ? "android" : "web";
document.documentElement.dataset.recommended = recommended;

if (isIOS) {
  document.querySelectorAll("[data-smart-download]").forEach((link) => {
    link.href = "downloads/GameVault-iOS-unsigned.ipa";
  });
  document.querySelectorAll("[data-smart-download-label]").forEach((label) => {
    label.textContent = "Download for iPhone";
  });
} else if (!isAndroid) {
  document.querySelectorAll("[data-smart-download]").forEach((link) => {
    link.href = "https://gamevault-dp0.pages.dev";
    link.removeAttribute("download");
    link.target = "_blank";
    link.rel = "noreferrer";
  });
  document.querySelectorAll("[data-smart-download-label]").forEach((label) => {
    label.textContent = "Open the web app";
  });
}

const shots = [
  { src: "assets/screenshots/releases.png", alt: "Releases dashboard with Up Next covers, Playing games, and date changes", caption: "Releases — countdowns, Up Next, Playing, and date radar" },
  { src: "assets/screenshots/collection.png", alt: "Collection grouped by release month with folder and franchise navigation", caption: "Collection — folders, filters, grouping, and sorting" },
  { src: "assets/screenshots/settings.png", alt: "Settings for local mode, CSV import, platforms, stores, and optional cloud sync", caption: "Settings — phone-only mode, CSV import, platform order, and optional cloud" },
  { src: "assets/screenshots/mobile-releases.png", alt: "GameVault releases dashboard on a phone", caption: "Mobile releases — the full calendar in your pocket" },
  { src: "assets/screenshots/mobile-details.png", alt: "Game details and personal tracking on a phone", caption: "Mobile details — folder, platforms, tags, playthroughs, and hours" },
  { src: "assets/screenshots/mobile-trailers.png", alt: "Linked YouTube trailers and store buttons on a phone", caption: "Mobile trailers — video links, preferred stores, and franchise shortcuts" },
];

const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxCaption = document.querySelector("[data-lightbox-caption]");
let currentShot = 0;

function renderShot(index) {
  currentShot = (index + shots.length) % shots.length;
  const shot = shots[currentShot];
  lightboxImage.src = shot.src;
  lightboxImage.alt = shot.alt;
  lightboxCaption.textContent = shot.caption;
}

function openShot(index) {
  renderShot(index);
  if (typeof lightbox.showModal === "function") lightbox.showModal();
}

document.querySelectorAll("[data-shot]").forEach((button) => {
  button.addEventListener("click", () => openShot(Number(button.dataset.shot)));
});

document.querySelector("[data-lightbox-close]")?.addEventListener("click", () => lightbox.close());
document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => renderShot(currentShot - 1));
document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => renderShot(currentShot + 1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
lightbox?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") renderShot(currentShot - 1);
  if (event.key === "ArrowRight") renderShot(currentShot + 1);
});

const toast = document.querySelector("[data-toast]");
let toastTimer;
document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      toast.textContent = "Checksum copied";
    } catch {
      toast.textContent = "Copy failed — select the checksum from the README";
    }
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
  });
});

document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll(".reveal");
if (reducedMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((node) => node.classList.add("visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8%", threshold: 0.08 });
  reveals.forEach((node) => observer.observe(node));
}
