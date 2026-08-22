import { useId } from "react";
import { cn } from "@/lib/utils";

export const CHART_PALETTE = [
  "#0d9488",
  "#0891b2",
  "#6366f1",
  "#f59e0b",
  "#ec4899",
  "#22c55e",
  "#f97316",
];

export const STATUS_CHART_COLORS: Record<string, string> = {
  SCHEDULED: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
  NO_SHOW: "#f59e0b",
};

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

/* ---------------------------------- Donut --------------------------------- */

interface DonutChartProps {
  data: ChartDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export function DonutChart({
  data,
  size = 190,
  thickness = 26,
  centerLabel = "Total",
  centerValue,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-8", className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={thickness}
          />
          {total > 0 &&
            data.map((d) => {
              const fraction = d.value / total;
              const dash = fraction * circumference;
              const offset = accumulated;
              accumulated += dash;
              if (dash <= 0) return null;
              return (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={d.color ?? "#94a3b8"}
                  strokeWidth={thickness}
                  strokeDasharray={`${Math.max(dash - 2, 0.5)} ${circumference}`}
                  strokeDashoffset={-offset}
                />
              );
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {centerLabel}
          </span>
          <span className="text-2xl font-bold text-slate-900">{centerValue ?? total}</span>
        </div>
      </div>

      <ul className="min-w-[160px] flex-1 space-y-2.5">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: d.color ?? "#94a3b8" }}
            />
            <span className="flex-1 text-sm text-slate-600">{d.label}</span>
            <span className="text-sm font-semibold text-slate-900">{d.value}</span>
            {total > 0 && (
              <span className="w-12 text-right text-xs text-slate-400">
                {Math.round((d.value / total) * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- Bar list -------------------------------- */

interface BarListProps {
  data: ChartDatum[];
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}

export function BarList({ data, formatValue, emptyMessage }: BarListProps) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        {emptyMessage ?? "No data to display"}
      </p>
    );
  }
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3.5">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-center justify-between gap-4">
            <span className="truncate text-sm font-medium text-slate-700">{d.label}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-900">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max((d.value / max) * 100, 2)}%`,
                background: `linear-gradient(90deg, ${
                  d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]
                }, ${d.color ?? CHART_PALETTE[i % CHART_PALETTE.length]}bb)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
/* ------------------------------- Area chart ------------------------------- */

interface AreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}

export function AreaChart({
  data,
  height = 230,
  color = "#0d9488",
  formatValue,
  emptyMessage,
}: AreaChartProps) {
  const gradientId = useId().replace(/:/g, "");

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        {emptyMessage ?? "No data to display"}
      </p>
    );
  }

  const width = 640;
  const padX = 52;
  const padYTop = 16;
  const padYBottom = 30;
  const innerW = width - padX - 14;
  const innerH = height - padYTop - padYBottom;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: padX + stepX * i,
    y: padYTop + innerH - (d.value / maxValue) * innerH,
    label: d.label,
    value: d.value,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${(
    padYTop + innerH
  ).toFixed(1)} L${points[0].x.toFixed(1)},${(padYTop + innerH).toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {gridLines.map((g) => {
        const y = padYTop + innerH * g;
        return (
          <g key={g}>
            <line
              x1={padX}
              x2={width - 14}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {formatValue ? formatValue(maxValue * (1 - g)) : Math.round(maxValue * (1 - g))}
            </text>
          </g>
        );
      })}

      <path d={areaPath} fill={`url(#area-${gradientId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={`${p.label}-${i}`}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke={color} strokeWidth="2" />
          {i % labelEvery === 0 && (
            <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

/* -------------------------------- Stat card ------------------------------- */

interface StatCardProps {
  label: string;
  value: string | number;
  accentClass?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export function StatCard({ label, value, accentClass, icon, hint }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border p-5 shadow-[0_14px_34px_-24px_rgba(15,23,42,0.4)]",
        accentClass ??
          "border-teal-100 bg-gradient-to-br from-teal-50/90 to-cyan-50/60 text-teal-900"
      )}
    >
      {icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/70">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
        <p className="mt-0.5 text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] opacity-70">{hint}</p>}
      </div>
    </div>
  );
}
