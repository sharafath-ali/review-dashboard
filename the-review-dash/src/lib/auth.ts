import { NextResponse } from "next/server";

/**
 * Reusable helper to verify shared bearer secret auth.
 * Returns null if authorized, or a 401 response if unauthorized/missing.
 */
export function verifyAuth(request: Request): NextResponse | null {
  const secret = process.env.INGEST_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "Unauthorized: INGEST_SECRET is not configured on the server." },
      { status: 401 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid token." },
      { status: 401 },
    );
  }

  return null;
}
