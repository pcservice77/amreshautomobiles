
import { PlaceHolderImages } from './placeholder-images';

export interface Scooter {
  id: string;
  model: string;
  tagline?: string;
  variant?: string;
  range: string;
  price: string;
  topSpeed?: string;
  batteryType?: string;
  batteryCapacity?: string;
  voltage?: string;
  category?: string;
  batterySystem?: string;
  chargingTime?: string;
  features: string[];
  images: string[];
  description: string;
}

export interface Sale {
  id: string;
  customerName: string;
  mobile: string;
  address: string;
  idType: string;
  idNumber: string;
  model: string;
  chassisNumber: string;
  price: string;
  soldAt: string;
}

// In-memory mock data
let scooters: Scooter[] = [
  {
    id: '1',
    model: 'Volt Z1',
    tagline: 'Silent Thunder',
    range: '120 km',
    price: '₹ 1,15,000',
    topSpeed: '85 km/h',
    batteryType: 'Lithium-ion',
    batteryCapacity: '3.2 kWh',
    voltage: '60V',
    category: 'High Speed',
    batterySystem: 'Swappable',
    chargingTime: '4.5 hours',
    features: ['LED Lighting', 'Touch Dashboard', 'Fast Charging'],
    images: [PlaceHolderImages[1].imageUrl],
    description: 'Experience the pinnacle of electric performance with the Volt Z1. Designed for the modern commuter, it offers unmatched efficiency and a smooth ride.'
  }
];

let sales: Sale[] = [];

export const db = {
  getScooters: async () => scooters,
  getScooterById: async (id: string) => scooters.find(s => s.id === id),
  addScooter: async (scooter: Omit<Scooter, 'id'>) => {
    const newScooter = { ...scooter, id: Math.random().toString(36).substr(2, 9) };
    scooters = [newScooter, ...scooters];
    return newScooter;
  },
  updateScooter: async (id: string, updates: Partial<Scooter>) => {
    scooters = scooters.map(s => s.id === id ? { ...s, ...updates } : s);
  },
  deleteScooter: async (id: string) => {
    scooters = scooters.filter(s => s.id !== id);
  },
  getSales: async () => sales,
  addSale: async (sale: Omit<Sale, 'id'>) => {
    const newSale = { ...sale, id: `BILL-${Math.floor(1000 + Math.random() * 9000)}` };
    sales = [newSale, ...sales];
    return newSale;
  }
};
