import {
  Search,
  X,
  ArrowUpDown,
  Grid2X2,
  List,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";

import type {
  FilterType,
  SortType,
  ViewType,
  DocumentCounts,
} from "@/lib/utils/document";

type Props = {
  search: string;
  setSearch: (value: string) => void;
  filter: FilterType;
  setFilter: (value: FilterType) => void;
  sort: SortType;
  setSort: (value: SortType) => void;
  view: ViewType;
  setView: (value: ViewType) => void;
  counts: DocumentCounts;
  total: number;
  filteredTotal: number;
  loading: boolean;
  onRefresh: () => void;
};

export default function LibraryToolbar({
  search,
  setSearch,
  filter,
  setFilter,
  sort,
  setSort,
  view,
  setView,
  counts,
  total,
  filteredTotal,
  loading,
  onRefresh,
}: Props) {
  const filters: {
    value: FilterType;
    label: string;
    count: number;
  }[] = [
      { value: "all", label: "All documents", count: counts.all },
      { value: "ready", label: "Ready", count: counts.ready },
      { value: "processing", label: "Processing", count: counts.processing },
      { value: "failed", label: "Failed", count: counts.failed },
    ];

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            All documents
          </h2>
          <p className="mt-1 text-sm text-white/45">
            {filteredTotal} of {total} documents
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/65 transition-colors hover:bg-white/5 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
          />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your documents..."
            className="h-12 w-full rounded-xl border border-white/10  pl-11 pr-10 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-orange-300/40"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 backdrop-blur-3xl  sm:flex-none">
            <ArrowUpDown
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortType)}
              aria-label="Sort documents"
              className="h-12 w-full appearance-none rounded-xl border border-white/10 glass backdrop-blur-3xl backdrop-saturate-150 pl-9 pr-9 text-sm text-yellow-400/80 outline-none focus:border-orange-300/40 sm:w-44"
            >
              <option className="bg-[#1b111a] text-white" value="newest">
                Newest first
              </option>
              <option className="bg-[#1b111a] text-white" value="oldest">
                Oldest first
              </option>
              <option className="bg-[#1b111a] text-white" value="name">
                Name A–Z
              </option>
              <option className="bg-[#1b111a] text-white" value="size">
                Largest first
              </option>
            </select>
          </div>

          <div className="flex h-12 items-center gap-1 rounded-xl border border-white/10 p-1 glass backdrop-blur-3xl backdrop-saturate-150">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={`flex size-9 items-center justify-center rounded-lg transition-colors ${view === "grid"
                ? "bg-orange-300/15 text-orange-300"
                : "text-white/40 hover:text-white"
                }`}
            >
              <Grid2X2 size={18} />
            </button>

            <button
              type="button"
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={`flex size-9 items-center justify-center rounded-lg transition-colors ${view === "list"
                ? "bg-orange-300/15 text-orange-300"
                : "text-white/40 hover:text-white"
                }`}
            >
              <List size={19} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SlidersHorizontal size={16} className="mr-1 text-white/35" />

        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${filter === item.value
              ? "border-orange-300/30 bg-gradient-to-r from-orange-300/20 to-pink-400/10 text-orange-200"
              : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
              }`}
          >
            {item.label}
            <span className="ml-2 opacity-60">{item.count}</span>
          </button>
        ))}
      </div>
    </section>
  );
}