import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StaticPress - Hugo Blog Editor",
  description: "Simple, elegant web-based editor for Hugo blogs with GitHub integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
