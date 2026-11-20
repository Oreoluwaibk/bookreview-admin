import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { deskCookie, hasDeskSession } from "@/lib/session";

export async function requireDesk() {
  await connection();
  const token = (await cookies()).get(deskCookie)?.value;
  if (!(await hasDeskSession(token, Date.now()))) {
    redirect("/login");
  }
}
