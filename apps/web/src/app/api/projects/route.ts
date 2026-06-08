import { NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/schemas";
import { projectRepository } from "@/lib/storage";
import { validationError } from "@/lib/http";

export async function GET() {
  return NextResponse.json({ projects: projectRepository.list() });
}

export async function POST(request: Request) {
  const parsed = createProjectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  return NextResponse.json({ project: projectRepository.create(parsed.data) }, { status: 201 });
}
