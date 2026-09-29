import { useEffect, useState, type ReactNode } from "react";

type Listener = () => void;
const listeners = new Set<Listener>();

export type NavTarget = {
  to: string;
  search?: Record<string, string | undefined>;
  params?: Record<string, string>;
};

function currentPath(): string {
  return window.location.pathname || "/";
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
}

export function navigate(opts: NavTarget) {
  let to = opts.to;
  if (opts.params) {
    for (const [key, value] of Object.entries(opts.params)) {
      to = to.replace(`$${key}`, encodeURIComponent(value));
    }
  }
  const search = new URLSearchParams();
  if (opts.search) {
    for (const [key, value] of Object.entries(opts.search)) {
      if (value) search.set(key, value);
    }
  }
  const query = search.toString();
  window.history.pushState({}, "", query ? `${to}?${query}` : to);
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
  return (
    <a
      href={to}
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
  const [path, setPath] = useState(currentPath);
  useEffect(() => subscribe(() => setPath(currentPath())), []);
  return opts.select({ location: { pathname: path } });
}
