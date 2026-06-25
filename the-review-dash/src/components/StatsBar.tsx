import { Card, CardContent } from "@/components/ui/card";

interface Props {
  total: number;
  avgRating: number;
  byRating: Record<number, number>;
}

export default function StatsBar({ total, avgRating, byRating }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {/* Total */}
      <Card className="border border-slate-200 shadow-none bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Total Reviews
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            {total.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">in database</p>
        </CardContent>
      </Card>

      {/* Avg rating */}
      <Card className="border border-slate-200 shadow-none bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Avg Rating
          </p>
          <div className="flex items-end gap-1.5">
            <p className="text-3xl font-bold text-slate-900 tabular-nums">
              {isNaN(avgRating) ? "—" : avgRating.toFixed(1)}
            </p>
            <span className="text-amber-400 text-xl mb-0.5">★</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">current page</p>
        </CardContent>
      </Card>

      {/* Distribution */}
      <Card className="border border-slate-200 shadow-none bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Distribution
          </p>
          <div className="flex flex-col gap-1.5">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = byRating[r] ?? 0;
              const totalOnPage = Object.values(byRating).reduce(
                (a, b) => a + b,
                0,
              );
              const pct = totalOnPage > 0 ? (count / totalOnPage) * 100 : 0;
              return (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 w-5 text-right shrink-0">
                    {r}★
                  </span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-slate-400 w-5 text-right shrink-0 tabular-nums">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
