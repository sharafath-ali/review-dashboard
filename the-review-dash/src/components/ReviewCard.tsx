import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Check, Calendar } from "lucide-react";
import StarRating from "./StarRating";

export interface ReviewRow {
  id: number;
  review_id: string;
  asin: string;
  product_name: string;
  source: string;
  author: string;
  title: string | null;
  body: string | null;
  rating: number;
  reviewed_at: string | null;
  ingested_at: string;
  verified: boolean;
  helpful_count: number;
}


const SOURCE_LABELS: Record<string, string> = {
  amazon_in: "Amazon India",
  amazon_com: "Amazon US",
};

const PRODUCT_SHORT: Record<string, string> = {
  "KardiaMobile 6L": "6L",
  "KardiaMobile 1-Lead": "1-Lead",
  "KardiaMobile Card": "Card",
};

function getRelativeTimeString(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  // Normalize to UTC start of day for comparison
  const dateMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowMs - dateMs;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return "";
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
}

export default function ReviewCard({ review }: { review: ReviewRow }) {
  const sourceLabel = SOURCE_LABELS[review.source] ?? review.source;
  const productShort = PRODUCT_SHORT[review.product_name] ?? review.product_name;

  const rawDate = review.reviewed_at || review.ingested_at;
  const dateDisplay = new Date(rawDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  
  const relativeTime = getRelativeTimeString(rawDate);

  return (
    <Card
      id={`review-${review.id}`}
      className="group flex flex-col gap-0 border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 rounded-xl overflow-hidden"
    >
      <CardHeader className="pb-2 pt-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating rating={review.rating} />
              <span className="text-xs font-semibold text-slate-700">
                {review.rating}.0
              </span>
              {review.verified && (
                <Badge variant="outline" className="text-[10px] font-medium text-emerald-700 border-emerald-200 bg-emerald-50 py-0 px-1.5 flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" />
                  Verified
                </Badge>
              )}
            </div>
            {review.title && (
              <CardTitle className="text-sm font-semibold text-slate-800 leading-snug">
                {review.title}
              </CardTitle>
            )}
          </div>
          <Badge
            variant="secondary"
            className="shrink-0 text-xs bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-50 px-2 py-0.5 rounded-md font-semibold"
          >
            KM {productShort}
          </Badge>
        </div>
        
        {/* Secondary Info: ASIN */}
        <div className="text-[11px] text-slate-400 font-mono mt-1">
          ASIN: {review.asin}
        </div>
      </CardHeader>

      {review.body && (
        <CardContent className="px-5 pb-3 pt-1 flex-1">
          <p className="text-sm text-slate-600 leading-relaxed">
            {review.body}
          </p>
        </CardContent>
      )}

      <Separator className="mx-5 w-auto bg-slate-100" />

      <CardContent className="px-5 py-3 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-700 truncate" title={review.author}>
              {review.author}
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1" title={relativeTime ? `${dateDisplay} (${relativeTime})` : dateDisplay}>
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{dateDisplay}</span>
              {relativeTime && <span className="text-slate-400 text-[10px]">({relativeTime})</span>}
            </span>
          </div>
          
          <a
            href={`https://www.amazon.in/dp/${review.asin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors font-medium hover:underline"
            title="View product on Amazon"
          >
            <span>{sourceLabel}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
