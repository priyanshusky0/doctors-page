import type { Metadata, Viewport } from "next";
import { Caveat, Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";

const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--f-display" });
const body = Manrope({ subsets: ["latin"], variable: "--f-body" });
const hand = Caveat({ subsets: ["latin"], weight: ["500", "600"], variable: "--f-hand" });

export const metadata: Metadata = {
  title: "Care that Continues | Sugar360 for Doctors",
  description: "Your consultation lasts minutes. Diabetes doesn't. Build the circle in your city.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Care that Continues | Sugar360 for Doctors",
    description: "Your consultation lasts minutes. Diabetes doesn't.",
    images: ["/brand/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F1A2B",
  width: "device-width",
  initialScale: 1,
};

// Before first paint: if the reader is fine with motion, start behind the clinic doors.
// (No JS or reduced motion: no doors, the page opens straight on the room.)
const INTRO = `try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('intro')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning className={`${display.variable} ${body.variable} ${hand.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
