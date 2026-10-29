import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MarketLens",
  description: "Turn one product photo into an honest, ready-to-post product listing with a studio image.",
};
export const viewport: Viewport = { themeColor: "#0B0D10", viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          offset={16}
          toastOptions={{ style: { background: "#1B2027", border: "1px solid #2A313A", color: "#F2F4F6" } }}
        />
      </body>
    </html>
  );
}
