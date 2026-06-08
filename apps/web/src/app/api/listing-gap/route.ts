import { NextResponse } from "next/server";
import { analyzeListingGap } from "@bluedev/scoring";
import { validationError } from "@/lib/http";
import { listingGapSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const parsed = listingGapSchema.safeParse(await request.json());
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  return NextResponse.json({
    analysis: analyzeListingGap(parsed.data.content, parsed.data.suggestions)
  });
}
