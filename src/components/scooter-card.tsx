
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Battery, Gauge, Zap } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Scooter } from '@/lib/db-mock';

interface ScooterCardProps {
  scooter: Scooter;
}

export function ScooterCard({ scooter }: ScooterCardProps) {
  const displayImage = scooter.images && scooter.images.length > 0 
    ? scooter.images[0] 
    : 'https://picsum.photos/seed/scoot/600/400';

  return (
    <Card className="group overflow-hidden border-white/5 bg-card/40 transition-all hover:bg-card/60 hover:border-primary/30">
      <CardHeader className="p-0">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={displayImage}
            alt={scooter.model}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground font-bold">
            NEW
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="font-headline text-2xl font-bold mb-2">{scooter.model}</h3>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {scooter.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Battery className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{scooter.range} Range</span>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">{scooter.topSpeed || '60 km/h'} Top</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-2xl font-bold text-primary">{scooter.price}</span>
          <Badge variant="outline" className="border-primary/20 text-primary">
            EMI Options
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Link href={`/scooter/${scooter.id}`} className="w-full">
          <Button className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
