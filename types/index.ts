/**
 * User Role Definitions
 */
export enum UserRole {
  ADMIN = 'admin',
  DEALER = 'dealer',
  CUSTOMER = 'customer',
}

/**
 * Product Category Definitions
 */
export enum ProductCategory {
  SCREEN = 'screen',
  KEYBOARD = 'keyboard',
  BATTERY = 'battery',
  STORAGE = 'storage',
  MOTHERBOARD = 'motherboard',
}

/**
 * Repair Status Workflow
 */
export enum RepairStatus {
  RECEIVED = 'received',
  DIAGNOSING = 'diagnosing',
  WAITING_APPROVAL = 'waiting_approval',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

/**
 * Company Details for Dealers (B2B)
 */
export interface CompanyDetails {
  taxTitle: string;
  taxNumber: string;
  taxOffice: string;
  address: string;
}

/**
 * User Interface
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_approved: boolean; // Critical for Dealer pricing visibility
  company_details?: CompanyDetails;
  created_at: Date;
}

/**
 * Product Interface
 * Cross-compatibility is handled by the `compatible_models` array.
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  image_url: string;
  
  // Pricing
  price_usd: number; // Base currency
  dealer_discount_percent: number; // B2B specific discount
  vat_rate: number; // Usually 0.20 (20%)
  
  // Inventory
  stock: number;
  
  // Compatibility Engine
  // List of model strings (e.g., "Lenovo ThinkPad X1", "Dell XPS 13 9360")
  compatible_models: string[]; 
}

/**
 * Repair Tracking Record
 */
export interface RepairRecord {
  id: string;
  tracking_code: string; // Publicly searchable ID
  customer_name: string;
  customer_phone: string;
  device_brand: string;
  device_model: string;
  serial_number?: string;
  
  issue_description: string;
  technician_notes?: string;
  
  status: RepairStatus;
  estimated_cost_tl?: number;
  
  created_at: Date;
  updated_at: Date;
}

/**
 * Pricing Calculation Result
 */
export interface PricingResult {
  basePriceUSD: number;
  appliedDiscountPercent: number;
  discountedPriceUSD: number;
  exchangeRate: number;
  subtotalTL: number; // Before VAT
  vatAmountTL: number;
  rawTotalTL: number; // Exact Math
  finalPriceTL: number; // Psychological Pricing
}