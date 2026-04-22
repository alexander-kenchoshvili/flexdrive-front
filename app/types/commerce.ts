import type { CatalogCategoryRef, CatalogImageAsset } from "~/types/catalog";

export type CommerceCartAvailabilityIssue =
  | "available"
  | "out_of_stock"
  | "unavailable";

export type CommercePriceChangeDirection =
  | "increase"
  | "decrease"
  | "same";

export type CommerceCheckoutCartIssueType =
  | "quantity_adjusted"
  | "out_of_stock"
  | "unavailable";

export interface CommerceCheckoutCartIssue {
  cart_item_id: number;
  product_id: number;
  issue_type: CommerceCheckoutCartIssueType;
  requested_quantity: number;
  available_quantity: number;
}

export interface CommerceCartItem {
  id: number;
  product_id: number;
  slug: string;
  name: string;
  sku: string;
  category: CatalogCategoryRef;
  price: string;
  price_snapshot: string;
  old_price: string | null;
  on_sale: boolean;
  in_stock: boolean;
  stock_qty: number;
  is_purchasable: boolean;
  availability_issue: CommerceCartAvailabilityIssue;
  price_changed: boolean;
  price_change_direction: CommercePriceChangeDirection;
  primary_image: CatalogImageAsset;
  quantity: number;
  line_total: string;
}

export interface CommerceCheckoutSummaryItem {
  id: number | string;
  product_id: number;
  slug: string;
  name: string;
  sku: string;
  price: string;
  price_snapshot: string;
  quantity: number;
  line_total: string;
  price_changed: boolean;
  price_change_direction: CommercePriceChangeDirection;
  primary_image: CatalogImageAsset;
}

export interface CommerceCart {
  id: number;
  item_count: number;
  subtotal: string;
  total: string;
  has_price_changes: boolean;
  price_change_count: number;
  price_change_message: string | null;
  items: CommerceCartItem[];
}

export type CommerceBuyNowIssueType =
  | "price_changed"
  | "quantity_adjusted"
  | "out_of_stock"
  | "unavailable";

export interface CommerceBuyNowIssue {
  product_id: number;
  issue_type: CommerceBuyNowIssueType;
  requested_quantity: number;
  available_quantity: number;
  price_snapshot: string;
  current_price: string;
}

export type CommerceBuyNowRecommendedAction =
  | "confirm_updates"
  | "return_to_product"
  | "restart_buy_now";

export type CommerceBuyNowErrorCode =
  | "buy_now_price_changed"
  | "buy_now_availability_changed"
  | "buy_now_session_not_found"
  | "buy_now_session_expired";

export interface CommerceBuyNowSession {
  id: number;
  product_id: number;
  slug: string;
  name: string;
  sku: string;
  price: string;
  price_snapshot: string;
  quantity: number;
  line_total: string;
  subtotal: string;
  total: string;
  in_stock: boolean;
  stock_qty: number;
  is_purchasable: boolean;
  availability_issue: CommerceCartAvailabilityIssue;
  price_changed: boolean;
  price_change_direction: CommercePriceChangeDirection;
  primary_image: CatalogImageAsset;
  issues: CommerceBuyNowIssue[];
  requires_confirmation: boolean;
  is_checkout_available: boolean;
}

export interface WishlistItem {
  product_id: number;
  saved_at: string;
  name: string;
  slug: string;
  short_description: string;
  price: string;
  old_price: string | null;
  on_sale: boolean;
  is_new: boolean;
  is_featured: boolean;
  in_stock: boolean;
  stock_qty: number;
  category: CatalogCategoryRef;
  primary_image: CatalogImageAsset;
}

export interface WishlistResponse {
  count: number;
  results: WishlistItem[];
}

export type CheckoutPaymentMethod = "cash_on_delivery" | "card";
export type CommerceOrderStatus =
  | "new"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface CheckoutPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  address_line: string;
  note?: string;
  terms_accepted: boolean;
  payment_method: CheckoutPaymentMethod;
  recaptcha_token?: string;
}

export interface CommerceOrderItem {
  id: number;
  product_name: string;
  sku: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  primary_image: CatalogImageAsset;
}

export interface CommerceOrderSummary {
  id: number;
  public_token: string;
  order_number: string;
  payment_method: CheckoutPaymentMethod;
  status: CommerceOrderStatus;
  subtotal: string;
  total: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  address_line: string;
  note: string;
  items: CommerceOrderItem[];
  created_at: string;
}

export interface OwnedOrderListItem {
  public_token: string;
  order_number: string;
  status: CommerceOrderStatus;
  payment_method: CheckoutPaymentMethod;
  total: string;
  created_at: string;
  item_count: number;
  total_quantity: number;
}

export interface OwnedOrdersSummary {
  total_orders: number;
  total_spent: string;
  last_order_at: string | null;
}

export interface OwnedOrdersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  summary: OwnedOrdersSummary;
  results: OwnedOrderListItem[];
}

export type OwnedOrderDetail = CommerceOrderSummary;
