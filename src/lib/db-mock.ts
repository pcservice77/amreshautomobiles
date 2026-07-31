
import { PlaceHolderImages } from './placeholder-images';

export interface Scooter {
  id: string;
  model: string;
  range: string;
  price: string;
  topSpeed?: string;
  batteryCapacity?: string;
  chargingTime?: string;
  features: string[];
  imageUrl: string;
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
    range: '120 km',
    price: '₹ 1,15,000',
    topSpeed: '85 km/h',
    batteryCapacity: '3.2 kWh',
    chargingTime: '4.5 hours',
    features: ['LED Lighting', 'Touch Dashboard', 'Fast Charging'],
    imageUrl: PlaceHolderImages[1].imageUrl,
    description: 'Experience the pinnacle of electric performance with the Volt Z1. Designed for the modern commuter, it offers unmatched efficiency and a smooth ride.'
  },
  {
    id: '2',
    model: 'Volt Pro Max',
    range: '150 km',
    price: '₹ 1,45,000',
    topSpeed: '95 km/h',
    batteryCapacity: '4.0 kWh',
    chargingTime: '5 hours',
    features: ['GPS Tracking', 'Reverse Mode', 'Regenerative Braking'],
    imageUrl: PlaceHolderImages[2].imageUrl,
    description: 'The Volt Pro Max is built for those who demand more range and power. It combines rugged durability with intelligent features for any urban landscape.'
  },
  {
    id: '3',
    model: 'Volt Lite',
    range: '80 km',
    price: '₹ 85,000',
    topSpeed: '55 km/h',
    batteryCapacity: '2.1 kWh',
    chargingTime: '3 hours',
    features: ['Compact Design', 'Removable Battery', 'Lightweight'],
    imageUrl: PlaceHolderImages[3].imageUrl,
    description: 'Perfect for short city hops, the Volt Lite is our most agile and accessible scooter yet. Stylish, efficient, and incredibly easy to handle.'
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
