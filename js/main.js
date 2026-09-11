// ===== 页脚年份 =====
document.getElementById('year').textContent = new Date().getFullYear();

// ===== 顶部导航滚动样式 =====
const header = document.getElementById('siteHeader');
const onScroll = () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ===== 移动端菜单 =====
const navToggle = document.getElementById('navToggle');
const mainNav = document.getElementById('mainNav');
navToggle.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
mainNav.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ===== 滚动进入视口动画 =====
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// ===== 导航高亮当前区块 =====
const sections = [...document.querySelectorAll('main section[id]')];
const navLinks = [...document.querySelectorAll('.main-nav a')];
const navMap = {};
navLinks.forEach((link) => {
  const id = link.getAttribute('href').replace('#', '');
  if (id) navMap[id] = link;
});
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && navMap[entry.target.id]) {
      navLinks.forEach((l) => l.classList.remove('active'));
      navMap[entry.target.id].classList.add('active');
    }
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((sec) => spy.observe(sec));

// ===== 滚动体验：进度条 / 回到顶部 / 首屏视差 =====
// 说明：使用 requestAnimationFrame 节流 + passive 监听，避免滚动掉帧
(function () {
  const progressEl = document.getElementById('scrollProgress');
  const toTopEl = document.getElementById('toTop');
  const heroCopyEl = document.querySelector('.hero-copy');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pending = false;

  function updateScrollUI() {
    const y = window.scrollY || window.pageYOffset || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    // 顶部进度条
    if (progressEl) {
      progressEl.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    }
    // 回到顶部按钮显隐
    if (toTopEl) {
      toTopEl.classList.toggle('show', y > 560);
    }
    // 首屏文案轻微视差（仅桌面 & 未开启减弱动效时）
    if (heroCopyEl && !reduceMotion && window.innerWidth > 900) {
      heroCopyEl.style.opacity = String(Math.max(0, 1 - y / 640));
      heroCopyEl.style.transform = 'translate3d(0,' + Math.min(y * 0.03, 18).toFixed(1) + 'px,0)';
    }
    pending = false;
  }

  function requestUpdate() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(updateScrollUI);
    }
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });

  // 回到顶部（平滑滚动）
  if (toTopEl) {
    toTopEl.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  // 卡片交错进场：给同级元素设置递增延迟
  document.querySelectorAll('.product-grid, .app-grid, .about-points').forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (el, i) {
      el.style.setProperty('--d', String(i));
    });
  });

  updateScrollUI();
})();
