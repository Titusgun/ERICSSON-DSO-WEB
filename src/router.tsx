import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  // refetchInterval: reload every query every 10 s, so results from `dso watch`
  // (new uploads, duplicates, savings) appear live without a page reload.
  // Paused while the tab is hidden (refetchIntervalInBackground defaults to false).
  const queryClient = new QueryClient({
    defaultOptions: { queries: { refetchInterval: 10_000 } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};
