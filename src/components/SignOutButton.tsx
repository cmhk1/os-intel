"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const router = useRouter();
  async function onClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      onClick={onClick}
      className="p-1 text-ink-400 hover:text-amber transition-colors"
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
