import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { siteConfig, siteUrl } from "@/config/site";
import { AccessibilityToolkit } from "@/features/accessibility/accessibility-toolkit";

import "./globals.css";

const atkinsonHyperlegible = Atkinson_Hyperlegible_Next({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-atkinson-hyperlegible",
  weight: "variable",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [...siteConfig.keywords],
  category: "education",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteUrl,
    locale: siteConfig.locale,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#fff9ed",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
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
