import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Load data from the API, with loading/error state and a manual `reload`.
 *
 * <h2>Why this exists rather than a bare useEffect in each page</h2>
 * Four screens needed the same thing - fetch on mount, re-fetch when a live event says
 * something changed, show a spinner, show an error, offer "try again". Writing that four
 * times invites four slightly different bugs. This is one implementation.
 *
 * It also keeps React's rules honest:
 *  - state is only set from an async callback, never synchronously in the effect body;
 *  - a `cancelled` flag means a response arriving after unmount is ignored, so React does
 *    not warn about updating an unmounted component and a slow request cannot overwrite
 *    newer data;
 *  - `fetcher` is held in a ref, so an inline arrow function passed by the caller does not
 *    restart the request on every render - a classic infinite-fetch bug.
 *
 * @param fetcher  async () => data
 * @param deps     values that should trigger a re-fetch (live event counters, ids, filters)
 * @returns { data, error, loading, reload, setData }
 */
export const useApiData = (fetcher, deps = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  // Hold the fetcher in a ref so an inline arrow function from the caller does not restart
  // the request on every render (a classic infinite-fetch bug). The ref is written from an
  // effect, because writing to a ref during render is not allowed.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;

    // Mark loading inside the async function rather than in the effect body. Setting state
    // synchronously here would trigger a second render before the first one has committed.
    const run = async () => {
      setLoading(true);
      try {
        const result = await fetcherRef.current();
        if (!cancelled) {
          setData(result);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  return { data, error, loading, reload, setData, setError };
};

export default useApiData;
