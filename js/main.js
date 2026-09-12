const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointerQuery = window.matchMedia('(pointer: fine)');
let reduceMotion = motionQuery.matches;
let motionPaused = false;

const root = document.documentElement;
const header = document.getElementById('siteHeader');
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
const progressEl = document.getElementById('scrollProgress');
const toTopEl = document.getElementById('toTop');
const yearEl = document.getElementById('year');
const hero = document.getElementById('home');
const heroMotion = document.getElementById('heroMotion');
const heroCard = document.querySelector('.hero-card');
const applicationSection = document.getElementById('applications');
const applicationMotion = document.getElementById('applicationMotion');
const applicationItems = [...document.querySelectorAll('.section-app .app-item')];
const storyProgress = document.querySelector('.story-progress');
const motionToggle = document.getElementById('motionToggle');
const sceneBridges = [...document.querySelectorAll('.scene-bridge')];

if (yearEl) yearEl.textContent = new Date().getFullYear();

// 移动端菜单：同步可访问状态，并在选择、点击空白处或按 Esc 后关闭。
function setMenu(open) {
  if (!mainNav || !navToggle) return;
  mainNav.classList.toggle('open', open);
  document.body.classList.toggle('nav-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
}

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  document.addEventListener('click', (event) => {
    if (navToggle.getAttribute('aria-expanded') === 'true' && !header.contains(event.target)) {
      setMenu(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 880) setMenu(false);
  }, { passive: true });
}

// 为移动端卡片式表格补充列名，不改动原始表格内容。
document.querySelectorAll('table').forEach((table) => {
  const labels = [...table.querySelectorAll('thead th')].map((cell) => cell.textContent.trim());
  table.querySelectorAll('tbody tr').forEach((row) => {
    [...row.children].forEach((cell, index) => {
      cell.dataset.label = labels[index] || '';
    });
  });
});

// 入场节奏：首屏按主次递进，卡片组延迟封顶在 160ms。
document.querySelectorAll('.hero-copy > .reveal').forEach((element, index) => {
  element.style.setProperty('--delay', `${Math.min(index, 4) * 70}ms`);
});
if (heroCard) heroCard.style.setProperty('--delay', '140ms');

document.querySelectorAll('.product-grid, .app-grid, .about-points').forEach((group) => {
  [...group.children].forEach((element, index) => {
    element.style.setProperty('--delay', `${Math.min(index, 4) * 40}ms`);
  });
});

const revealEls = document.querySelectorAll('.reveal');
let revealObserver;

function revealEverything() {
  revealEls.forEach((element) => element.classList.add('in'));
}

if (!reduceMotion && 'IntersectionObserver' in window) {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
  revealEls.forEach((element) => revealObserver.observe(element));
} else {
  revealEverything();
}

// 当前区块导航高亮，同时为背景场景提供语义状态。
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.main-nav a')];
const navMap = new Map(navLinks.map((link) => [link.getAttribute('href').slice(1), link]));

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    document.body.dataset.scene = visible.target.id;

    if (navMap.has(visible.target.id)) {
      navLinks.forEach((link) => link.classList.remove('active'));
      navMap.get(visible.target.id).classList.add('active');
    }
  }, { rootMargin: '-36% 0px -52% 0px', threshold: [0, 0.08, 0.3] });

  sections.forEach((section) => sectionObserver.observe(section));

  // 常驻动画只在场景可见时运行，页面离开视口后自动暂停。
  const motionVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-idle', !entry.isIntersecting);
    });
  }, { rootMargin: '20% 0px 20% 0px' });

  if (heroMotion) motionVisibilityObserver.observe(heroMotion);
  sceneBridges.forEach((bridge) => motionVisibilityObserver.observe(bridge));
}

// 缓存场景尺寸；滚动帧中只读取 scrollY/viewport 并写 transform、opacity。
const lightMotionSections = ['about', 'products', 'contact']
  .map((id) => document.getElementById(id))
  .filter(Boolean);
let lightMotionMetrics = [];
let applicationMetric = null;
let heroHeight = 1;

function cacheMotionMetrics() {
  const y = window.scrollY || window.pageYOffset || 0;
  heroHeight = hero ? Math.max(1, hero.getBoundingClientRect().height) : 1;
  lightMotionMetrics = lightMotionSections.map((section) => {
    const rect = section.getBoundingClientRect();
    return { element: section, top: rect.top + y, height: Math.max(1, rect.height) };
  });
  if (applicationSection) {
    const rect = applicationSection.getBoundingClientRect();
    applicationMetric = { top: rect.top + y, height: Math.max(1, rect.height) };
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

let pointerX = 0;
let pointerY = 0;
let framePending = false;

function updateMotion(y, viewportHeight) {
  if (reduceMotion || motionPaused) return;

  const heroProgress = clamp(y / heroHeight, 0, 1);
  root.style.setProperty('--hero-grid-y', `${(heroProgress * 12).toFixed(2)}px`);
  root.style.setProperty('--hero-motion-y', `${(heroProgress * 44).toFixed(2)}px`);
  root.style.setProperty('--hero-motion-opacity', String(1 - heroProgress * .72));
  root.style.setProperty('--pointer-grid-x', `${pointerX.toFixed(2)}px`);

  const viewportCenter = y + viewportHeight * .5;
  lightMotionMetrics.forEach(({ element, top, height }, index) => {
    if (y + viewportHeight < top || y > top + height) return;
    const progress = clamp((viewportCenter - top) / height - .5, -.5, .5);
    const direction = index % 2 === 0 ? 1 : -1;
    element.style.setProperty('--scene-y', `${(progress * 42).toFixed(2)}px`);
    element.style.setProperty('--scene-x', `${(progress * 20 * direction).toFixed(2)}px`);
    element.style.setProperty('--scene-opacity', String(.82 + (1 - Math.abs(progress) * 2) * .18));
  });

  if (applicationMetric && applicationMotion) {
    const progress = clamp((viewportCenter - applicationMetric.top) / applicationMetric.height - .5, -.5, .5);
    applicationMotion.style.setProperty('--app-motion-y', `${(progress * 52).toFixed(2)}px`);
    applicationMotion.style.setProperty('--app-glow-x', `${(-progress * 28).toFixed(2)}px`);
    applicationMotion.style.setProperty('--app-ring-x', `${(progress * 30).toFixed(2)}px`);
    applicationMotion.style.setProperty('--app-ring-y', `${(progress * -24).toFixed(2)}px`);
    applicationSection.style.setProperty('--app-grid-x', `${(progress * 10).toFixed(2)}px`);
    applicationSection.style.setProperty('--app-grid-y', `${(progress * 20).toFixed(2)}px`);
    applicationSection.style.setProperty('--app-glow-y', `${(progress * -34).toFixed(2)}px`);

    // 桌面端应用章节是一段连续叙事：滚动位置决定当前场景，而不是一次性展示六张卡片。
    if (window.innerWidth >= 1100 && applicationItems.length) {
      const storyRange = Math.max(1, applicationMetric.height - viewportHeight);
      const storyPosition = clamp((y - applicationMetric.top) / storyRange, 0, .9999);
      const activeIndex = Math.min(applicationItems.length - 1, Math.floor(storyPosition * applicationItems.length));
      applicationItems.forEach((item, index) => item.classList.toggle('is-active', index === activeIndex));
      applicationSection.style.setProperty('--story-progress', `${((activeIndex + 1) / applicationItems.length * 100).toFixed(2)}%`);
      applicationSection.style.setProperty('--core-scale', String((1 + activeIndex * .018).toFixed(3)));
      applicationSection.style.setProperty('--core-rotate', `${activeIndex * 9}deg`);
      if (storyProgress) {
        const current = storyProgress.querySelector('span');
        if (current) current.textContent = String(activeIndex + 1).padStart(2, '0');
      }
    }
  }
}

// 滚动进度、头部状态、回到顶部和背景位移共用同一个动画帧。
function updateScrollUI() {
  const y = window.scrollY || window.pageYOffset || 0;
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  if (header) header.classList.toggle('scrolled', y > 8);
  if (progressEl) progressEl.style.transform = `scaleX(${max ? Math.min(1, y / max) : 0})`;
  if (toTopEl) toTopEl.classList.toggle('show', y > 620);
  updateMotion(y, window.innerHeight);
  framePending = false;
}

function requestScrollUpdate() {
  if (framePending) return;
  framePending = true;
  window.requestAnimationFrame(updateScrollUI);
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', () => {
  cacheMotionMetrics();
  requestScrollUpdate();
}, { passive: true });

// 指针只轻微推动网格；文字、商标和公司信息从不参与视差。
if (!reduceMotion && finePointerQuery.matches) {
  window.addEventListener('pointermove', (event) => {
    pointerX = (event.clientX / window.innerWidth - .5) * 10;
    pointerY = (event.clientY / window.innerHeight - .5) * 10;
    root.style.setProperty('--pointer-grid-y', `${pointerY.toFixed(2)}px`);
    requestScrollUpdate();
  }, { passive: true });

  if (heroCard) {
    let spotFrame = 0;
    let spotEvent;
    heroCard.addEventListener('pointermove', (event) => {
      spotEvent = event;
      if (spotFrame) return;
      spotFrame = window.requestAnimationFrame(() => {
        const rect = heroCard.getBoundingClientRect();
        const x = ((spotEvent.clientX - rect.left) / rect.width) * 100;
        const y = ((spotEvent.clientY - rect.top) / rect.height) * 100;
        heroCard.style.setProperty('--spot-x', `${clamp(x, 0, 100).toFixed(1)}%`);
        heroCard.style.setProperty('--spot-y', `${clamp(y, 0, 100).toFixed(1)}%`);
        spotFrame = 0;
      });
    }, { passive: true });
    heroCard.addEventListener('pointerleave', () => {
      heroCard.style.setProperty('--spot-x', '72%');
      heroCard.style.setProperty('--spot-y', '18%');
    }, { passive: true });
  }
}

function setMotionPaused(paused) {
  motionPaused = paused;
  document.body.classList.toggle('motion-paused', paused);
  if (motionToggle) {
    motionToggle.setAttribute('aria-pressed', String(paused));
    motionToggle.setAttribute('aria-label', paused ? '播放背景动效' : '暂停背景动效');
    const label = motionToggle.querySelector('.motion-toggle-text');
    if (label) label.textContent = paused ? '播放动效' : '暂停动效';
  }
  requestScrollUpdate();
}

if (motionToggle) {
  motionToggle.addEventListener('click', () => setMotionPaused(!motionPaused));
}

function handleMotionPreference(event) {
  reduceMotion = event.matches;
  if (reduceMotion) revealEverything();
  requestScrollUpdate();
}

if (typeof motionQuery.addEventListener === 'function') {
  motionQuery.addEventListener('change', handleMotionPreference);
} else if (typeof motionQuery.addListener === 'function') {
  motionQuery.addListener(handleMotionPreference);
}

document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('tab-hidden', document.hidden);
});

if (toTopEl) {
  toTopEl.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

cacheMotionMetrics();
updateScrollUI();
window.addEventListener('load', () => {
  cacheMotionMetrics();
  requestScrollUpdate();
}, { once: true });
