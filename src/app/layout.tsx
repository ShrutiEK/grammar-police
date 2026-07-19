import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Next,
} from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { AccessibilityToolkit } from "@/features/accessibility/accessibility-toolkit";

import "./globals.css";

const atkinsonHyperlegible = Atkinson_Hyperlegible_Next({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-atkinson-hyperlegible",
  weight: "variable",
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
        <Script id="hotjar" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:6749583,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      </body>
    </html>
  );
}
