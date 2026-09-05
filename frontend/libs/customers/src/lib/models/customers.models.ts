export type CustomerIdType = 'National ID' | 'Passport' | 'Driving License';

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  id_type?: CustomerIdType | string;
  id_number?: string;
  gold_balance_grams: number;
  cash_balance: number;
  created_at?: string;
}

export interface CreateCustomerDto {
  name: string;
  phone?: string;
  email?: string;
  idType?: string;
  idNumber?: string;
  goldBalanceGrams?: number;
  cashBalance?: number;
}

export type UpdateCustomerDto = Partial<CreateCustomerDto>;
