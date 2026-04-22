import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Ensure demo org exists
  await admin.from("organizations").upsert(
    { id: DEMO_ORG_ID, name: "Demo Trading Co.", slug: "demo-trading" },
    { onConflict: "id", ignoreDuplicates: true }
  );

  // Create profile if the trigger hasn't run yet (race condition safety)
  await admin.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? "",
      full_name: user.user_metadata?.full_name ?? user.email ?? "",
      org_id: DEMO_ORG_ID,
    },
    { onConflict: "id", ignoreDuplicates: false }
  );

  // If profile exists but has no org, assign demo org
  await admin
    .from("profiles")
    .update({ org_id: DEMO_ORG_ID })
    .eq("id", user.id)
    .is("org_id", null);

  return NextResponse.json({ ok: true });
}
