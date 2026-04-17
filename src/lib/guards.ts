import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/workbooks");
  return session;
}
