"use client";

import type { PollResults } from "@/lib/types";

function toCsv(results: PollResults) {
  const rows: string[][] = [];
  const esc = (value: string) => `"${value.replace(/"/g, '""')}"`;

  rows.push(["YouPulse results export"]);
  rows.push(["Poll", results.poll.title]);
  rows.push(["Slug", results.poll.slug]);
  rows.push(["Responses", String(results.total_responses)]);
  rows.push([]);

  for (const question of results.questions) {
    rows.push([`Q${question.position}. ${question.prompt}`]);
    if (question.options.length) {
      rows.push(["Option", "Votes", "Share of respondents (%)"]);
      for (const option of question.options) {
        rows.push([option.label, String(option.votes), String(option.pct)]);
      }
    }
    if (question.scale_distribution.length) {
      rows.push(["Value", "Votes"]);
      for (const bucket of question.scale_distribution) {
        rows.push([String(bucket.value), String(bucket.votes)]);
      }
      if (question.mean !== null) rows.push(["Mean", String(question.mean)]);
    }
    rows.push([]);
  }

  if (results.text_responses.length) {
    rows.push(["Open responses"]);
    rows.push(["Response", "Age band", "Country"]);
    for (const item of results.text_responses) {
      rows.push([item.body, item.age_band ?? "", item.country ?? ""]);
    }
  }

  return rows.map((row) => row.map(esc).join(",")).join("\r\n");
}

export function ExportButtons({
  results,
  slug,
}: {
  results: PollResults;
  slug: string;
}) {
  const download = () => {
    const blob = new Blob([toCsv(results)], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}-results.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={download} className="btn btn-ghost btn-sm">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" />
        </svg>
        Download CSV
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="btn btn-ghost btn-sm"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 9V4h10v5M7 19H5v-7h14v7h-2M8 15h8v6H8z" />
        </svg>
        Print
      </button>
    </div>
  );
}
