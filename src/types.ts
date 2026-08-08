export type Role = 'CASHIER' | 'MANAGER';

export type Language = 'EN' | 'ID';

export type ProductCategory = 'ALL' | 'DRINKS' | 'SNACKS' | 'MERCH' | 'FOOD';

export interface Product {
  id: string;
  name: string;
  nameId?: string;
  category: ProductCategory;
  price: number;
  stock: number;
  sku: string;
  icon: string;
  image?: string;
  description?: string;
  descriptionId?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  itemSubtotal: number;
}

export type PaymentChannel = 'CASH' | 'QRIS' | 'CARD' | 'ONLINE_WEB';

export type TransactionType = 'OFFLINE_STORE' | 'ONLINE_WEB';

export interface TransactionItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface SaleTransaction {
  id: string;
  orderNumber: string;
  timestamp: string;
  channel: PaymentChannel;
  type: TransactionType;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  tendered: number;
  change: number;
  cashierName: string;
}

export interface StaffUser {
  username: string;
  name: string;
  role: Role;
}

export interface ShiftState {
  isOpen: boolean;
  staffUser: StaffUser | null;
  openedAt: string | null;
  startingCash: number;
}

export type ActiveTab = 'POS' | 'INVENTORY' | 'ONLINE_ORDERS' | 'REPORTS';

export type OnlineOrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface OnlineOrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OnlineOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OnlineOrderItem[];
  totalPayment: number;
  timestamp: string;
  status: OnlineOrderStatus;
  paymentMethod: string;
  courier?: string;
  shippingFee?: number;
  trackingNumber?: string;
  notes?: string;
}

