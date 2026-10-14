const root = document.documentElement;
const header = document.getElementById('siteHeader');
const nav = document.getElementById('mainNav');
const navToggle = document.getElementById('navToggle');
const toast = document.getElementById('toast');
const year = document.getElementById('year');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const mobileLayout = window.matchMedia('(max-width: 880px)');

if (year) year.textContent = new Date().getFullYear();

requestAnimationFrame(() => root.classList.add('loaded'));

const colorScenes = [...document.querySelectorAll('[data-color-scene]')];
if ('IntersectionObserver' in window && colorScenes.length) {
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const scene = entry.target;
      scene.classList.remove('is-entering');
      requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.add('is-entering')));
    });
  }, { rootMargin: '-8% 0px -18% 0px', threshold: .04 });
  colorScenes.forEach((scene) => {
    const veil = scene.querySelector('.scene-breath');
    veil?.addEventListener('animationend', (event) => {
      if (event.animationName === 'sceneBreathIn') scene.classList.remove('is-entering');
    });
    sceneObserver.observe(scene);
  });
}

function setMenu(open) {
  if (!nav || !navToggle) return;
  nav.classList.toggle('is-open', open);
  document.body.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
}

if (navToggle && nav) {
  navToggle.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });
  document.addEventListener('click', (event) => {
    if (navToggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) setMenu(false);
  });
  mobileLayout.addEventListener('change', () => setMenu(false));
}

function updateHeader() {
  if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
}
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const navLinks = [...document.querySelectorAll('.main-nav a[href^="#"]')];
const navBySection = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));
const observedSections = [...document.querySelectorAll('main section[id]')].filter((section) => navBySection.has(section.id));

function scrollPageTo(destination, duration = 820) {
  const target = Math.max(0, destination);
  if (reduceMotion.matches) {
    window.scrollTo(0, target);
    return;
  }
  const start = window.scrollY;
  const distance = target - start;
  const startedAt = performance.now();
  const ease = (progress) => progress < .5 ? 4 * progress ** 3 : 1 - ((-2 * progress + 2) ** 3) / 2;
  function step(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    window.scrollTo(0, start + distance * ease(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function documentTop(element) {
  return window.scrollY + element.getBoundingClientRect().top;
}

function replaceHash(hash) {
  try {
    history.replaceState(null, '', hash);
  } catch (error) {
    // 本地 file:// 预览可能限制 History API；跳转本身仍应继续工作。
  }
}

[...navLinks, document.querySelector('.brand'), document.querySelector('.hero-actions a[href^="#"]'), document.querySelector('.text-link')].filter(Boolean).forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    const destination = target.id === 'solutions' ? documentTop(target) + 2 : documentTop(target) - (header?.offsetHeight || 0);
    replaceHash(link.getAttribute('href'));
    scrollPageTo(destination);
  });
});

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => link.classList.toggle('is-active', link === navBySection.get(visible.target.id)));
  }, { rootMargin: '-34% 0px -58% 0px', threshold: [0, .05, .3] });
  observedSections.forEach((section) => sectionObserver.observe(section));
}

let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch (error) {
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
  showToast(`微信号 ${value} 已复制`);
}

document.querySelectorAll('.copy-wechat').forEach((button) => {
  button.addEventListener('click', () => copyText(button.dataset.copy || '18560579185'));
});

const solutionSection = document.getElementById('solutions');
const solutionStage = document.querySelector('.solution-stage');
const solutionTabs = [...document.querySelectorAll('[data-solution]')];
const solutionPanels = [...document.querySelectorAll('[data-solution-panel]')];
const solutionCount = document.querySelector('.solution-count b');
let activeSolution = 0;
let stageTimer;

function activateSolution(index) {
  const next = Math.max(0, Math.min(solutionPanels.length - 1, Number(index)));
  if (!Number.isFinite(next) || next === activeSolution && solutionPanels[next]?.classList.contains('is-active')) return;
  activeSolution = next;
  solutionTabs.forEach((tab, tabIndex) => {
    const active = tabIndex === next;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.setAttribute('tabindex', active ? '0' : '-1');
  });
  solutionPanels.forEach((panel, panelIndex) => {
    panel.classList.toggle('is-active', panelIndex === next);
    panel.setAttribute('aria-hidden', String(!mobileLayout.matches && panelIndex !== next));
  });
  if (solutionCount) solutionCount.textContent = String(next + 1).padStart(2, '0');
  if (solutionStage && !reduceMotion.matches) {
    solutionStage.classList.add('is-changing');
    window.clearTimeout(stageTimer);
    stageTimer = window.setTimeout(() => solutionStage.classList.remove('is-changing'), 520);
  }
}

solutionTabs.forEach((tab, index) => {
  tab.setAttribute('aria-selected', String(index === 0));
  tab.addEventListener('click', () => {
    activateSolution(index);
    if (solutionSection && !mobileLayout.matches) scrollPageTo(documentTop(solutionSection) + 2, 360);
  });
  tab.addEventListener('keydown', (event) => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    let next = index;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = solutionTabs.length - 1;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % solutionTabs.length;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + solutionTabs.length) % solutionTabs.length;
    activateSolution(next);
    solutionTabs[next]?.focus();
  });
});

function syncSolutionAccessibility() {
  solutionPanels.forEach((panel, index) => panel.setAttribute('aria-hidden', String(!mobileLayout.matches && index !== activeSolution)));
}
syncSolutionAccessibility();
mobileLayout.addEventListener('change', syncSolutionAccessibility);

document.querySelectorAll('a[href^="#solution-"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (mobileLayout.matches) return;
    const panel = document.querySelector(link.getAttribute('href'));
    if (!panel || !solutionSection) return;
    event.preventDefault();
    const index = Number(panel.dataset.solutionPanel);
    activateSolution(index);
    replaceHash(link.getAttribute('href'));
    scrollPageTo(documentTop(solutionSection) + 2);
  });
});

if (!mobileLayout.matches && window.location.hash.startsWith('#solution-')) {
  const initialPanel = document.querySelector(window.location.hash);
  if (initialPanel?.matches('[data-solution-panel]')) activateSolution(initialPanel.dataset.solutionPanel);
}

function openTargetProduct(hash) {
  if (!hash || !hash.startsWith('#product-')) return;
  const target = document.querySelector(hash);
  if (target?.matches('details')) target.open = true;
}

document.querySelectorAll('a[href^="#product-"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    openTargetProduct(hash);
    replaceHash(hash);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const destination = documentTop(target) - (header?.offsetHeight || 0) - 16;
      scrollPageTo(destination);
      target.querySelector('summary')?.focus({ preventScroll: true });
    }));
  });
});
openTargetProduct(window.location.hash);

document.querySelectorAll('.product-item').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.product-item[open]').forEach((other) => {
      if (other !== item) other.open = false;
    });
  });
});
