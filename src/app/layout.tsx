import type { Metadata } from "next";
import { Providers } from "./providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Bendre — Practice Management for Therapists",
  description:
    "Privacy-first practice management platform for independent therapists in India. Manage clients, sessions, payments, and more.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: {
    title: "Bendre — Your practice, finally at peace",
    description:
      "Privacy-first practice management for independent therapists in India.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
