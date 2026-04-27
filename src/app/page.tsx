"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  const [heroEmail, setHeroEmail] = useState("");
  const [heroError, setHeroError] = useState(false);
  const [heroSubmitting, setHeroSubmitting] = useState(false);

  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactServerError, setContactServerError] = useState("");
  const [contactFields, setContactFields] = useState({ name: "", company: "", email: "", message: "" });
  const [contactErrors, setContactErrors] = useState<Record<string, boolean>>({});

  async function handleHeroSubmit(e: React.FormEvent) {
    e.preventDefault();
    const email = heroEmail.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) { setHeroError(true); return; }
    setHeroError(false);
    setHeroSubmitting(true);
    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    // Redirect regardless — email saved best-effort
    router.push("/dashboard");
  }

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    const required = ["name", "company", "email", "message"] as const;
    const errors: Record<string, boolean> = {};
    let valid = true;
    for (const key of required) {
      if (!contactFields[key].trim()) { errors[key] = true; valid = false; }
    }
    setContactErrors(errors);
    if (!valid) return;

    setContactSubmitting(true);
    setContactServerError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactFields),
      });
      const data = await res.json();
      if (!res.ok) {
        setContactServerError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setContactSuccess(true);
    } catch {
      setContactServerError("Network error. Please try again.");
    } finally {
      setContactSubmitting(false);
    }
  }

  return (
    <div style={{ background: "#0a0908", color: "#f1ece4", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 15, lineHeight: 1.55, WebkitFontSmoothing: "antialiased" }}>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", padding: "18px 40px", zIndex: 50, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.6px", textTransform: "uppercase" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#b8b0a4" }}>
          <span style={{ width: 6, height: 6, background: "#f5a623", borderRadius: "50%", display: "inline-block" }} />
          [Mentriva]
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 28 }}>
          <a href="#contact" style={{ color: "#6e6962", textDecoration: "none" }}>Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#b8b0a4", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 36 }}>
          <span style={{ width: 6, height: 6, background: "#f5a623", borderRadius: "50%", display: "inline-block" }} />
          [Mentriva]
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontSize: "clamp(48px, 8.4vw, 120px)", lineHeight: 0.98, letterSpacing: "-0.02em", margin: 0, maxWidth: "14ch" }}>
          The cockpit for{" "}
          <em style={{ fontStyle: "italic", color: "#f5a623", display: "block" }}>commodity operators</em>.
        </h1>

        <p style={{ margin: "32px 0 40px", color: "#b8b0a4", fontSize: 16, maxWidth: "52ch" }}>
          Trades. Vessels. Documents. Settlement. Triggers.<br />All in one.
        </p>

        <form onSubmit={handleHeroSubmit} noValidate>
          <div style={{ display: "flex", alignItems: "center", border: "1px solid #312d29", background: "#131110", padding: "4px 4px 4px 16px", minWidth: 360 }}>
            <input
              type="email"
              placeholder="you@firm.com"
              value={heroEmail}
              onChange={(e) => { setHeroEmail(e.target.value); setHeroError(false); }}
              style={{ flex: 1, background: "transparent", border: 0, outline: "none", color: heroError ? "#ff7b6b" : "#f1ece4", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, padding: "10px 8px" }}
            />
            <button type="submit" disabled={heroSubmitting} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 20px", border: "1px solid #f5a623", background: "#f5a623", color: "#1a0f00", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: heroSubmitting ? "not-allowed" : "pointer", opacity: heroSubmitting ? 0.7 : 1 }}>
              {heroSubmitting ? "Opening…" : "Open terminal ↗"}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 14, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.4px" }}>
          {heroSubmitting
            ? <span style={{ color: "#f5a623" }}>✓ Opening terminal…</span>
            : heroError
            ? <span style={{ color: "#ff7b6b" }}>Enter a valid email address</span>
            : <span style={{ color: "#6e6962" }}>Enter your email to open the terminal</span>
          }
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ maxWidth: 1180, margin: "0 auto", padding: "100px 40px", borderTop: "1px solid #221f1c" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 64, alignItems: "start" }}>

          {/* Left */}
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6e6962", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 18 }}>/ Contact</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontSize: "clamp(32px, 4.4vw, 56px)", lineHeight: 1.05, letterSpacing: "-0.01em", margin: "0 0 18px", maxWidth: "22ch" }}>
              Talk to the <em style={{ fontStyle: "italic", color: "#f5a623" }}>desk</em>.
            </h2>
            <p style={{ color: "#b8b0a4", fontSize: 16, maxWidth: "60ch", marginBottom: 0 }}>
              Whatever your stack looks like today — ETRMs, brokers, spreadsheets, inboxes — we plug into all of it. Tell us what you trade and where the friction is. A senior operator will be on a call with you within 24 hours, mapping how Mentriva removes the gaps in your workflow.
            </p>

            <div style={{ marginTop: 32 }}>
              {[
                { k: "Sales", v: <a href="mailto:sales@mentriva.xyz" style={{ color: "#f5a623", textDecoration: "none" }}>sales@mentriva.xyz</a> },
                { k: "New York", v: "447 Broadway 2nd Floor, New York, NY 10013, United States" },
                { k: "Geneva", v: <span style={{ color: "#6e6962" }}>Coming</span> },
                { k: "Dubai", v: "Dubai Silicon Oasis, Dubai, UAE" },
              ].map(({ k, v }) => (
                <div key={k} style={{ display: "flex", gap: 14, padding: "18px 0", borderTop: "1px solid #221f1c", fontSize: 14 }}>
                  <div style={{ width: 110, flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6e6962", textTransform: "uppercase", letterSpacing: "0.6px", paddingTop: 2 }}>{k}</div>
                  <div>{v}</div>
                </div>
              ))}
              <div style={{ borderBottom: "1px solid #221f1c" }} />
            </div>
          </div>

          {/* Right */}
          <div>
            {!contactSuccess ? (
              <form onSubmit={handleContactSubmit} noValidate style={{ display: "grid", gap: 18, marginTop: 32 }}>
                {([
                  { id: "name", label: "Name", type: "text", placeholder: "Jane Doe" },
                  { id: "company", label: "Company", type: "text", placeholder: "Trading house, refiner, fund…" },
                  { id: "email", label: "Email", type: "email", placeholder: "jane@firm.com" },
                ] as const).map(({ id, label, type, placeholder }) => (
                  <div key={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6e6962", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                      {label} <span style={{ color: "#f5a623" }}>*</span>
                    </label>
                    <input
                      id={id}
                      type={type}
                      placeholder={placeholder}
                      value={contactFields[id]}
                      onChange={(e) => { setContactFields(f => ({ ...f, [id]: e.target.value })); setContactErrors(err => ({ ...err, [id]: false })); }}
                      style={{ background: "transparent", border: 0, borderBottom: `1px solid ${contactErrors[id] ? "#ff7b6b" : "#312d29"}`, padding: "10px 0", color: "#f1ece4", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, outline: "none" }}
                    />
                  </div>
                ))}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6e6962", textTransform: "uppercase", letterSpacing: "0.6px" }}>
                    What are you trying to solve? <span style={{ color: "#f5a623" }}>*</span>
                  </label>
                  <textarea
                    placeholder="One paragraph is enough."
                    value={contactFields.message}
                    onChange={(e) => { setContactFields(f => ({ ...f, message: e.target.value })); setContactErrors(err => ({ ...err, message: false })); }}
                    style={{ background: "transparent", border: 0, borderBottom: `1px solid ${contactErrors.message ? "#ff7b6b" : "#312d29"}`, padding: "10px 0", color: "#f1ece4", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 15, outline: "none", resize: "vertical", minHeight: 96 }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8, paddingTop: 24, borderTop: "1px solid #221f1c" }}>
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "12px 20px", border: "1px solid #f5a623", background: "#f5a623", color: "#1a0f00", fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 14, fontWeight: 500, cursor: contactSubmitting ? "not-allowed" : "pointer", opacity: contactSubmitting ? 0.7 : 1, alignSelf: "flex-start" }}
                  >
                    {contactSubmitting ? "Sending…" : "Send message ↗"}
                  </button>
                  {contactServerError && (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#ff7b6b", letterSpacing: "0.4px" }}>
                      ✕ {contactServerError}
                    </span>
                  )}
                </div>
              </form>
            ) : (
              <div style={{ padding: 32, border: "1px solid #f5a623", background: "rgba(245, 166, 35, 0.04)", marginTop: 32 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500, fontSize: 28, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
                  Thanks — we&apos;ll be in touch <em style={{ fontStyle: "italic", color: "#f5a623" }}>shortly</em>.
                </h3>
                <p style={{ color: "#6e6962", margin: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.4px" }}>Message received.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: 40, borderTop: "1px solid #221f1c", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#6e6962", letterSpacing: "0.6px", textTransform: "uppercase" }}>
        <div>© 2026 [Mentriva]</div>
        <div style={{ display: "flex", gap: 28 }}>
          <Link href="/dashboard" style={{ color: "#6e6962", textDecoration: "none" }}>Terminal</Link>
          <a href="#" style={{ color: "#6e6962", textDecoration: "none" }}>Privacy</a>
          <a href="#" style={{ color: "#6e6962", textDecoration: "none" }}>Terms</a>
        </div>
      </footer>

    </div>
  );
}
