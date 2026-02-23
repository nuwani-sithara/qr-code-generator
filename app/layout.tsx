import type { Metadata } from "next";
import "../styles/globals.css";
import "../styles/qr-generator.css";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description: "Generate high-resolution QR codes with custom colors and downloads."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
