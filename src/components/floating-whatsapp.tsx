"use client"
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function FloatingWhatsApp() {
  const pathname = usePathname();
  const firestore = useFirestore();

  // Detect if we are on a scooter page to provide context
  const isScooterPage = pathname?.startsWith('/scooter/');
  const scooterId = isScooterPage ? pathname.split('/')[2] : null;

  const scooterRef = useMemoFirebase(() => {
    if (!firestore || !scooterId) return null;
    return doc(firestore, 'scooters', scooterId);
  }, [firestore, scooterId]);

  const { data: scooter } = useDoc(scooterRef);

  // Hide on admin panel and login page - Moved after hooks to satisfy Rules of Hooks
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  let message = "Hi Amresh Automobiles, I visited your website and want to know more about your EV scooters.";
  
  if (scooter) {
    message = `Hi Amresh Automobiles, I am interested in the ${scooter.model} displayed on your site.\n\n` +
              `Model: ${scooter.model}\n` +
              `Range: ${scooter.range}\n` +
              `Reference: https://amreshautomobiles.in/scooter/${scooterId}\n` +
              `Image: ${scooter.images?.[0] || ''}`;
  }

  const encodedMessage = encodeURIComponent(message);

  return (
    <motion.a
      href={`https://wa.me/919798910854?text=${encodedMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-6 z-[120] bg-[#25D366] text-white p-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] flex items-center justify-center hover:bg-[#20ba5a] transition-colors border-2 border-white/20"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="sr-only">Chat on WhatsApp</span>
    </motion.a>
  );
}
