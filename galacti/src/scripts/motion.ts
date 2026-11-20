/* ==========================================================================
   GALACTI — motion engine (vanilla, dependency-free)
   - split text / fail-safe reveals / scroll scrubbing / parallax
   - header capsule sheen + mobile menu, progress, fast page transitions
   - video playback manager + original-audio control (no restart on toggle)
   - starfield canvas, lightbox
   Everything respects prefers-reduced-motion.
   ========================================================================== */

const html = document.documentElement;
const reduced = html.classList.contains('reduced');
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const vh = () => window.innerHeight || document.documentElement.clientHeight;

/* ---------- 1. Split text into masked words ---------- */
function splitWords(el: HTMLElement, mode: 'mask' | 'plain') {
  let index = 0;
  const walk = (node: Node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent ?? '';
        if (!text.trim()) return;
        const frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
            return;
          }
          const outer = document.createElement('span');
          const i = index++;
          if (mode === 'mask') {
            outer.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            outer.appendChild(inner);
            outer.style.setProperty('--i', String(i));
          } else {
            outer.className = 'sw';
            outer.textContent = part;
            outer.dataset.i = String(i);
          }
          frag.appendChild(outer);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName !== 'BR') {
        walk(child);
      }
    });
  };
  walk(el);
  return index;
}

$$('[data-split]').forEach((el) => {
  el.setAttribute('aria-label', (el.textContent ?? '').replace(/\s+/g, ' ').trim());
  splitWords(el, 'mask');
  el.querySelectorAll('.w').forEach((w) => w.setAttribute('aria-hidden', 'true'));
  el.classList.add('split');
  const d = el.getAttribute('data-delay');
  if (d) el.style.setProperty('--d', d);
});

const scrubWords = $$('[data-scrub-words]').map((el) => {
  const n = splitWords(el, 'plain');
  return { el, words: $$('.sw', el), n };
});

/* ---------- 2. Fail-safe Reveal on Enter ---------- */
{
  const targets = $$('[data-reveal], .split');
  targets.forEach((el) => {
    const d = el.getAttribute('data-delay');
    if (d) el.style.setProperty('--d', d);
  });

  const revealVisible = () => {
    const limit = vh() * 1.15;
    targets.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const r = el.getBoundingClientRect();
      if (r.top <= limit && r.bottom >= -40) {
        el.classList.add('is-in');
      }
    });
  };

  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px 60px 0px' },
    );
    targets.forEach((el) => io.observe(el));
    revealVisible();
    window.addEventListener('load', revealVisible, { once: true });
    window.addEventListener('scroll', revealVisible, { passive: true });
  }
}

/* ---------- 3. Scroll loop: parallax, scrub, progress, header ---------- */
type PItem = { el: HTMLElement; speed: number; axis: 'y' | 'x'; zoom: number };
const parallax: PItem[] = $$('[data-parallax],[data-parallax-x],[data-zoom]')
  .map((el) => ({
    el,
    speed: parseFloat(el.dataset.parallax ?? '0'),
    axis: el.dataset.parallaxX !== undefined ? ('x' as const) : ('y' as const),
    zoom: parseFloat(el.dataset.zoom ?? '0'),
  }))
  .map((p) => (p.axis === 'x' ? { ...p, speed: parseFloat(p.el.dataset.parallaxX ?? '0') } : p));

const scrubs = $$('[data-scrub]');
const header = document.getElementById('site-header');
const heroEl = document.querySelector<HTMLElement>('[data-hero]');
const lineEl = document.getElementById('progress-line');
const ringEl = document.getElementById('progress-ring');
const numEl = document.getElementById('progress-num');
const RING = 125.66;

function tick() {
  const H = vh();
  const y = window.scrollY;

  // progress
  const max = Math.max(1, document.documentElement.scrollHeight - H);
  const prog = clamp(y / max);
  if (lineEl) lineEl.style.transform = `scaleX(${prog})`;
  if (ringEl) ringEl.setAttribute('stroke-dashoffset', String(RING * (1 - prog)));
  if (numEl) numEl.textContent = String(Math.round(prog * 100)).padStart(2, '0');

  // header solid glass when scrolling past top
  if (header) {
    const limit = heroEl ? Math.min(48, heroEl.offsetHeight * 0.15) : 20;
    header.dataset.state = y > limit ? 'solid' : 'top';
  }

  if (reduced) return;

  // scrub progress (--p)
  for (const el of scrubs) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -H * 0.5 || r.top > H * 1.5) continue;
    let p: number;
    if (el.dataset.scrub === 'pin') p = clamp(-r.top / Math.max(1, r.height - H));
    else if (el.dataset.scrub === 'exit') p = clamp(-r.top / Math.max(1, r.height));
    else p = clamp((H - r.top) / (H + r.height));
    el.style.setProperty('--p', p.toFixed(4));
  }

  // parallax / zoom
  for (const it of parallax) {
    const r = it.el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > H + 200) continue;
    const center = r.top + r.height / 2 - H / 2;
    if (it.axis === 'x') it.el.style.translate = `${(center * it.speed).toFixed(1)}px 0`;
    else if (it.speed) it.el.style.translate = `0 ${(center * -it.speed).toFixed(1)}px`;
    if (it.zoom) {
      const p = clamp((H - r.top) / (H + r.height));
      it.el.style.scale = String(1 + p * it.zoom);
    }
  }

  // scroll-lit words
  for (const sw of scrubWords) {
    const r = sw.el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > H + 100) continue;
    const p = clamp((H * 0.86 - r.top) / (H * 0.5 + r.height * 0.55));
    const lit = p * (sw.n + 1);
    sw.words.forEach((w, i) => w.style.setProperty('--on', lit > i ? '1' : '0'));
  }
}

let queued = false;
const request = () => {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    tick();
  });
};
window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', request);
window.addEventListener('load', request);
tick();
if (reduced) {
  scrubWords.forEach((s) => s.words.forEach((w) => w.style.setProperty('--on', '1')));
  scrubs.forEach((el) => el.style.setProperty('--p', el.dataset.scrub === 'exit' ? '0' : '1'));
}

/* ---------- 4. Header sheen & mobile menu ---------- */
{
  const navBar = document.getElementById('fx-nav-bar');
  const sheen = document.getElementById('fx-nav-sheen');
  navBar?.addEventListener('pointermove', (e) => {
    if (!sheen) return;
    const rect = navBar.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    sheen.style.setProperty('--sheen-x', `${x.toFixed(1)}%`);
  });

  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  const setOpen = (open: boolean) => {
    if (!btn || !menu || !header) return;
    header.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) menu.removeAttribute('inert');
    else menu.setAttribute('inert', '');
    document.body.style.overflow = open ? 'hidden' : '';
    const label = btn.querySelector('.menu-label');
    if (label) label.textContent = open ? 'Fechar' : 'Menu';
  };
  btn?.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn?.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      btn.focus();
    }
  });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (m) => m.matches && setOpen(false));
  window.addEventListener('pageshow', () => setOpen(false));
}

/* ---------- 5. Cinematic page transitions ---------- */
{
  const curtain = document.getElementById('curtain');
  const toneFor = (path: string) =>
    path.startsWith('/cosmic-blue') ? 'blue' : path.startsWith('/eclipse-grey') ? 'grey' : '';
  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest?.('a[href]') as HTMLAnchorElement | null;
    if (!a || !curtain) return;
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && (url.hash || url.search === location.search)) return;
    e.preventDefault();
    const tone = toneFor(url.pathname);
    if (tone) html.setAttribute('data-tone', tone);
    else html.removeAttribute('data-tone');
    try {
      if (tone) sessionStorage.setItem('galacti:tone', tone);
    } catch {}
    curtain.classList.add('is-leaving');
    window.setTimeout(() => (location.href = url.href), reduced ? 0 : 480);
  });
  window.addEventListener('pageshow', (e) => {
    if ((e as PageTransitionEvent).persisted) curtain?.classList.remove('is-leaving');
  });
}

/* ---------- 6. Video manager + original audio ---------- */
const videos = $$<HTMLVideoElement>('video[data-autoplay]');
videos.forEach((v) => {
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
});

if ('IntersectionObserver' in window) {
  const vio = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          if (!reduced || v.dataset.userPlayed) v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { threshold: 0.05 },
  );
  videos.forEach((v) => vio.observe(v));
} else if (!reduced) videos.forEach((v) => v.play().catch(() => {}));

document.addEventListener('visibilitychange', () => {
  videos.forEach((v) => {
    if (document.hidden) v.pause();
    else if (!reduced || v.dataset.userPlayed) v.play().catch(() => {});
  });
});

function fadeVolume(v: HTMLVideoElement, to: number, ms = 600) {
  const from = v.volume;
  const t0 = performance.now();
  const step = (t: number) => {
    const k = clamp((t - t0) / ms);
    v.volume = from + (to - from) * k;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

$$<HTMLButtonElement>('[data-audio]').forEach((btn) => {
  const target = document.querySelector<HTMLVideoElement>(btn.dataset.audio ?? '');
  if (!target) return;
  const label = btn.querySelector('.audio-label');
  const render = () => {
    const on = !target.muted;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Desativar som do vídeo' : 'Ativar som do vídeo');
    if (label) label.textContent = on ? 'Som ligado' : 'Som desligado';
  };
  btn.addEventListener('click', async () => {
    if (target.muted) {
      target.muted = false;
      target.volume = 0;
      try {
        target.dataset.userPlayed = '1';
        await target.play();
        fadeVolume(target, 1, 750);
      } catch {
        target.muted = true;
      }
    } else {
      fadeVolume(target, 0, 300);
      window.setTimeout(() => {
        target.muted = true;
        render();
      }, 310);
    }
    render();
  });
  render();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => {
        if (target.muted) return;
        fadeVolume(target, e.isIntersecting ? 1 : 0, 700);
      },
      { threshold: 0.3 },
    ).observe(target);
  }
});

/* ---------- 7. Starfield canvas ---------- */
$$<HTMLCanvasElement>('canvas[data-starfield]').forEach((canvas) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const tint = canvas.dataset.tint ?? 'blue';
  const density = parseFloat(canvas.dataset.density ?? '1');
  const palette =
    tint === 'grey'
      ? ['248,250,252', '203,213,225', '212,180,131']
      : tint === 'mixed'
        ? ['248,250,252', '147,197,253', '212,180,131', '203,213,225']
        : ['248,250,252', '147,197,253', '96,165,250'];
  type Star = { x: number; y: number; z: number; r: number; c: string; ph: number; sp: number };
  let stars: Star[] = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let mx = 0;
  let my = 0;
  let tx = 0;
  let ty = 0;
  let running = false;

  const build = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const mobile = W < 720;
    const count = Math.round(((W * H) / 11000) * density * (mobile ? 0.55 : 1));
    stars = Array.from({ length: count }, () => {
      const z = Math.random();
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        z,
        r: 0.25 + z * z * 1.15,
        c: palette[Math.floor(Math.random() * palette.length)],
        ph: Math.random() * Math.PI * 2,
        sp: 0.4 + Math.random() * 1.1,
      };
    });
  };

  const draw = (t: number) => {
    ctx.clearRect(0, 0, W, H);
    mx += (tx - mx) * 0.04;
    my += (ty - my) * 0.04;
    const scroll = window.scrollY;
    for (const s of stars) {
      let x = s.x + mx * s.z * 22;
      let y = s.y + my * s.z * 16 - (reduced ? 0 : scroll * s.z * 0.05);
      y = ((y % H) + H) % H;
      x = ((x % W) + W) % W;
      const tw = reduced ? 0.8 : 0.55 + 0.45 * Math.sin(t * 0.001 * s.sp + s.ph);
      ctx.fillStyle = `rgba(${s.c},${(0.16 + s.z * 0.72) * tw})`;
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, 6.2832);
      ctx.fill();
    }
  };

  const loop = (t: number) => {
    if (!running) return;
    draw(t);
    requestAnimationFrame(loop);
  };

  build();
  draw(0);
  if (reduced) return;

  window.addEventListener('resize', () => {
    build();
    draw(0);
  });
  window.addEventListener(
    'pointermove',
    (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true },
  );
  new IntersectionObserver(
    ([e]) => {
      const was = running;
      running = e.isIntersecting;
      if (running && !was) requestAnimationFrame(loop);
    },
    { threshold: 0 },
  ).observe(canvas);
});

/* ---------- 8. Pointer-driven depth (data-mouse="px") ---------- */
if (!reduced && window.matchMedia('(pointer: fine)').matches) {
  const items = $$('[data-mouse]');
  if (items.length) {
    let px = 0,
      py = 0,
      cx = 0,
      cy = 0;
    window.addEventListener(
      'pointermove',
      (e) => {
        px = (e.clientX / window.innerWidth - 0.5) * 2;
        py = (e.clientY / window.innerHeight - 0.5) * 2;
      },
      { passive: true },
    );
    const loop = () => {
      cx += (px - cx) * 0.06;
      cy += (py - cy) * 0.06;
      for (const el of items) {
        const k = parseFloat(el.dataset.mouse ?? '10');
        el.style.transform = `translate3d(${(cx * k).toFixed(2)}px, ${(cy * k * 0.7).toFixed(2)}px, 0)`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

/* ---------- 9. Lightbox ---------- */
{
  const items = $$<HTMLElement>('[data-lightbox]');
  if (items.length) {
    const dlg = document.createElement('dialog');
    dlg.className = 'lightbox';
    dlg.setAttribute('aria-label', 'Visualizador de imagem');
    dlg.innerHTML = `
      <button class="lb-close" type="button" aria-label="Fechar visualizador"><span></span><span></span></button>
      <button class="lb-nav lb-prev" type="button" aria-label="Imagem anterior">&#8592;</button>
      <button class="lb-nav lb-next" type="button" aria-label="Próxima imagem">&#8594;</button>
      <figure><img alt="" /><figcaption class="caption"></figcaption></figure>`;
    document.body.appendChild(dlg);
    const img = dlg.querySelector('img')!;
    const cap = dlg.querySelector('figcaption')!;
    let group: HTMLElement[] = [];
    let idx = 0;
    const show = (i: number) => {
      idx = (i + group.length) % group.length;
      const src = group[idx].querySelector('img');
      if (!src) return;
      img.src = src.getAttribute('src') || src.currentSrc || src.src;
      img.alt = src.alt;
      cap.textContent = group[idx].dataset.caption ?? '';
    };
    items.forEach((it) =>
      it.addEventListener('click', () => {
        const g = it.dataset.lightbox;
        group = items.filter((x) => x.dataset.lightbox === g);
        show(group.indexOf(it));
        dlg.showModal();
        document.body.style.overflow = 'hidden';
      }),
    );
    dlg.querySelector('.lb-close')!.addEventListener('click', () => dlg.close());
    dlg.querySelector('.lb-prev')!.addEventListener('click', () => show(idx - 1));
    dlg.querySelector('.lb-next')!.addEventListener('click', () => show(idx + 1));
    dlg.addEventListener('click', (e) => e.target === dlg && dlg.close());
    dlg.addEventListener('close', () => (document.body.style.overflow = ''));
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') show(idx + 1);
      if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }
}

export {};
