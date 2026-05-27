import { useEffect } from 'react';

/**
 * Observes `.reveal-block` under `rootRef` (re-scans briefly so lazy-loaded sections still hook up).
 */
export function useRevealScan(rootRef, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
    );

    const seen = new WeakSet();

    const scan = () => {
      root.querySelectorAll('.reveal-block').forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        io.observe(el);
      });
    };

    scan();
    const interval = window.setInterval(scan, 400);
    const stop = window.setTimeout(() => clearInterval(interval), 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(stop);
      io.disconnect();
    };
  }, [rootRef, active]);
}
