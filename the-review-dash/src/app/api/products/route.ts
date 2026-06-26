import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { PRODUCTS } from "@/lib/ingest";
import { logger } from "@/lib/logger";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const authError = verifyAuth(request);
  if (authError) return authError;
  try {
    const result = await pool.query(
      `SELECT DISTINCT asin, product_name as name FROM reviews ORDER BY product_name ASC`,
    );
    const dbProducts = result.rows;

    // Merge static and database products to ensure complete product list
    const productsMap = new Map<string, string>();
    PRODUCTS.forEach((p) => productsMap.set(p.asin, p.name));
    dbProducts.forEach((p) => {
      if (p.asin && p.name) {
        productsMap.set(p.asin, p.name);
      }
    });

    const products = Array.from(productsMap.entries()).map(([asin, name]) => ({
      asin,
      name,
    }));

    return NextResponse.json({ products });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("GET /api/products failed, falling back to static products", {
      message: msg,
    });
    return NextResponse.json({ products: PRODUCTS });
  }
}
