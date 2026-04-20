import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OS-Intel · Programmable Trade Operations",
  description:
    "The trade cockpit for commodity operators. CTRM on steroids — documents, AIS, triggers, AI, settlement.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
