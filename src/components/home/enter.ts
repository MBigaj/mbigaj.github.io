/**
 * Entry into the dashboard. An enhancement only: without this script the link is a plain
 * anchor jump and every panel is visible. The dimmed start state exists only under html.js-enter.
 */
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dashboard = document.getElementById('dashboard');

if (dashboard) {
  const light = () => dashboard.classList.add('lit');

  document.querySelector<HTMLAnchorElement>('.enter')?.addEventListener('click', (event) => {
    event.preventDefault();
    dashboard.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', '#dashboard');
    dashboard.focus({ preventScroll: true });
  });

  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  const landedInside = target !== null && dashboard.contains(target);

  if (!reduced && !landedInside && 'IntersectionObserver' in window) {
    dashboard.querySelectorAll<HTMLElement>('.panel').forEach((panel, i) => {
      panel.style.transitionDelay = `${i * 60}ms`;
    });
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        light();
      },
      { threshold: 0.05 },
    );
    document.documentElement.classList.add('js-enter');
    observer.observe(dashboard);
  }
}
