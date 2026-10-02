import { useEffect, useState } from "react";
import { fetchChart, type Candle } from "@/wallet/jupiter";

function line(points: Candle[], live: number | null, width: number, height: number): { d: string; up: boolean } | null {
  const data = [...points];
  if (live != null && Number.isFinite(live)) data.push({ time: Math.floor(Date.now() / 1000), close: live });
  if (data.length < 2) return null;
  const minT = data[0].time;
  const maxT = data[data.length - 1].time;
  const spanT = Math.max(1, maxT - minT);
  const closes = data.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || Math.abs(max) || 1;
  const d = data
    .map((point, index) => {
      const x = ((point.time - minT) / spanT) * width;
      const y = height - 4 - ((point.close - min) / span) * (height - 8);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return { d, up: closes[closes.length - 1] >= closes[0] };
}

export function ChartSvg({ points, live, height = 140 }: { points: Candle[] | null; live: number | null; height?: number }) {
  if (points === null) return <p className="text-sm text-muted">Loading chart…</p>;
  const drawn = line(points, live, 320, height);
  if (!drawn) return <p className="text-sm text-muted">No trades in this window. Nothing is drawn.</p>;
  return (
    <svg viewBox={`0 0 320 ${height}`} className="w-full" role="img" aria-label="Price chart">
      <path d={drawn.d} fill="none" stroke={drawn.up ? "#3ddc97" : "#ff5d5d"} strokeWidth="2" />
    </svg>
  );
}

export function Sparkline({ mint, live }: { mint: string; live: number | null }) {
  const [points, setPoints] = useState<Candle[] | null>(null);
  useEffect(() => {
    let stop = false;
    const load = () => {
      void fetchChart(mint, "1_HOUR", 36)
        .then((rows) => {
          if (!stop) setPoints(rows);
        })
        .catch(() => {
          if (!stop) setPoints([]);
        });
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [mint]);
  return <ChartSvg points={points} live={live} height={36} />;
}

const RANGES = [
  { id: "1H", interval: "1_MINUTE", candles: 60 },
  { id: "1D", interval: "15_MINUTE", candles: 96 },
  { id: "1W", interval: "1_HOUR", candles: 168 },
] as const;

export function TokenChart({ mint, live }: { mint: string; live: number | null }) {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("1D");
  const [points, setPoints] = useState<Candle[] | null>(null);
  const selected = RANGES.find((item) => item.id === range) ?? RANGES[1];
  useEffect(() => {
    let stop = false;
    setPoints(null);
    const load = () => {
      void fetchChart(mint, selected.interval, selected.candles)
        .then((rows) => {
          if (!stop) setPoints(rows);
        })
        .catch(() => {
          if (!stop) setPoints([]);
        });
    };
    load();
    const timer = window.setInterval(load, 60_000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [mint, selected.interval, selected.candles]);
  return (
    <div>
      <div className="mb-3 flex gap-2">
        {RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`min-h-9 rounded-full px-3 text-xs ${item.id === range ? "bg-primary text-primary-ink" : "border border-line text-muted"}`}
            onClick={() => setRange(item.id)}
          >
            {item.id}
          </button>
        ))}
      </div>
      <ChartSvg points={points} live={live} />
      <p className="mt-2 text-xs text-muted">Jupiter last-swap price. The line updates every 12 seconds. Empty windows stay empty.</p>
    </div>
  );
}
