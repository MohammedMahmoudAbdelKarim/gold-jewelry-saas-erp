export type PurchaseOrderStatus = 'pending' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  branch_id: string;
  supplier_id: string;
  supplier_name?: string;
  user_id: string;
  po_number: string;
  item_description: string;
  gold_karat?: string;
  weight_grams: number;
  unit_cost_per_gram: number;
  total_cost: number;
  status: PurchaseOrderStatus;
  notes?: string;
  created_at?: string;
}

export interface CreatePurchaseOrderDto {
  supplierId: string;
  itemDescription: string;
  goldKarat?: string;
  weightGrams: number;
  unitCostPerGram: number;
  notes?: string;
}

export interface UpdatePurchaseOrderDto {
  itemDescription?: string;
  goldKarat?: string;
  weightGrams?: number;
  unitCostPerGram?: number;
  status?: PurchaseOrderStatus;
  notes?: string;
}
