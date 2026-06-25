import { Review } from "@/lib/models";

/**
 * Contract every review provider must satisfy.
 * Swap Scrapingdog for any other source by implementing this interface.
 */
export interface IReviewProvider {
  readonly name: string;
  fetchReviews(asin: string, productName: string): Promise<Review[]>;
}
