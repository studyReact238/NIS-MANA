
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: 'にすまな - スキマ時間でちょいアプデ。',
  description: '若手社員のためのナレッジ共有・学習集会所',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen">
        <FirebaseClientProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
