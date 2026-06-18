type CheckoutSource = "cart" | "buy-now";

export const useCheckoutIdempotency = (source: CheckoutSource) => {
  const idempotencyKey = useState<string | null>(
    `checkout-idempotency:${source}`,
    () => null,
  );

  const getOrCreateKey = () => {
    if (!idempotencyKey.value) {
      idempotencyKey.value = crypto.randomUUID();
    }

    return idempotencyKey.value;
  };

  const clearKey = () => {
    idempotencyKey.value = null;
  };

  return {
    idempotencyKey: readonly(idempotencyKey),
    getOrCreateKey,
    clearKey,
  };
};
