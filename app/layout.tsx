import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design / CS Allocation Dashboard",
  description: "Workload and allocation planning for designers, video editors, and creative strategists.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
