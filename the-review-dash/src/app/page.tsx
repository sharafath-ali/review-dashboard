"use client";

import { useCallback, useEffect, useState } from "react";
import ReviewCard, { ReviewRow } from "@/components/ReviewCard";
import RefreshButton from "@/components/RefreshButton";
import StatsBar from "@/components/StatsBar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ActivitySquare, X } from "lucide-react";

type Filter = { rating: string; search: string; asin: string };

export default function DashboardPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pages: 1,
    pageSize: 20,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>({
    rating: "",
    search: "",
    asin: "",
  });
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<{ asin: string; name: string }[]>(
    [],
  );

  // Fetch products list on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error("Failed to load products list", err);
      }
    }
    loadProducts();
  }, []);

  const fetchReviews = useCallback(async (f: Filter, p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (f.rating) params.set("rating", f.rating);
      if (f.search) params.set("search", f.search);
      if (f.asin) params.set("asin", f.asin);
      params.set("page", String(p));
      const res = await fetch(`/api/reviews?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReviews(data.reviews);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews(filter, page);
  }, [fetchReviews, filter, page]);

  const byRating = reviews.reduce<Record<number, number>>((acc, r) => {
    acc[r.rating] = (acc[r.rating] ?? 0) + 1;
    return acc;
  }, {});
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : NaN;

  const hasFilters = filter.rating || filter.search || filter.asin;

  function setFilterField(key: keyof Filter, value: string) {
    setPage(1);
    setFilter((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ActivitySquare className="w-5 h-5 text-blue-600" />
            <div>
              <span className="font-semibold text-sm text-slate-900 tracking-tight">
                Review Dash
              </span>
              <span className="hidden sm:inline text-slate-400 text-xs ml-2">
                KardiaMobile · Amazon India
              </span>
            </div>
          </div>
          <RefreshButton onRefreshed={() => fetchReviews(filter, page)} />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <StatsBar
          total={meta.total}
          avgRating={avgRating}
          byRating={byRating}
        />

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Input
            id="search-input"
            type="text"
            placeholder="Search reviews…"
            value={filter.search}
            onChange={(e) => setFilterField("search", e.target.value)}
            className="w-56 h-9 text-sm bg-white border-slate-200"
          />
          <Select
            value={filter.rating || "all"}
            onValueChange={(v) =>
              setFilterField("rating", v === "all" || !v ? "" : v)
            }
          >
            <SelectTrigger
              id="rating-filter"
              className="w-36 h-9 text-sm bg-white border-slate-200"
            >
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {r} Star{r !== 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filter.asin || "all"}
            onValueChange={(v) =>
              setFilterField("asin", v === "all" || !v ? "" : v)
            }
          >
            <SelectTrigger
              id="product-filter"
              className="w-48 h-9 text-sm bg-white border-slate-200"
            >
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.asin} value={p.asin}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              id="clear-filters-btn"
              variant="ghost"
              size="sm"
              onClick={() => {
                setPage(1);
                setFilter({ rating: "", search: "", asin: "" });
              }}
              className="h-9 gap-1.5 text-slate-500 hover:text-slate-700"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </Button>
          )}
        </div>

        <Separator className="mb-5" />

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-lg bg-white border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchReviews(filter, page)}
            >
              Retry
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <ActivitySquare className="w-10 h-10 text-slate-300" />
            <p className="text-sm text-slate-500">
              No reviews yet.{" "}
              <span className="font-medium text-slate-700">
                Click &ldquo;Fetch Reviews&rdquo; to pull data from Amazon.
              </span>
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-400 mb-4">
              Showing {reviews.length} of {meta.total} review
              {meta.total !== 1 ? "s" : ""}
              {filter.asin &&
                ` · ${products.find((p) => p.asin === filter.asin)?.name || filter.asin}`}
              {filter.rating && ` · ${filter.rating}★ only`}
              {filter.search && ` · "${filter.search}"`}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {/* Pagination */}
            {meta.pages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <Button
                  id="prev-page-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ← Prev
                </Button>
                <span className="text-xs text-slate-500 tabular-nums">
                  Page {page} of {meta.pages}
                </span>
                <Button
                  id="next-page-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                  disabled={page === meta.pages}
                >
                  Next →
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 mt-16 py-5 bg-white">
        <p className="text-center text-xs text-slate-400">
          Reviews sourced from Amazon India via Scrapingdog · Stored in
          PostgreSQL
        </p>
      </footer>
    </div>
  );
}
