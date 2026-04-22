import { apiFetchRaw } from "~/composables/apiFetch";
import type {
  CheckoutPayload,
  CommerceBuyNowSession,
  CommerceCart,
  OwnedOrderDetail,
  OwnedOrdersResponse,
  CommerceOrderSummary,
  WishlistResponse,
} from "~/types/commerce";

type CommerceRequestOptions = {
  headers?: Record<string, string>;
};

type CartItemPayload = {
  product_id: number;
  quantity: number;
};

type CartItemUpdatePayload = {
  quantity: number;
};

export const useCommerceApi = () => {
  const resolveHeaders = (options?: CommerceRequestOptions) => {
    const nextHeaders = {
      ...(import.meta.server ? useRequestHeaders(["cookie"]) : {}),
      ...(options?.headers || {}),
    } as Record<string, string | undefined>;

    return Object.fromEntries(
      Object.entries(nextHeaders).filter(([, value]) => Boolean(value)),
    ) as Record<string, string>;
  };

  const getCart = async (options?: CommerceRequestOptions) => {
    return apiFetchRaw<CommerceCart>("/commerce/cart/", {
      headers: resolveHeaders(options),
    });
  };

  const getWishlist = async (options?: CommerceRequestOptions) => {
    return apiFetchRaw<WishlistResponse>("/commerce/wishlist/", {
      headers: resolveHeaders(options),
    });
  };

  const addCartItem = async (payload: CartItemPayload) => {
    return apiFetchRaw<CommerceCart>("/commerce/cart/items/", {
      method: "POST",
      body: payload,
    });
  };

  const createBuyNowSession = async (payload: CartItemPayload) => {
    return apiFetchRaw<CommerceBuyNowSession>("/commerce/buy-now/session/", {
      method: "POST",
      body: payload,
    });
  };

  const getBuyNowSession = async (options?: CommerceRequestOptions) => {
    return apiFetchRaw<CommerceBuyNowSession>("/commerce/buy-now/session/", {
      headers: resolveHeaders(options),
    });
  };

  const deleteBuyNowSession = async () => {
    return apiFetchRaw<void>("/commerce/buy-now/session/", {
      method: "DELETE",
    });
  };

  const confirmBuyNowSession = async () => {
    return apiFetchRaw<CommerceBuyNowSession>("/commerce/buy-now/session/confirm/", {
      method: "POST",
    });
  };

  const confirmCartPrices = async () => {
    return apiFetchRaw<CommerceCart>("/commerce/cart/confirm-prices/", {
      method: "POST",
    });
  };

  const addWishlistItem = async (productId: number) => {
    return apiFetchRaw<WishlistResponse>("/commerce/wishlist/items/", {
      method: "POST",
      body: { product_id: productId },
    });
  };

  const updateCartItem = async (itemId: number, payload: CartItemUpdatePayload) => {
    return apiFetchRaw<CommerceCart>(`/commerce/cart/items/${itemId}/`, {
      method: "PATCH",
      body: payload,
    });
  };

  const deleteCartItem = async (itemId: number) => {
    return apiFetchRaw<CommerceCart>(`/commerce/cart/items/${itemId}/`, {
      method: "DELETE",
    });
  };

  const deleteWishlistItem = async (productId: number) => {
    return apiFetchRaw<WishlistResponse>(`/commerce/wishlist/items/${productId}/`, {
      method: "DELETE",
    });
  };

  const checkoutOrder = async (payload: CheckoutPayload) => {
    return apiFetchRaw<CommerceOrderSummary>("/commerce/orders/checkout/", {
      method: "POST",
      body: payload,
    });
  };

  const checkoutBuyNow = async (payload: CheckoutPayload) => {
    return apiFetchRaw<CommerceOrderSummary>("/commerce/buy-now/checkout/", {
      method: "POST",
      body: payload,
    });
  };

  const getOrderSummary = async (token: string) => {
    return apiFetchRaw<CommerceOrderSummary>(`/commerce/orders/${token}/`);
  };

  const getOwnedOrders = async (
    page = 1,
    options?: CommerceRequestOptions,
  ) => {
    const query = page > 1 ? `?page=${page}` : "";

    return apiFetchRaw<OwnedOrdersResponse>(`/commerce/orders/${query}`, {
      headers: resolveHeaders(options),
    });
  };

  const getOwnedOrderDetail = async (
    token: string,
    options?: CommerceRequestOptions,
  ) => {
    return apiFetchRaw<OwnedOrderDetail>(`/commerce/orders/${token}/detail/`, {
      headers: resolveHeaders(options),
    });
  };

  return {
    getCart,
    getWishlist,
    addCartItem,
    createBuyNowSession,
    getBuyNowSession,
    deleteBuyNowSession,
    confirmBuyNowSession,
    confirmCartPrices,
    addWishlistItem,
    updateCartItem,
    deleteCartItem,
    deleteWishlistItem,
    checkoutOrder,
    checkoutBuyNow,
    getOrderSummary,
    getOwnedOrders,
    getOwnedOrderDetail,
  };
};
