
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner Login',
  description: 'Authorized access for Amresh Automobiles partners and branch administrators.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
