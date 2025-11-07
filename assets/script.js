// Minimal JS: reveal/theme/parallax only — no carousel re-centering (prevents jitter)
(function(){
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('is-in'); });
  }, {threshold:0.15});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  const bg = document.getElementById('bgfx');
  const themes = { intro:'t-intro', brand:'t-brand', philosophy:'t-philosophy', language:'t-language', contact:'t-contact' };
  const so = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        const theme = e.target.getAttribute('data-theme');
        if (theme && bg) bg.className = 'bgfx ' + (themes[theme] || 't-intro');
      }
    });
  }, {threshold:0.6});
  document.querySelectorAll('section[data-theme]').forEach(sec=>so.observe(sec));

  const panels = Array.from(document.querySelectorAll('[data-parallax] img'));
  if (panels.length){
    const isMobile = ()=> window.innerWidth < 768;
    let raf = 0;
    const onScroll = ()=>{
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        const vh = window.innerHeight || 1;
        panels.forEach(img=>{
          const rect = img.parentElement.getBoundingClientRect();
          const progress = (vh - rect.top) / (vh + rect.height);
          let shift = ((progress - 0.5) * 2) * 20;
          if (isMobile()) shift *= 0.5;
          img.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
        });
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, {passive:true});
    window.addEventListener('resize', onScroll);
  }

  // iOS rubber-banding mitigation (horizontal only)
  const rail = document.getElementById('carousel');
  if (rail){
    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS){
      let sx=0, sy=0;
      rail.addEventListener('touchstart', e=>{ const t=e.touches[0]; sx=t.clientX; sy=t.clientY; }, {passive:true});
      rail.addEventListener('touchmove', e=>{
        const t=e.touches[0]; const dx=t.clientX-sx; const dy=t.clientY-sy;
        if (Math.abs(dx) > Math.abs(dy)){
          const atLeft = rail.scrollLeft <= 0;
          const atRight = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1;
          if ((atLeft && dx > 0) || (atRight && dx < 0)) e.preventDefault();
        }
      }, {passive:false});
    }
  }
})();


// ===== Keyboard navigation for carousel (Left/Right) =====
(function(){
  const rail = document.getElementById('carousel');
  if (!rail) return;
  const cards = Array.from(rail.querySelectorAll('.card'));
  const status = document.getElementById('carousel-status');
  if (!cards.length) return;

  let idx = 0;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const nearestIndex = () => {
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    cards.forEach((c, i) => {
      const cCenter = c.offsetLeft + c.clientWidth / 2;
      const d = Math.abs(cCenter - center);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  };

  const alignTo = (i) => {
    idx = clamp(i, 0, cards.length - 1);
    const card = cards[idx];
    const left = card.offsetLeft - (rail.clientWidth - card.clientWidth) / 2;
    rail.scrollTo({ left, behavior: 'smooth' });
    if (status) status.textContent = (idx + 1) + ' / ' + cards.length;
  };

  // Initialize status on load
  if (status) status.textContent = '1 / ' + cards.length;

  rail.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (idx === 0) { idx = nearestIndex(); }
      alignTo(idx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (idx === cards.length - 1) { idx = nearestIndex(); }
      alignTo(idx + 1);
    }
  });

  // Keep idx in sync when user scrolls manually (lightweight, no jitter)
  let t;
  rail.addEventListener('scroll', () => {
    clearTimeout(t);
    t = setTimeout(() => { idx = nearestIndex(); }, 120);
  }, { passive: true });
})();
