"use client";

import { useState, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function DocumentUpload({ dealId }: { dealId: string }) {
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("org_id")
        .eq("id", user.id)
        .single();

      const path = `${profile?.org_id}/${dealId}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("documents")
        .upload(path, file);
      if (uploadErr) throw uploadErr;

      // Guess doc type by filename keywords
      const name = file.name.toLowerCase();
      let docType = "other";
      if (name.includes("bol") || name.includes("bill")) docType = "bill_of_lading";
      else if (name.includes("lc") || name.includes("credit")) docType = "letter_of_credit";
      else if (name.includes("invoice")) docType = "commercial_invoice";
      else if (name.includes("coa")) docType = "coa";
      else if (name.includes("sgs") || name.includes("inspection"))
        docType = "inspection_report";

      const { error: insertErr } = await supabase.from("documents").insert({
        deal_id: dealId,
        org_id: profile?.org_id,
        doc_type: docType,
        filename: file.name,
        storage_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        uploaded_by: user.id,
      });
      if (insertErr) throw insertErr;

      // Fire AI parse (fire-and-forget)
      fetch("/api/parse-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, filename: file.name, docType }),
      }).catch(() => {});

      router.refresh();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFile}
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.txt"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="text-[11px] font-mono border border-ink-500 px-2.5 py-1 hover:border-amber hover:text-amber transition flex items-center gap-1.5 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Upload className="w-3 h-3" />
        )}
        Upload
      </button>
    </>
  );
}
