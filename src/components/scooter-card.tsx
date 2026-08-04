
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { Battery, Gauge, GitCompare, Check, ArrowRight, Zap } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { useCompare } from '@/hooks/use-compare';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ScooterCardProps {
  scooter: any;
}

export function ScooterCard({ scooter }: ScooterCardProps) {
  const { selectedIds, toggleCompare, isMaxSelected } = useCompare();
  const isSelected = selectedIds.includes(scooter.id);

  const images = scooter.images && scooter.images.length > 0 
    ? scooter.images 
    : ['https://picsum.photos/seed/scoot/600/400'];

  const hasVariants = scooter.variants && scooter.variants.length > 0;

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className={cn(
        "group overflow-hidden border-white/5 bg-card/40 backdrop-blur-xl transition-all duration-500 hover:bg-card/60 hover:border-primary/50 relative rounded-[2rem]",
        isSelected && "ring-2 ring-primary border-primary/50"
      )}>
        <CardHeader className="p-0">
          <Carousel 
            className="w-full"
            plugins={[
              Autoplay({
                delay: 4000,
              }),
            ]}
          >
            <CarouselContent>
              {images.map((image: string, index: number) => (
                <CarouselItem key={index}>
                  <div className="relative w-full h-80 overflow-hidden bg-zinc-900/20">
                    <Image
                      src={image}
                      alt={`${scooter.model}`}
                      fill
                      className="object-contain transition-transform duration-1000 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <div className="absolute top-6 left-6 z-20">
              <Button
                size="sm"
                variant={isSelected ? "default" : "secondary"}
                className={cn(
                  "h-10 px-6 rounded-full font-black tracking-widest text-[9px] uppercase backdrop-blur-xl transition-all shadow-2xl",
                  !isSelected && "bg-black/60 text-white hover:bg-primary hover:text-primary-foreground",
                  isSelected && "bg-primary text-primary-foreground"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  toggleCompare(scooter.id);
                }}
                disabled={!isSelected && isMaxSelected}
              >
                {isSelected ? <Check className="h-3 w-3 mr-2" /> : <GitCompare className="h-3 w-3 mr-2" />}
                {isSelected ? 'Ready' : 'Compare'}
              </Button>
            </div>

            <div className="absolute top-6 right-6 z-10">
              <Badge className="bg-primary/20 border border-primary/30 text-primary font-black tracking-widest text-[9px] uppercase px-4 py-1 rounded-full">
                New Model 2026
              </Badge>
            </div>
          </Carousel>
        </CardHeader>
        
        <CardContent className="p-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-headline text-3xl font-bold mb-1 tracking-tighter uppercase">{scooter.model}</h3>
              <p className="text-primary text-[10px] font-black uppercase tracking-[0.3em]">{scooter.tagline || 'Innovation'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-10 p-6 bg-white/5 rounded-3xl border border-white/5">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-primary">
                <Battery className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Range</span>
              </div>
              <span className="text-lg font-bold">
                {hasVariants ? `Upto ${scooter.variants[scooter.variants.length-1].range}` : scooter.range}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-accent">
                <Gauge className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Top Speed</span>
              </div>
              <span className="text-lg font-bold">{scooter.topSpeed || '85 km/h'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
                {hasVariants ? 'Starting At' : 'Ex-Showroom'}
              </p>
              <span className="text-3xl font-black text-white">{scooter.price}</span>
            </div>
            <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary transition-colors duration-500">
               <Zap className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-10 pt-0">
          <Link href={`/scooter/${scooter.id}`} className="w-full">
            <Button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black tracking-widest text-[10px] uppercase hover:bg-primary hover:text-primary-foreground hover:scale-[1.02] transition-all duration-500">
              View Details <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
