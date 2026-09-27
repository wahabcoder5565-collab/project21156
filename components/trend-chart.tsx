"use client";

import { useId, useMemo, useState } from "react";

import { optionColor } from "@/lib/utils";
import type { TrendQuestion } from "@/lib/types";

const W = 720;
const H = 260;
const PAD = { top: 26, right: 58, bottom: 34, left: 44 };

const DAY_MS = 86_400_000;

function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

function shortDay(day: string) {
  const ms = parseDay(day);
  return new Date(ms).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

function axisTicks(max: number) {
  const step = max <= 10 ? 5 : max <= 25 ? 10 : max <= 55 ? 20 : 25;
  const ticks: number[] = [];
  for (let v = 0; v <= max; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

/**
 * Cumulative line graph for one question, one line per answer option.
 * Every plotted point carries its own printed value, so no number is hidden
 * behind a hover-only tooltip.
 */
export function TrendChart({
  question,
  days,
}: {
  question: TrendQuestion;
  days: string[];
}) {
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const gradientId = useId().replaceAll(":", "");

  const scaleMax = question.scale_max ?? 0;
  const isScale = question.series.some((s) => s.kind === "scale");
  const ceiling = isScale && scaleMax > 0 ? scaleMax : 100;

  const series = question.series.filter((s) => !hidden[s.label]);
  const byDay = useMemo(
    () =>
      new Map(
        question.series.map((s) => [
          s.label,
          new Map(s.points.map((p) => [p.day, p])),
        ]),
      ),
    [question.series],
  );

  // Colours are keyed to the full option list so hiding a line never
  // recolours the others.
  const colorMap = useMemo(
    () =>
      new Map(
        question.series.map((s, i) => [s.label, optionColor({ color: s.color }, i)]),
      ),
    [question.series],
  );

  const dates = days.length
    ? days
    : Array.from(new Set(question.series.flatMap((s) => s.points.map((p) => p.day))));

  if (dates.length === 0) return null;

  const first = parseDay(dates[0]);
  const last = parseDay(dates[dates.length - 1]);
  const span = Math.max(last - first, DAY_MS);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (day: string) =>
    PAD.left + ((parseDay(day) - first) / span) * innerW;
  const y = (value: number) =>
    PAD.top + innerH - (Math.min(value, ceiling) / ceiling) * innerH;

  const ticks = axisTicks(ceiling);
  const gridStep = dates.length > 1 ? Math.max(1, Math.ceil(dates.length / 6)) : 1;

  const LABEL_STEP = 13;
  const LABEL_H = 11;
  const MIN_LABEL_Y = 12;
  const MAX_LABEL_Y = H - 6;

  const labels = dates.flatMap((day) => {
    const cx = x(day);
    const column = series
      .map((s) => {
        const point = byDay.get(s.label)?.get(day);
        if (!point) return null;
        return {
          key: `${s.label}-${day}`,
          text:
            isScale && point.value ? point.value.toFixed(1) : `${point.value}%`,
          pointY: y(point.value),
          color: colorMap.get(s.label) ?? "#141926",
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null)
      .sort((a, b) => a.pointY - b.pointY);

    if (!column.length) return [];

    const total = LABEL_STEP * (column.length - 1);
    const mean =
      column.reduce((sum, v) => sum + v.pointY, 0) / column.length;
    let start = mean - total / 2;
    const pastBottom = start + total + LABEL_H - MAX_LABEL_Y;
    if (pastBottom > 0) start -= pastBottom;
    if (start < MIN_LABEL_Y) start = MIN_LABEL_Y;

    return column.map((v, i) => ({
      ...v,
      x: cx,
      y: start + i * LABEL_STEP + 8,
      anchorEnd: cx > W - PAD.right - 14,
    }));
  });

  return (
    <figure className="mt-5">
      <figcaption className="sr-only">
        Cumulative share of answers per day for {question.prompt}
      </figcaption>

      <div className="flex flex-wrap gap-2">
        {question.series.map((s) => {
          const off = hidden[s.label];
          return (
            <button
              key={s.label}
              type="button"
              onClick={() =>
                setHidden((prev) => ({ ...prev, [s.label]: !prev[s.label] }))
              }
              aria-pressed={!off}
              className={`chip ring-1 ring-inset transition ${
                off
                  ? "bg-ink-50 text-ink-400 ring-ink-200"
                  : "bg-ink-100 text-ink-700 ring-ink-200/70 hover:bg-ink-200/70"
              }`}
            >
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor: off
                    ? "#b0b8c8"
                    : (colorMap.get(s.label) ?? "#141926"),
                }}
                aria-hidden
              />
              {s.label}
            </button>
          );
        })}
        <span className="chip bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">
          {isScale ? "Cumulative mean" : "Cumulative share"}
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[560px]"
          role="img"
          aria-label={`Line graph of daily answer share for ${question.prompt}`}
        >
          <defs>
            <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--color-ink-200)"
                strokeDasharray={t === 0 ? undefined : "3 4"}
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 4}
                textAnchor="end"
                className="fill-ink-500 text-[10px] tabular-nums"
              >
                {t}
              </text>
            </g>
          ))}

          {dates.map((day, i) =>
            i % gridStep === 0 || i === dates.length - 1 ? (
              <text
                key={day}
                x={x(day)}
                y={H - 12}
                textAnchor={i === dates.length - 1 ? "end" : i === 0 ? "start" : "middle"}
                className="fill-ink-500 text-[10px]"
              >
                {shortDay(day)}
              </text>
            ) : null,
          )}

          {series.map((s, si) => {
            const map = byDay.get(s.label);
            if (!map) return null;
            const color = colorMap.get(s.label) ?? "#141926";
            const coords = dates
              .map((day) => {
                const point = map.get(day);
                return point ? { x: x(day), y: y(point.value), day } : null;
              })
              .filter((v): v is { x: number; y: number; day: string } => v !== null);
            if (!coords.length) return null;

            const line = coords
              .map((c, i) => `${i === 0 ? "M" : "L"}${c.x} ${c.y}`)
              .join(" ");

            return (
              <g key={s.label}>
                {coords.length > 1 ? (
                  <>
                    <path
                      d={`${line} L${coords[coords.length - 1].x} ${PAD.top + innerH} L${coords[0].x} ${PAD.top + innerH} Z`}
                      fill={`url(#fill-${gradientId})`}
                      opacity={si === 0 ? 1 : 0}
                    />
                    <path
                      d={line}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </>
                ) : null}
                {coords.map((c) => (
                  <circle
                    key={c.day}
                    cx={c.x}
                    cy={c.y}
                    r={3.5}
                    fill="var(--color-surface)"
                    stroke={color}
                    strokeWidth={2}
                  />
                ))}
              </g>
            );
          })}

          {labels.map((l) => (
            <g key={l.key}>
              {Math.abs(l.y - 4 - l.pointY) > 5 ? (
                <line
                  x1={l.x}
                  y1={l.pointY}
                  x2={l.x}
                  y2={l.y - 4}
                  stroke={l.color}
                  strokeWidth={0.75}
                  opacity={0.45}
                />
              ) : null}
              <text
                x={l.x}
                y={l.y}
                textAnchor={l.anchorEnd ? "end" : "middle"}
                className="text-[10px] font-semibold tabular-nums"
                fill={l.color}
              >
                {l.text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-semibold text-ink-600 hover:text-ink-900">
          Show every number as a table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-xs">
            <thead>
              <tr className="border-b border-ink-200 text-left text-ink-600">
                <th className="py-1.5 pr-4 font-semibold">Series</th>
                {dates.map((day) => (
                  <th key={day} className="py-1.5 pr-4 text-right font-semibold">
                    {shortDay(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.series.map((s) => (
                <tr key={s.label} className="border-b border-ink-100 last:border-0">
                  <th scope="row" className="py-1.5 pr-4 text-left font-medium text-ink-800">
                    {s.label}
                  </th>
                  {dates.map((day) => {
                    const point = s.points.find((p) => p.day === day);
                    return (
                      <td
                        key={day}
                        className="py-1.5 pr-4 text-right tabular-nums text-ink-700"
                      >
                        {point ? point.value : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
