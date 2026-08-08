
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { CompareProvider } from '@/hooks/use-compare';

const BRAND_ICON = 'data:image/png;base64,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';

export const metadata: Metadata = {
  metadataBase: new URL('https://amreshautomobiles.in'),
  title: {
    default: 'Amresh Automobiles | Best Electric Scooter Showroom in India',
    template: '%s | Amresh Automobiles'
  },
  description: 'Discover the future of mobility at Amresh Automobiles. The leading EV scooty showroom in Jharkhand and across India. Explore high-performance electric scooters, book test rides, and get easy EMI options on top EV models.',
  icons: {
    icon: BRAND_ICON,
    shortcut: BRAND_ICON,
    apple: BRAND_ICON,
  },
  keywords: [
    'amresh automobiles', 
    'amresh automobile', 
    'amreshautomobiles', 
    'amresh autommobiles',
    'ev scooty in india', 
    'ev scooty in khunti',
    'best electric scooter jharkhand', 
    'ev scooty in ranchi', 
    'new ev scooty 2026', 
    'ev scooty around me', 
    'electric scooter showroom khunti', 
    'showroom near ranchi',
    'showroom near khunti',
    'showroom in jharkhand',
    'showrrom in jharkhand',
    'electric bike ranchi', 
    'amresh automobiles padampur',
    'electric vehicle showroom jharkhand',
    'buy electric scooter online india',
    'eco-friendly scooty india',
    'high speed electric scooter india',
    'low price ev scooty'
  ],
  alternates: {
    canonical: 'https://amreshautomobiles.in',
  },
  authors: [{ name: 'Amresh Automobiles' }],
  creator: 'Amresh Automobiles',
  publisher: 'Amresh Automobiles',
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  openGraph: {
    title: 'Amresh Automobiles | Leading Electric Mobility Showroom India',
    description: 'Electrify your daily journey with the best EV scooters. Visit Amresh Automobiles today for the latest in electric vehicle technology.',
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
    title: 'Amresh Automobiles | EV Scooty India',
    description: 'The future of transport is here. Explore our premium range of electric scooters in Jharkhand and across India.',
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

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AutomotiveBusiness',
  'name': 'Amresh Automobiles',
  'alternateName': ['Amresh Automobile', 'Amreshautomobiles', 'Amresh Autommobiles'],
  'description': 'Leading electric scooter showroom providing high-performance EV mobility solutions in Jharkhand and India.',
  'image': 'https://i.ibb.co/v6xDr5f4/Chat-GPT-Image-Jul-31-2026-06-06-56-PM.png',
  '@id': 'https://amreshautomobiles.in',
  'url': 'https://amreshautomobiles.in',
  'telephone': '+91 97989 10854',
  'priceRange': '₹50000 - ₹200000',
  'address': {
    '@type': 'PostalAddress',
    'streetAddress': 'Main Showroom, Padampur',
    'addressLocality': 'Khunti',
    'addressRegion': 'JH',
    'postalCode': '835210',
    'addressCountry': 'IN'
  },
  'geo': {
    '@type': 'GeoCoordinates',
    'latitude': 23.0722,
    'longitude': 85.2758
  },
  'openingHoursSpecification': {
    '@type': 'OpeningHoursSpecification',
    'dayOfWeek': [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ],
    'opens': '09:00',
    'closes': '19:00'
  },
  'sameAs': [
    'https://www.facebook.com/amreshautomobiles',
    'https://www.instagram.com/amreshautomobiles',
    'https://share.google/JcFA422z1FlNnhkjT'
  ]
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <CompareProvider>
            {children}
            <Toaster />
          </CompareProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
