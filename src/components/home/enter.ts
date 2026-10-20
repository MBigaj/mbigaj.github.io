/**
 * Entry into the dashboard. An enhancement only: without this script the link is a plain
 * anchor jump and every panel is visible. The dimmed start state exists only under html.js-enter.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dashboard = document.getElementById('dashboard');

if (dashboard) {
  // The stagger delays are set only when lighting up: an inline transition-delay is a transition on
  // its own (even with a 0s duration), so setting it earlier would make the dimming itself staggered.
  const light = () => {
    dashboard.querySelectorAll<HTMLElement>('.panel').forEach((panel, i) => {
      panel.style.transitionDelay = `${i * 120}ms`;
    });
    dashboard.classList.add('lit');
  };

  document.querySelector<HTMLAnchorElement>('.enter')?.addEventListener('click', (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    dashboard.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#dashboard');
    dashboard.focus({ preventScroll: true });
  });

  let id = location.hash.slice(1);
  try {
    id = decodeURIComponent(id);
  } catch {
    // a malformed hash points at nothing; keep it as typed
  }
  // Deliberately different from the entrance skip in the head script of src/layouts/Base.astro (any hash except #intro).
  const target = id ? document.getElementById(id) : null;
  const landedInside = target !== null && dashboard.contains(target);

  if (!reduced && !landedInside && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        light();
      },
      // threshold 0 with a small bottom margin: lit as soon as the top of the dashboard is on screen,
      // however tall the dashboard is
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    document.documentElement.classList.add('js-enter');
    observer.observe(dashboard);
  }
}
