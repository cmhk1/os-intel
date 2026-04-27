import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { name, company, email, message } = await req.json();

    if (!name || !company || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase.from("contact_submissions").insert([{
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    }]);

    if (error) {
      console.error("Contact insert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Contact route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
