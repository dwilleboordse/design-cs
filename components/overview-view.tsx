"use client";

import type { AppState, Brand, Month } from "@/lib/types";
import { Palette, Video, Sparkles } from "lucide-react";

export function OverviewView({ state, month }: { state: AppState; month: Month }) {
  const designerById = new Map(state.designers.map((d) => [d.id, d.name]));
  const editorById = new Map(state.editors.map((e) => [e.id, e.name]));
  const ugcById = new Map((state.ugcManagers || []).map((u) => [u.id, u.name]));
  const stratById = new Map(state.strategists.map((s) => [s.id, s.name]));

  const groups = month.groups.filter((g) => g.brands.length > 0);
  const totalBrands = groups.reduce((acc, g) => acc + g.brands.length, 0);

  return (
    <div className="max-w-[1100px] mx-auto bg-panel rounded-2xl border border-border overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-gradient-to-br from-panel to-panel2">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">{month.label}</h1>
            <p className="text-sm text-muted mt-0.5">
              {groups.length} strategist{groups.length === 1 ? "" : "s"} · {totalBrands} brand
              {totalBrands === 1 ? "" : "s"}
            </p>
          </div>
          <Legend />
        </div>
      </div>

      {/* Strategist groups */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-8">
        {groups.map((g) => (
          <section key={g.id}>
            <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-border">
              <h2 className="text-base font-semibold text-text uppercase tracking-wide">
                {stratById.get(g.strategistId || "") || "Unassigned"}
              </h2>
              <span className="text-[11px] text-muted">
                {g.brands.length} brand{g.brands.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {g.brands.map((b) => (
                <BrandLine
                  key={b.id}
                  brand={b}
                  designerById={designerById}
                  editorById={editorById}
                  ugcById={ugcById}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="px-8 py-3 border-t border-border bg-panel2/40 text-[10px] text-muted flex justify-between">
        <span>Design / CS allocation</span>
        <span>Generated {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted">
      <span className="inline-flex items-center gap-1">
        <Palette size={11} className="text-accent" /> Designer
      </span>
      <span className="inline-flex items-center gap-1">
        <Video size={11} className="text-warning" /> Editor
      </span>
      <span className="inline-flex items-center gap-1">
        <Sparkles size={11} className="text-fuchsia-400" /> UGC
      </span>
    </div>
  );
}

function BrandLine({
  brand,
  designerById,
  editorById,
  ugcById,
}: {
  brand: Brand;
  designerById: Map<string, string>;
  editorById: Map<string, string>;
  ugcById: Map<string, string>;
}) {
  const designers = brand.designerIds.map((id) => designerById.get(id)).filter(Boolean) as string[];
  const editors = brand.editorIds.map((id) => editorById.get(id)).filter(Boolean) as string[];
  const ugc = brand.ugcEnabled
    ? (brand.ugcManagerIds.map((id) => ugcById.get(id)).filter(Boolean) as string[])
    : [];

  return (
    <li className="flex items-start gap-3 py-1">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-text truncate">{brand.name}</div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {designers.length > 0 && (
            <TagGroup color="accent" icon={<Palette size={10} />} names={designers} />
          )}
          {editors.length > 0 && (
            <TagGroup color="warning" icon={<Video size={10} />} names={editors} />
          )}
          {ugc.length > 0 && (
            <TagGroup color="fuchsia" icon={<Sparkles size={10} />} names={ugc} />
          )}
          {designers.length === 0 && editors.length === 0 && ugc.length === 0 && (
            <span className="text-[11px] text-muted italic">Unassigned</span>
          )}
        </div>
      </div>
    </li>
  );
}

function TagGroup({
  color,
  icon,
  names,
}: {
  color: "accent" | "warning" | "fuchsia";
  icon: React.ReactNode;
  names: string[];
}) {
  const cls =
    color === "accent"
      ? "bg-accent/10 border-accent/40 text-accent"
      : color === "warning"
        ? "bg-warning/10 border-warning/40 text-warning"
        : "bg-fuchsia-500/10 border-fuchsia-500/40 text-fuchsia-300";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] ${cls}`}>
      {icon}
      <span>{names.join(", ")}</span>
    </span>
  );
}
