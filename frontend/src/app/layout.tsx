import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SimpleÔQuotidien — Services à domicile, simplifiés.",
    template: "%s | SimpleÔQuotidien",
  },
  description:
    "La plateforme qui connecte les particuliers aux meilleurs prestataires de services à domicile. Ménage, plomberie, coiffure, baby-sitting et plus.",
  keywords: ["services à domicile", "prestataire", "ménage", "plomberie", "Ouagadougou", "Burkina Faso"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={plusJakartaSans.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
