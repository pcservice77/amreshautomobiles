
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { CompareProvider } from '@/hooks/use-compare';

export const metadata: Metadata = {
  metadataBase: new URL('https://amreshautomobiles.in'),
  title: {
    default: 'Amresh Automobiles | Best Electric Scooter Showroom in India',
    template: '%s | Amresh Automobiles'
  },
  description: 'Discover the future of mobility at Amresh Automobiles. The leading EV scooty showroom in Jharkhand and across India. Explore high-performance electric scooters, book test rides, and get easy EMI options on top EV models.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
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
