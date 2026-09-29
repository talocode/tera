import { Link, useRouterState } from "@/nav";
import { ArrowDownLeft, ArrowUpRight, House, Settings, Activity } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { clusterLabel } from "@/wallet/network";
import { useWallet } from "@/wallet/store";

const LOCK_MS = 5 * 60 * 1000;

const NAV = [
  { to: "/home", label: "Home", icon: House },
  { to: "/send", label: "Send", icon: ArrowUpRight },
  { to: "/receive", label: "Receive", icon: ArrowDownLeft },
  { to: "/activity", label: "Activity", icon: Activity },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function useEmbedded() {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(new URLSearchParams(window.location.search).get("embed") === "1");
  }, []);
  return embedded;
}

export function Frame({
  children,
  nav = false,
  title,
  subtitle,
}: {
  children?: ReactNode;
  nav?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const cluster = useWallet((state) => state.cluster);
  const embedded = useEmbedded();
  useEffect(() => {
    if (!nav) return;
    let timer = window.setTimeout(() => useWallet.getState().lock(), LOCK_MS);
    const bump = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => useWallet.getState().lock(), LOCK_MS);
    };
    window.addEventListener("pointerdown", bump);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", bump);
    };
  }, [nav]);
  return (
    <div className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl">
        <aside className={embedded ? "hidden" : "sticky top-0 hidden h-screen w-72 shrink-0 flex-col justify-between border-r border-line px-8 py-10 lg:flex"}>
          <div>
            <Brand />
            <p className="mt-6 text-sm leading-6 text-muted">
              Self-custodial Solana wallet for the Tera ecosystem. Keys stay in this browser.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{clusterLabel(cluster)}</p>
        </aside>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-28 pt-6 lg:px-8 lg:pb-10">
          <div className={`mb-6 flex items-center justify-between ${embedded ? "" : "lg:hidden"}`}>
            <Brand />
            <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
              {cluster === "mainnet-beta" ? "Mainnet" : "Devnet"}
            </span>
          </div>
          {title ? (
            <header className="mb-6">
              <h1 className="font-display text-4xl leading-none text-fg">{title}</h1>
              {subtitle ? <p className="mt-3 text-sm leading-6 text-muted">{subtitle}</p> : null}
            </header>
          ) : null}
          <div className="flex-1">{children}</div>
        </div>
      </div>
      {nav ? <BottomNav /> : null}
    </div>
  );
}

function useSiteTheme() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const read = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");
    setTheme(read());
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return theme;
}

function Brand() {
  const theme = useSiteTheme();
  const light = theme === "light";
  return (
    <div className="flex items-center gap-3">
      <span className={`grid size-10 place-items-center overflow-hidden rounded-xl border ${light ? "border-black/10 bg-white" : "border-white/20 bg-[#0a0a0a]"}`}>
        <img src="/images/TERA_LOGO_ONLY.png" alt="Tera" className={`size-7 object-contain ${light ? "" : "invert"}`} />
      </span>
      <div>
        <p className="text-sm font-semibold tracking-wide text-fg">Tera Wallet</p>
        <p className="text-xs text-muted">Non-custodial</p>
      </div>
    </div>
  );
}

function BottomNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {NAV.map((item) => {
          const active = path === item.to;
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[11px] ${active ? "text-primary" : "text-muted"}`}
              >
                <Icon className="size-5" strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="mb-6 hidden gap-2 lg:flex">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`rounded-full px-3 py-2 text-sm ${path === item.to ? "bg-primary text-primary-ink" : "text-muted"}`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  tone = "primary",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  tone?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const tones = {
    primary: "bg-primary text-primary-ink",
    ghost: "border border-line bg-surface text-fg",
    danger: "bg-danger text-primary-ink",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-12 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold transition disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  type = "text",
  autoComplete = "off",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: "decimal" | "text" | "numeric";
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        type={type}
        autoComplete={autoComplete}
        spellCheck={false}
        className="min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-fg outline-none placeholder:text-muted"
      />
    </label>
  );
}

export function Notice({ children, tone = "warn" }: { children: ReactNode; tone?: "warn" | "danger" | "info" }) {
  const tones = {
    warn: "border-warning/40 text-warning",
    danger: "border-danger/40 text-danger",
    info: "border-line text-muted",
  };
  return <p className={`rounded-2xl border bg-surface px-4 py-3 text-sm leading-6 ${tones[tone]}`}>{children}</p>;
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-card border border-line bg-surface p-4">{children}</div>;
}
