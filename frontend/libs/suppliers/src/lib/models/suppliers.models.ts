export interface Supplier {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  gold_receivable_grams: number;
  cash_payable: number;
  created_at?: string;
}

export interface CreateSupplierDto {
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  goldReceivableGrams?: number;
  cashPayable?: number;
}

export type UpdateSupplierDto = Partial<CreateSupplierDto>;
