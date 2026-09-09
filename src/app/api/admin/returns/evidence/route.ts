import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/server/auth/roles";

export async function GET(request: Request) {
  await requireRoles(["support", "warehouse", "admin", "super_admin"]);
  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!path || path.includes(".."))
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  const { data, error } = await createAdminClient()
    .storage.from("return-evidence")
    .createSignedUrl(path, 300);
  if (error || !data?.signedUrl)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
