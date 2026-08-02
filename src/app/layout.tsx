
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  metadataBase: new URL('https://amreshautomobiles.in'),
  title: {
    default: 'Amresh Automobiles | Best Electric Scooter Showroom in Jharkhand',
    template: '%s | Amresh Automobiles'
  },
  description: 'Discover the future of mobility at Amresh Automobiles. The leading EV scooty showroom in Ranchi, Khunti, and Jharkhand. Explore high-performance electric scooters, book test rides, and get easy EMI options.',
  keywords: ['amresh automobiles', 'automobiles', 'ev scooty in jharkhand', 'ev scooty in ranchi', 'new ev scooty', 'ev scooty around me', 'electric scooter showroom khunti', 'best ev scooty 2025', 'electric bike ranchi', 'amresh automobiles padampur'],
  authors: [{ name: 'Amresh Automobiles' }],
  creator: 'Amresh Automobiles',
  publisher: 'Amresh Automobiles',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  openGraph: {
    title: 'Amresh Automobiles | Electric Mobility Showroom',
    description: 'Electrify your daily journey with the best EV scooters in Jharkhand. Visit Amresh Automobiles today!',
    url: 'https://amreshautomobiles.in',
    siteName: 'Amresh Automobiles',
    images: [
      {
        url: 'https://i.ibb.co/v6xDr5f4/Chat-GPT-Image-Jul-31-2026-06-06-56-PM.png',
        width: 1200,
        height: 630,
        alt: 'Amresh Automobiles Showroom',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amresh Automobiles | EV Scooty Jharkhand',
    description: 'The future of transport is here. Explore our range of electric scooters in Ranchi and Khunti.',
    images: ['https://i.ibb.co/v6xDr5f4/Chat-GPT-Image-Jul-31-2026-06-06-56-PM.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        <link rel="canonical" href="https://amreshautomobiles.in" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
