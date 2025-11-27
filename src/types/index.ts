
/**
 * User Role Definitions
 */
export enum UserRole {
  ADMIN = 'admin',
  DEALER = 'dealer',
  TECHNICIAN = 'technician',
  CUSTOMER = 'customer',
}

/**
 * Repair Workflow Status
 */
export enum RepairStatus {
  RECEIVED = 'received',
  DIAGNOSING = 'diagnosing',
  WAITING_PARTS = 'waiting_parts',
  WAITING_APPROVAL = 'waiting_approval',
  IN_PROGRESS = 'in_progress',
  AT_PARTNER = 'at_partner',
  IN_WARRANTY = 'in_warranty_process',
  COMPLETED = 'completed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export type WarrantyResult = 'pending' | 'repaired' | 'swapped' | 'refunded' | 'rejected';

/**
 * Product Categories
 */
export enum ProductCategory {
  SCREEN = 'screen',
  BATTERY = 'battery',
  KEYBOARD = 'keyboard',
  CHIPSET = 'chipset',
  RAM = 'ram',
  STORAGE = 'storage',
  MOTHERBOARD = 'motherboard'
}

/**
 * Order Status
 */
export enum OrderStatus {
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

/**
 * External Service Partner
 */
export interface ServicePartner {
  id: string;
  name: string;
  specialty: string[];
  phone: string;
  address: string;
  contract_date: Date;
}

/**
 * Company/Tax Details for B2B Dealers
 */
export interface CompanyDetails {
  title?: string;
  taxTitle?: string;
  tax_office?: string;
  taxOffice?: string;
  tax_number?: string;
  taxNumber?: string;
  address: string;
}

/**
 * User Entity
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_approved: boolean; 
  company_details?: CompanyDetails;
  created_at: Date;
}

/**
 * Product Reviews
 */
export interface Review {
  id: string;
  user: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

/**
 * Product Entity
 */
export interface Product {
  id: string;
  sku: string;
  shelf_location: string; 
  name: string;
  category: ProductCategory;
  description?: string;
  price_usd: number;
  vat_rate: number;
  stock: number;
  critical_limit: number;
  compatible_models: string[];
  image_url?: string;
  dealer_discount_percent?: number;
  reviews?: Review[]; 
}

/**
 * Cart Item
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Order Entity
 */
export interface Order {
  id: string;
  userId: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}

/**
 * Repair/Service Record
 */
export interface RepairRecord {
  id: string;
  tracking_code: string;
  
  customer_name: string;
  customer_phone: string;
  device_brand?: string;
  device_model: string;
  serial_number?: string;
  issue_description: string;
  
  // Proof of condition
  device_photos?: string[]; 
  
  status: RepairStatus;
  assigned_technician?: string;
  assigned_technician_id?: string | null;
  outsourced_to_partner_id?: string | null;
  
  // RMA / Warranty Fields
  is_warranty_claim?: boolean;
  supplier_name?: string;
  external_rma_code?: string;
  warranty_result?: WarrantyResult;
  swap_device_serial?: string; // If result is 'swapped'

  cost_to_us?: number;
  labor_cost?: number;
  price_to_customer?: number;
  currency_rate_at_time?: number;
  
  created_at: Date;
  updated_at?: Date;
  estimated_completion?: Date;
  completed_at?: Date;
  
  technician_notes?: string[] | string;
  estimated_cost_tl?: number;
}
