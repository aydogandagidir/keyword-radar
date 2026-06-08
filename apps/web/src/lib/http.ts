import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function validationError(error: ZodError) {
  return NextResponse.json(
    {
      error: "Validation failed",
      issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }))
    },
    { status: 400 }
  );
}
