"use client";

import { useId } from "react";

const W = 720;
const H = 200;
const PAD = { top: 30, right: 64, bottom: 32, left: 46 };

const DAY_MS = 86_400_000;

function parseDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, (m ?? 1) - 1, d ?? 1);
}

function shortDay(day: string) {
  return new Date(parseDay(day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * Cumulative completed responses per day, with every day's count printed on
 * the chart rather than hidden behind a tooltip.
 */
export function ResponseTrend({
  days,
  target,
}: {
  days: { day: string; responses: number }[];
  target?: number | null;
}) {
  const gradientId = useId().replaceAll(":", "");
  if (days.length === 0) return null;

  const first = parseDay(days[0].day);
  const last = parseDay(days[days.length - 1].day);
  const span = Math.max(last - first, DAY_MS);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const peak = Math.max(
    ...days.map((d) => d.responses),
    target ? Math.min(target, Math.max(...days.map((d) => d.responses))) : 0,
    1,
  );
  // Round the ceiling up so gridlines land on friendly numbers.
  const ceiling = Math.max(5, Math.ceil(peak / 5) * 5);

  const x = (day: string) => PAD.left + ((parseDay(day) - first) / span) * innerW;
  const y = (v: number) => PAD.top + innerH - (v / ceiling) * innerH;

  const line = days.map((d, i) => `${i === 0 ? "M" : "L"}${x(d.day)} ${y(d.responses)}`).join(" ");
  const step = days.length > 1 ? Math.max(1, Math.ceil(days.length / 6)) : 1;
  const lastDay = days[days.length - 1];

  return (
    <figure className="mt-3">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[520px]"
          role="img"
          aria-label="Line graph of cumulative responses per day"
        >
          <defs>
            <linearGradient id={`resp-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const v = Math.round(ceiling * f);
            return (
              <g key={f}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y(v)}
                  y2={y(v)}
                  stroke="var(--color-ink-200)"
                  strokeDasharray={v === 0 ? undefined : "3 4"}
                />
                <text
                  x={PAD.left - 8}
                  y={y(v) + 4}
                  textAnchor="end"
                  className="fill-ink-500 text-[10px] tabular-nums"
                >
                  {v}
                </text>
              </g>
            );
          })}

          {target && target <= ceiling ? (
            <g>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(target)}
                y2={y(target)}
                stroke="var(--color-ink-500)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
              />
              <text
                x={W - PAD.right - 2}
                y={y(target) - 6}
                textAnchor="end"
                className="fill-ink-500 text-[10px] font-semibold"
              >
                Target {target}
              </text>
            </g>
          ) : null}

          {days.length > 1 ? (
            <path
              d={`${line} L${x(lastDay.day)} ${PAD.top + innerH} L${x(days[0].day)} ${PAD.top + innerH} Z`}
              fill={`url(#resp-${gradientId})`}
            />
          ) : null}

          {days.length > 1 ? (
            <path
              d={line}
              fill="none"
              stroke="var(--color-brand-600)"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {days.map((d, i) => (
            <g key={d.day}>
              {i === 0 || i === days.length - 1 || i % step === 0 ? (
                <text
                  key={`l-${d.day}`}
                  x={x(d.day)}
                  y={y(d.responses) - 10}
                  textAnchor="middle"
                  className="fill-brand-700 text-[10px] font-bold tabular-nums"
                >
                  {d.responses}
                </text>
              ) : null}
              <circle
                cx={x(d.day)}
                cy={y(d.responses)}
                r={i === days.length - 1 ? 4 : 2.75}
                fill="var(--color-surface)"
                stroke="var(--color-brand-600)"
                strokeWidth={2}
              >
                <title>{`${shortDay(d.day)}: ${d.responses} responses`}</title>
              </circle>
              {i % step === 0 || i === days.length - 1 ? (
                <text
                  key={`x-${d.day}`}
                  x={x(d.day)}
                  y={H - 11}
                  textAnchor={i === days.length - 1 ? "end" : i === 0 ? "start" : "middle"}
                  className="fill-ink-500 text-[10px]"
                >
                  {shortDay(d.day)}
                </text>
              ) : null}
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
