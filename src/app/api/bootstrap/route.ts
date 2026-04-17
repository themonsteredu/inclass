import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const Body = z.object({
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9._-]+$/),
  name: z.string().min(1).max(80),
  password: z.string().min(6).max(80),
});

// One-shot bootstrap: creates the first admin account if and only if no
// admin exists yet. Subsequent calls are rejected.
export async function POST(req: NextRequest) {
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount > 0) {
    return new NextResponse("Already initialized", { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return new NextResponse("Invalid input", { status: 400 });
  }
  const { username, name, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { username } });
  if (existing) {
    return new NextResponse("Username already exists", { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.user.create({
    data: { username, name, passwordHash, role: "ADMIN" },
  });
  return NextResponse.json({ ok: true });
}
