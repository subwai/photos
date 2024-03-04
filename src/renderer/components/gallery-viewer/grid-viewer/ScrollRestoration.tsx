import { useContext, useLayoutEffect } from 'react';
import {
  type GetScrollRestorationKeyFunction,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  UNSAFE_NavigationContext,
  useLocation,
} from 'react-router-dom';

import type { ExtendedGrid } from 'renderer/components/gallery-viewer/grid-viewer/GridScroller';

export default function ScrollRestoration({ grid }: { grid?: ExtendedGrid }) {
  useScrollRestoration({ grid });
  return null;
}

let savedScrollPositions: Record<string, number> = {};

function useDataRouterContext() {
  const context = useContext(UNSAFE_DataRouterContext);
  if (!context) {
    throw new Error('No context');
  }

  return context;
}

function useRouterStateContext() {
  const context = useContext(UNSAFE_DataRouterStateContext);
  if (!context) {
    throw new Error('No context');
  }

  return context;
}

function useScrollRestoration({
  grid,
  getKey,
  storageKey,
}: {
  grid?: ExtendedGrid;
  getKey?: GetScrollRestorationKeyFunction;
  storageKey?: string;
} = {}) {
  const { router } = useDataRouterContext();
  const { restoreScrollPosition, preventScrollReset } = useRouterStateContext();
  const { basename } = useContext(UNSAFE_NavigationContext);
  const location = useLocation();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    try {
      const sessionPositions = sessionStorage.getItem(storageKey || 'grid-scroll-positions');
      if (sessionPositions) {
        savedScrollPositions = JSON.parse(sessionPositions);
      }
    } catch (_e) {
      // no-op, use default empty object
    }
  }, [storageKey]);

  // Enable scroll restoration in the router
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    const getKeyWithoutBasename: GetScrollRestorationKeyFunction | undefined =
      getKey && basename !== '/'
        ? (_location, _matches) =>
            getKey(
              // Strip the basename to match useLocation()
              {
                ...location,
                pathname: stripBasename(_location.pathname, basename) || _location.pathname,
              },
              _matches,
            )
        : getKey;
    const disableScrollRestoration = router?.enableScrollRestoration(
      savedScrollPositions,
      () => (grid ? grid.state.scrollTop : 0),
      getKeyWithoutBasename,
    );
    return () => disableScrollRestoration && disableScrollRestoration();
  }, [grid, router, basename, getKey]);

  // Restore scrolling when state.restoreScrollPosition changes
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useLayoutEffect(() => {
    // Explicit false means don't do anything (used for submissions)
    if (restoreScrollPosition === false) {
      return;
    }

    // been here before, scroll to it
    if (typeof restoreScrollPosition === 'number') {
      grid?.scrollToPosition({ scrollLeft: 0, scrollTop: restoreScrollPosition });
      return;
    }

    // try to scroll to the hash
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }

    // Don't reset if this navigation opted out
    if (preventScrollReset === true) {
      return;
    }

    // otherwise go to the top on new locations
    grid?.scrollToPosition({ scrollLeft: 0, scrollTop: 0 });
  }, [grid, location, restoreScrollPosition, preventScrollReset]);
}

export function stripBasename(pathname: string, basename: string): string | null {
  if (basename === '/') return pathname;

  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }

  // We want to leave trailing slash behavior in the user's control, so if they
  // specify a basename with a trailing slash, we should support it
  const startIndex = basename.endsWith('/') ? basename.length - 1 : basename.length;
  const nextChar = pathname.charAt(startIndex);
  if (nextChar && nextChar !== '/') {
    // pathname does not start with basename/
    return null;
  }

  return pathname.slice(startIndex) || '/';
}
