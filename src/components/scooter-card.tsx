
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Battery, Gauge, GitCompare, Check } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useCompare } from '@/hooks/use-compare';
import { cn } from '@/lib/utils';

interface ScooterCardProps {
  scooter: any;
}

export function ScooterCard({ scooter }: ScooterCardProps) {
  const { selectedIds, toggleCompare, isMaxSelected } = useCompare();
  const isSelected = selectedIds.includes(scooter.id);

  const images = scooter.images && scooter.images.length > 0 
    ? scooter.images 
    : ['https://picsum.photos/seed/scoot/600/400'];

  return (
    <Card className={cn(
      "group overflow-hidden border-white/5 bg-card/40 transition-all hover:bg-card/60 hover:border-primary/30 relative",
      isSelected && "ring-2 ring-primary border-primary/50"
    )}>
      <CardHeader className="p-0">
        <Carousel 
          className="w-full"
          plugins={[
            Autoplay({
              delay: 3000,
            }),
          ]}
        >
          <CarouselContent>
            {images.map((image: string, index: number) => (
              <CarouselItem key={index}>
                <div className="relative w-full h-64 overflow-hidden bg-zinc-900/50">
                  <Image
                    src={image}
                    alt={`${scooter.model} - Image ${index + 1}`}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-105"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
              <CarouselPrevious className="relative left-0 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              <CarouselNext className="relative right-0 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          
          <div className="absolute top-4 left-4 z-20">
            <Button
              size="sm"
              variant={isSelected ? "default" : "secondary"}
              className={cn(
                "h-8 gap-2 backdrop-blur-md transition-all shadow-xl",
                !isSelected && "bg-black/50 text-white hover:bg-black/70",
                isSelected && "bg-primary text-primary-foreground"
              )}
              onClick={(e) => {
                e.preventDefault();
                toggleCompare(scooter.id);
              }}
              disabled={!isSelected && isMaxSelected}
            >
              {isSelected ? <Check className="h-3 w-3" /> : <GitCompare className="h-3 w-3" />}
              {isSelected ? 'Selected' : 'Compare'}
            </Button>
          </div>

          <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground font-bold z-10">
            NEW
          </Badge>
        </Carousel>
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
