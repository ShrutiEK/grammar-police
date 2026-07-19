import type { Metadata } from "next";
import { Atkinson_Hyperlegible } from "next/font/google";
import type { ReactNode } from "react";

import { AccessibilityToolkit } from "@/features/accessibility/accessibility-toolkit";

import "./globals.css";

const atkinsonHyperlegible = Atkinson_Hyperlegible({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-atkinson-hyperlegible",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "English Spark",
  description: "Friendly English conversation practice shaped around you.",
};

type RootLayoutProperties = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProperties) {
  return (
    <html className={atkinsonHyperlegible.variable} lang="en">
      <body>
        {children}
        <AccessibilityToolkit />
      </body>
    </html>
  );
}
