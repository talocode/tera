import { useEffect, useState, type ReactNode } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();

export type NavTarget = {
  to: string;
  search?: Record<string, string | undefined>;
  params?: Record<string, string>;
};

function appBase(): string {
  const base = import.meta.env.BASE_URL || "/";
  if (base === "/") return "";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

function hashMode(): boolean {
  return appBase() !== "";
}

function resolveTo(opts: NavTarget): { path: string; query: string } {
  let path = opts.to;
  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      path = path.replace(`$${key}`, encodeURIComponent(value));
    }
  }
  const search = new URLSearchParams();
  if (opts.search) {
    for (const [key, value] of Object.entries(opts.search)) {
      if (value) search.set(key, value);
    }
  }
  return { path, query: search.toString() };
}

export function readRoute(): { path: string; mint?: string } {
  if (hashMode()) {
    const raw = window.location.hash.replace(/^#/, "") || "/";
    const [pathPart, queryPart] = raw.split("?");
    const path = pathPart?.startsWith("/") ? pathPart : `/${pathPart || ""}`;
    const mint = new URLSearchParams(queryPart || "").get("mint") ?? undefined;
    return { path: path || "/", mint };
  }
  const url = new URL(window.location.href);
  const base = appBase();
  let path = url.pathname || "/";
  if (base && path.startsWith(base)) path = path.slice(base.length) || "/";
  return { path, mint: url.searchParams.get("mint") ?? undefined };
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  for (const listener of listeners) listener();
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", notify);
  window.addEventListener("hashchange", notify);
}

export function navigate(opts: NavTarget) {
  const { path, query } = resolveTo(opts);
  if (hashMode()) {
    const hash = query ? `#${path}?${query}` : `#${path}`;
    window.history.pushState({}, "", `${appBase()}/${hash}`);
  } else {
    window.history.pushState({}, "", query ? `${path}?${query}` : path);
  }
  notify();
}

export function useNavigate() {
  return navigate;
}

export function Link({
  to,
  params,
  search,
  className,
  children,
}: NavTarget & { className?: string; children: ReactNode }) {
  const { path, query } = resolveTo({ to, params, search });
  const href = hashMode()
    ? `${appBase()}/${query ? `#${path}?${query}` : `#${path}`}`
    : query
      ? `${path}?${query}`
      : path;
  return (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigate({ to, params, search });
      }}
    >
      {children}
    </a>
  );
}

export function useRouterState<T>(opts: { select: (state: { location: { pathname: string } }) => T }): T {
  const [path, setPath] = useState(() => readRoute().path);
  useEffect(() => subscribe(() => setPath(readRoute().path)), []);
  return opts.select({ location: { pathname: path } });
}
