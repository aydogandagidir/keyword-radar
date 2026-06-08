import type { ReactNode } from "react";
import "./styles.css";

export const metadata = {
  title: "Bluedev Keyword Radar",
  description: "Dashboard skeleton for marketplace keyword research runs."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
