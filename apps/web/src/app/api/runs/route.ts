import { NextResponse } from "next/server";
import { createRunSchema } from "@/lib/schemas";
import { runRepository } from "@/lib/storage";
import { validationError } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") || undefined;
  const limitValue = url.searchParams.get("limit");
  const limit = limitValue ? Number(limitValue) : undefined;

  return NextResponse.json({
    runs: runRepository.list({
      projectId,
      limit: Number.isFinite(limit) ? limit : undefined
    })
  });
}

export async function POST(request: Request) {
  const parsed = createRunSchema.safeParse(await request.json());
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  return NextResponse.json({ run: runRepository.create(parsed.data) }, { status: 201 });
}
