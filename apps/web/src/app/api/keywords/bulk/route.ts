import { NextResponse } from "next/server";
import { bulkKeywordsSchema } from "@/lib/schemas";
import { validationError } from "@/lib/http";
import { runRepository } from "@/lib/storage";

export async function POST(request: Request) {
  const parsed = bulkKeywordsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const run = runRepository.addKeywords(parsed.data.runId, parsed.data.suggestions);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }

  return NextResponse.json({ run, inserted: parsed.data.suggestions.length });
}
