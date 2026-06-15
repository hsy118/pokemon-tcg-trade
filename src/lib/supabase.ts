import { createClient } from "@supabase/supabase-js";

export type PurchaseRow = {
  id: string;
  user_id: string;
  product_name: string;
  language: string;
  category: string;
  purchase_date: string;
  quantity: number;
  unit_price: number;
  shipping_fee: number;
  tax_fee: number;
  extra_fee: number;
  currency: string;
  exchange_rate_krw?: number | null;
  marketplace: string;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseInsert = Omit<
  PurchaseRow,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type PurchaseUpdate = PurchaseInsert;

export type SaleRow = {
  id: string;
  user_id: string;
  purchase_id: string;
  product_name: string;
  language: string;
  category: string;
  sale_date: string;
  quantity: number;
  unit_sale_price: number;
  shipping_fee: number;
  platform_fee: number;
  marketplace: string;
  memo: string;
  created_at: string;
  updated_at: string;
};

export type SaleInsert = Omit<
  SaleRow,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type SaleUpdate = SaleInsert;

type Database = {
  public: {
    Tables: {
      purchases: {
        Row: PurchaseRow;
        Insert: PurchaseInsert;
        Update: Partial<PurchaseUpdate>;
        Relationships: [];
      };
      sales: {
        Row: SaleRow;
        Insert: SaleInsert;
        Update: Partial<SaleUpdate>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
