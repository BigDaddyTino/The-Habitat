"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * A <details> menu that behaves like a menu.
 *
 * Native <details> only ever closes when its own summary is clicked again, so
 * a header dropdown built from one stays open over the page behind it after
 * you click away, and stays open across a client-side navigation because the
 * header never unmounts. This adds the four dismissals people expect: click
 * outside, click a link inside, Escape, and route change.
 *
 * The element stays uncontrolled — `open` is toggled on the DOM node rather
 * than held in React state, so the browser keeps owning the summary toggle and
 * there is no second source of truth to drift.
 */
export function NavDisclosure({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // A link to the page you are already on does not change the pathname, which
  // is why the click handler below closes the menu as well as this.
  useEffect(() => {
    const details = ref.current;
    if (details) details.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = ref.current;
    if (!details) return undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (!details.open) return;
      if (event.target instanceof Node && details.contains(event.target)) return;
      details.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !details.open) return;
      details.open = false;
      // Escape should leave focus somewhere sensible, not adrift in a hidden panel.
      details.querySelector("summary")?.focus();
    };
    // Closing here does not cancel the navigation: a closed <details> hides its
    // panel but keeps the anchor in the DOM, so React's delegated click handler
    // still runs.
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a")) details.open = false;
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    details.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      details.removeEventListener("click", onClick);
    };
  }, []);

  return <details className={className} ref={ref}>{children}</details>;
}
