// Bulletproof dashboard data hook
// Key insight: store fetcher in a ref so function identity changes don't matter
import { useEffect, useRef, useState } from "react";

export function useDashboardData(fetcher, deps = []) {
  const [data,  setData]  = useState(undefined);
  const [ready, setReady] = useState(false);
  const fetcherRef = useRef(fetcher);
  // Always keep ref current without re-triggering effect
  fetcherRef.current = fetcher;

  useEffect(() => {
    let mounted = true;
    setData(undefined);
    setReady(false);

    fetcherRef.current()
      .then((r) => { if (mounted) { setData(r ?? null); setReady(true); } })
      .catch(() => { if (mounted) { setData(null); setReady(true); } });

    return () => { mounted = false; };
  // deps controls WHEN to re-fetch, not the function identity
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, ready };
}

export function useParallelData(fetchers, deps = []) {
  const [merged, setMerged] = useState({});
  const [ready,  setReady]  = useState(false);
  const fetchersRef = useRef(fetchers);
  fetchersRef.current = fetchers;

  useEffect(() => {
    let mounted = true;
    let done = 0;
    const list = fetchersRef.current;
    const total = list.length;

    setMerged({});
    setReady(false);
    if (!total) { setReady(true); return; }

    list.forEach(({ key, fn }) => {
      fn()
        .then((r) => {
          if (!mounted || !r || typeof r !== "object") return;
          setMerged((p) => ({ ...p, ...r, [key]: r }));
        })
        .catch(() => {})
        .finally(() => {
          if (!mounted) return;
          if (++done === total) setReady(true);
        });
    });

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { merged, ready };
}

export const toId = (v) => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v.$oid) return v.$oid;
  return String(v);
};

export const pick = (...vals) => vals.find((v) => v !== undefined && v !== null);
