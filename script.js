// ============================================================
// NAV — Smooth scroll + history cleanup + mobile close
// ============================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const href   = this.getAttribute('href');
    const target = document.querySelector(href);
    if (!target) return;
    history.replaceState(null, null, href);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('nav-menu')?.classList.remove('active');
  });
});

// ============================================================
// HAMBURGER MENU
// ============================================================
const hamburger = document.querySelector('.hamburger');
const navMenu   = document.getElementById('nav-menu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => navMenu.classList.toggle('active'));
  document.querySelectorAll('#nav-menu a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });
}

// ============================================================
// ACTIVE NAV INDICATOR — IntersectionObserver
// Page now uses standard document scroll so root is null (viewport).
// ============================================================
const navLinks = document.querySelectorAll('#nav-menu a');
const sections = document.querySelectorAll('section[id]');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(link => {
        link.classList.toggle('nav-active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, {
  root: null,                      // standard viewport — works now that .parallax is gone
  rootMargin: '-40% 0px -40% 0px',
  threshold: 0,
});
sections.forEach(section => navObserver.observe(section));

// ============================================================
// SWIPER — Featured works
// Nav buttons are outside .featured-swiper in the HTML,
// so Swiper finds them via the selector strings below.
// ============================================================
const swiper = new Swiper('.featured-swiper', {
  slidesPerView: 1.2,
  spaceBetween: 10,
  loop: true,
  grabCursor: true,
  centeredSlides: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
    dynamicBullets: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  autoplay: { delay: 3000, disableOnInteraction: false },
  breakpoints: {
    768:  { slidesPerView: 2, spaceBetween: 10 },
    1024: { slidesPerView: 3, spaceBetween: 15 },
  },
});

// Pause autoplay on interaction, auto-resume after 15s
let pauseTimer;
function pauseAutoplay() {
  swiper.autoplay.stop();
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => swiper.autoplay.start(), 15000);
}
swiper.on('touchStart', pauseAutoplay);
const swiperNextBtn = document.querySelector('.swiper-button-next');
const swiperPrevBtn = document.querySelector('.swiper-button-prev');
if (swiperNextBtn) swiperNextBtn.addEventListener('click', pauseAutoplay);
if (swiperPrevBtn) swiperPrevBtn.addEventListener('click', pauseAutoplay);

// ============================================================
// BACK-TO-TOP
// Now uses window scroll — .parallax wrapper no longer exists.
// ============================================================
const backToTopBtn = document.querySelector('.back-to-top');

function handleScroll() {
  if (!backToTopBtn) return;
  backToTopBtn.classList.toggle('show', window.scrollY > 300);
}
window.addEventListener('scroll', handleScroll, { passive: true });

if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ============================================================
// GALLERY TABS
// ============================================================
const tabButtons = document.querySelectorAll('.tab-btn');
const tabPanels  = document.querySelectorAll('.tab-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    tabPanels.forEach(p  => p.classList.remove('active'));
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

// ============================================================
// PHOTO LIGHTBOX
// ============================================================
const lightbox      = document.getElementById('lightbox');
const lightboxInner = document.querySelector('.lightbox-inner');
const lightboxImg   = document.querySelector('.lightbox-img');
const closeBtn      = document.querySelector('.lightbox-close');
const prevBtn       = document.querySelector('.lightbox-prev');
const nextBtn       = document.querySelector('.lightbox-next');
const galleryItems  = Array.from(document.querySelectorAll('.gallery-item'));

let currentIndex   = 0;
let lightboxActive = false;
let scale          = 1;
let currentX = 0, currentY = 0;
let isDragging = false, startX = 0, startY = 0;

function showLightbox(index, pushState = true) {
  const bg       = galleryItems[index].style.backgroundImage;
  const urlMatch = bg.match(/url\(["']?(.+?)["']?\)/i);
  if (!urlMatch) return;

  lightboxImg.src = urlMatch[1];
  scale = 1; currentX = 0; currentY = 0;
  lightboxImg.classList.remove('zoomed');
  lightboxImg.style.transform = 'scale(1)';

  lightbox.classList.add('show');
  currentIndex   = index;
  lightboxActive = true;

  if (pushState) history.pushState({ lightbox: true }, '', '#lightbox');
}

function closeLightbox(popState = false) {
  lightbox.classList.remove('show');
  lightboxActive = false;
  currentX = 0; currentY = 0; scale = 1;
  if (!popState && history.state?.lightbox) history.back();
}

function updateTransform() {
  lightboxImg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${scale})`;
}

function clampPan() {
  if (scale <= 1) { currentX = 0; currentY = 0; return; }
  const imgRect       = lightboxImg.getBoundingClientRect();
  const containerRect = lightboxInner.getBoundingClientRect();
  const maxX = Math.max(0, (imgRect.width  - containerRect.width)  / 2);
  const maxY = Math.max(0, (imgRect.height - containerRect.height) / 2);
  currentX = Math.min(maxX, Math.max(-maxX, currentX));
  currentY = Math.min(maxY, Math.max(-maxY, currentY));
}

galleryItems.forEach((item, i) => item.addEventListener('click', () => showLightbox(i)));

closeBtn.addEventListener('click', () => closeLightbox());
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

nextBtn.addEventListener('click', () => {
  currentIndex = (currentIndex + 1) % galleryItems.length;
  showLightbox(currentIndex, false);
});
prevBtn.addEventListener('click', () => {
  currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
  showLightbox(currentIndex, false);
});

document.addEventListener('keydown', e => {
  if (!lightboxActive) return;
  if (e.key === 'ArrowRight') nextBtn.click();
  if (e.key === 'ArrowLeft')  prevBtn.click();
  if (e.key === 'Escape')     closeLightbox();
});

// Mobile swipe in lightbox
let touchStartX = 0, touchStartY = 0, touchStartTime = 0, isPotentialSwipe = true;

lightbox.addEventListener('touchstart', (e) => {
  if (!lightboxActive) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX; touchStartY = touch.clientY; touchStartTime = Date.now();
  isPotentialSwipe = !(scale > 1 || e.touches.length > 1);
  if (scale > 1 && e.touches.length === 1) {
    isDragging = true; startX = touch.clientX - currentX; startY = touch.clientY - currentY;
  }
});

lightbox.addEventListener('touchmove', (e) => {
  if (!lightboxActive) return;
  if (e.touches.length > 1) { isPotentialSwipe = false; return; }
  if (scale > 1) { isPotentialSwipe = false; }
  const touch  = e.touches[0];
  const dY = Math.abs(touch.clientY - touchStartY);
  const dX = Math.abs(touch.clientX - touchStartX);
  if (dY > dX + 20) isPotentialSwipe = false;
});

lightbox.addEventListener('touchend', (e) => {
  if (!lightboxActive || !isPotentialSwipe) { isDragging = false; return; }
  const touch     = e.changedTouches[0];
  const deltaX    = touch.clientX - touchStartX;
  const deltaTime = Date.now() - touchStartTime;
  if (deltaTime < 500 && Math.abs(deltaX) > 50) {
    deltaX > 0 ? prevBtn.click() : nextBtn.click();
  }
  isDragging = false;
});

window.addEventListener('popstate', e => {
  if (lightboxActive && !e.state?.lightbox) closeLightbox(true);
});

lightboxImg.addEventListener('click', e => {
  e.stopPropagation();
  scale = scale === 1 ? 2 : 1;
  lightboxImg.classList.toggle('zoomed', scale === 2);
  currentX = 0; currentY = 0;
  updateTransform();
});

lightboxInner.addEventListener('mousemove', e => {
  if (scale <= 1) return;
  const rect    = lightboxInner.getBoundingClientRect();
  const offsetX = ((e.clientX - rect.left)  / rect.width  - 0.5) * 2;
  const offsetY = ((e.clientY - rect.top)   / rect.height - 0.5) * 2;
  currentX = -offsetX * (scale - 1) * rect.width  / 2;
  currentY = -offsetY * (scale - 1) * rect.height / 2;
  clampPan();
  updateTransform();
});

// ============================================================
// CERTIFICATE ACCORDION
// ============================================================
const certTrigger   = document.querySelector('.cert-trigger');
const certAccordion = document.querySelector('.cert-accordion');

if (certTrigger && certAccordion) {
  function toggleCert() {
    const isOpen = certTrigger.getAttribute('aria-expanded') === 'true';
    certTrigger.setAttribute('aria-expanded', String(!isOpen));
    certAccordion.setAttribute('aria-hidden',  String(isOpen));
    certAccordion.classList.toggle('open', !isOpen);
  }
  certTrigger.addEventListener('click', toggleCert);
  certTrigger.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCert(); }
  });
}

// ============================================================
// LANGUAGE VIDEO MODAL
// YouTube IFrame Player API — portrait 9:16 (Shorts format)
// Auto-close on video end (state 0).
// Close button works at DOM level — independent of player state.
// ============================================================

// Load YouTube IFrame API dynamically
(function loadYouTubeAPI() {
  const tag = document.createElement('script');
  tag.src   = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
})();

let langPlayer      = null;
let langPlayerReady = false;

window.onYouTubeIframeAPIReady = function () {
  langPlayerReady = true;
};

const langModal      = document.getElementById('lang-modal');
const langModalTitle = document.getElementById('lang-modal-title');
const langModalClose = document.querySelector('.lang-modal-close');

function openLangVideo(videoId, langName) {
  langModalTitle.textContent = `Introducing in ${langName}`;
  langModal.classList.add('show');
  document.body.style.overflow = 'hidden';

  // Destroy any previous player cleanly
  if (langPlayer) {
    try { langPlayer.destroy(); } catch (e) {}
    langPlayer = null;
  }

  // Recreate the target div (destroy() removes the element)
  const container = document.getElementById('lang-player-container');
  container.innerHTML = '<div id="lang-youtube-player"></div>';

  function createPlayer() {
    langPlayer = new YT.Player('lang-youtube-player', {
      videoId,
      width:  '100%',
      height: '100%',
      playerVars: {
        autoplay:       1,
        controls:       1,
        rel:            0,
        playsinline:    1,
        modestbranding: 1,
      },
      events: {
        onStateChange(event) {
          if (event.data === YT.PlayerState.ENDED) {
            closeLangModal();
          }
        },
      },
    });
  }

  if (langPlayerReady && typeof YT !== 'undefined' && YT.Player) {
    createPlayer();
  } else {
    const poll = setInterval(() => {
      if (typeof YT !== 'undefined' && YT.Player) {
        clearInterval(poll);
        langPlayerReady = true;
        createPlayer();
      }
    }, 100);
  }
}

function closeLangModal() {
  // Hide at DOM level first — always works regardless of player state
  langModal.classList.remove('show');
  document.body.style.overflow = '';

  // Destroy player after CSS fade-out completes
  setTimeout(() => {
    if (langPlayer) {
      try { langPlayer.destroy(); } catch (e) {}
      langPlayer = null;
    }
    const container = document.getElementById('lang-player-container');
    if (container) container.innerHTML = '<div id="lang-youtube-player"></div>';
  }, 350);
}

if (langModalClose) langModalClose.addEventListener('click', closeLangModal);
if (langModal)      langModal.addEventListener('click', e => { if (e.target === langModal) closeLangModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && langModal?.classList.contains('show')) closeLangModal();
});

document.querySelectorAll('.lang-tag').forEach(tag => {
  tag.addEventListener('click', () => openLangVideo(tag.dataset.video, tag.dataset.lang));
});
