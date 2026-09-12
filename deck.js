(() => {
  const DESIGN_WIDTH = 1920;
  const DESIGN_HEIGHT = 1080;
  const shell = document.querySelector('.presentation-shell');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const counter = document.querySelector('.counter');
  const progress = document.querySelector('.progress span');
  const notesPanel = document.querySelector('.notes-panel');
  const notesCopy = notesPanel?.querySelector('p');
  const controls = document.querySelector('.presentation-controls');
  const previousButton = document.querySelector('[data-action="previous"]');
  const nextButton = document.querySelector('[data-action="next"]');
  const notesButton = document.querySelector('[data-action="notes"]');
  const fullscreenButton = document.querySelector('[data-action="fullscreen"]');
  let current = Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0));
  let idleTimer;

  const pad = (value) => String(value).padStart(2, '0');

  function scaleDeck() {
    const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    shell.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  function syncVideo(slide, active) {
    slide.querySelectorAll('video').forEach((video) => {
      if (active) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  function render(nextIndex, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, nextIndex));
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      syncVideo(slide, active);
    });

    counter.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    previousButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    notesCopy.textContent = slides[current].querySelector('.speaker-note')?.textContent.trim() || '';

    if (updateHash) {
      history.replaceState(null, '', `#${current + 1}`);
    }
  }

  function toggleNotes(force) {
    const open = typeof force === 'boolean' ? force : !notesPanel.classList.contains('is-open');
    notesPanel.classList.toggle('is-open', open);
    notesPanel.setAttribute('aria-hidden', String(!open));
    notesButton.setAttribute('aria-pressed', String(open));
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      // Fullscreen can be blocked by browser or embedded preview permissions.
    }
  }

  function showControls() {
    document.body.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!notesPanel.classList.contains('is-open')) document.body.classList.add('is-idle');
    }, 2400);
  }

  previousButton.addEventListener('click', () => render(current - 1));
  nextButton.addEventListener('click', () => render(current + 1));
  notesButton.addEventListener('click', () => toggleNotes());
  fullscreenButton.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', (event) => {
    const tag = event.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      render(current + 1);
    } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      render(current - 1);
    } else if (event.key === 'Home') {
      render(0);
    } else if (event.key === 'End') {
      render(slides.length - 1);
    } else if (event.key.toLowerCase() === 'n') {
      toggleNotes();
    } else if (event.key.toLowerCase() === 'f') {
      toggleFullscreen();
    } else if (event.key === 'Escape') {
      toggleNotes(false);
    }
    showControls();
  });

  window.addEventListener('resize', scaleDeck);
  window.addEventListener('mousemove', showControls, { passive: true });
  window.addEventListener('pointerdown', showControls, { passive: true });
  window.addEventListener('hashchange', () => {
    const hashIndex = Number(location.hash.slice(1)) - 1;
    if (Number.isInteger(hashIndex)) render(hashIndex, false);
  });
  document.addEventListener('fullscreenchange', () => {
    fullscreenButton.setAttribute('aria-pressed', String(Boolean(document.fullscreenElement)));
    scaleDeck();
  });

  scaleDeck();
  render(current, false);
  showControls();
  controls.addEventListener('mouseenter', () => clearTimeout(idleTimer));
  controls.addEventListener('mouseleave', showControls);
})();
