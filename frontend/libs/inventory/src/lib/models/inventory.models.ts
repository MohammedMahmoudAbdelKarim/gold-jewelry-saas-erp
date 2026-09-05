export enum InventoryStatus {
  InStock = 'IN_STOCK',
  Sold = 'SOLD',
  InTransit = 'IN_TRANSIT',
  Reserved = 'RESERVED'
}

export enum ItemCategory {
  Ring = 'RING',
  Necklace = 'NECKLACE',
  Bracelet = 'BRACELET',
  Earrings = 'EARRINGS',
  Pendant = 'PENDANT',
  Set = 'SET'
}

export enum GoldKarat {
  K18 = 18,
  K21 = 21,
  K22 = 22,
  K24 = 24
}

export interface GoldDetails {
  karat: GoldKarat;
  weightGrams: number;
  workmanshipPrice: number; // مصنعية
}

export interface DiamondDetails {
  caratWeight: number;
  clarity: string;
  color: string;
  cut: string;
  stoneCount: number;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface JewelryItem {
  id: string;
  sku: string;
  name: string;
  category: ItemCategory;
  status: InventoryStatus;
  branchId: string;
  
  // A piece can have gold, diamonds, or both
  goldDetails?: GoldDetails;
  diamondDetails?: DiamondDetails;
  
  // Pricing
  totalPrice?: number; // Might be calculated dynamically
  createdAt: string;
  updatedAt: string;
}
