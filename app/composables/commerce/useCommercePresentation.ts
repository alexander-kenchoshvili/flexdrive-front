import type {
  CheckoutPaymentMethod,
  CommerceOrderStatus,
} from "~/types/commerce";

type TrackingStepState = "complete" | "current" | "pending";

type TrackingStep = {
  key: Exclude<CommerceOrderStatus, "cancelled">;
  label: string;
  state: TrackingStepState;
};

const paymentLabels: Record<CheckoutPaymentMethod, string> = {
  cash_on_delivery: "ნაღდი ანგარიშსწორება",
  card: "ბარათით გადახდა",
};

const statusLabels: Record<CommerceOrderStatus, string> = {
  new: "ახალი",
  confirmed: "დადასტურებულია",
  processing: "მზადდება",
  shipped: "გზაშია",
  delivered: "მიტანილია",
  cancelled: "გაუქმებულია",
};

const statusBadgeClasses: Record<CommerceOrderStatus, string> = {
  new: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
  confirmed: "border-border-default bg-surface-2 text-text-secondary",
  processing: "border-warning/30 bg-warning/10 text-warning",
  shipped: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
  delivered: "border-success/30 bg-success/10 text-success",
  cancelled: "border-error/30 bg-error/10 text-error",
};

const trackingOrder: TrackingStep["key"][] = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const stepClassMap: Record<
  TrackingStepState,
  {
    container: string;
    dot: string;
    line: string;
    text: string;
  }
> = {
  complete: {
    container: "border-success/25 bg-success/10",
    dot: "bg-success border-success text-success",
    line: "bg-success/60",
    text: "text-text-primary",
  },
  current: {
    container: "border-accent-primary/30 bg-accent-primary/10",
    dot: "bg-accent-primary border-accent-primary text-text-invert",
    line: "bg-accent-primary/50",
    text: "text-text-primary",
  },
  pending: {
    container: "border-border-default bg-surface-2",
    dot: "bg-transparent border-border-default text-text-muted",
    line: "bg-border-default",
    text: "text-text-muted",
  },
};

export const useCommercePresentation = () => {
  const getOrderStatusLabel = (status: CommerceOrderStatus) =>
    statusLabels[status] ?? status;

  const getOrderStatusBadgeClasses = (status: CommerceOrderStatus) =>
    statusBadgeClasses[status] ??
    "border-border-default bg-surface-2 text-text-secondary";

  const getPaymentMethodLabel = (method: CheckoutPaymentMethod) =>
    paymentLabels[method] ?? method;

  const isOrderCancelled = (status: CommerceOrderStatus) =>
    status === "cancelled";

  const getTrackingSteps = (status: CommerceOrderStatus): TrackingStep[] => {
    if (status === "cancelled") {
      return trackingOrder.map((key, index) => ({
        key,
        label: statusLabels[key],
        state: index === 0 ? "complete" : "pending",
      }));
    }

    if (status === "delivered") {
      return trackingOrder.map((key) => ({
        key,
        label: statusLabels[key],
        state: "complete",
      }));
    }

    const currentIndex = trackingOrder.indexOf(
      status as Exclude<CommerceOrderStatus, "cancelled">,
    );

    return trackingOrder.map((key, index) => ({
      key,
      label: statusLabels[key],
      state:
        index < currentIndex
          ? "complete"
          : index === currentIndex
            ? "current"
            : "pending",
    }));
  };

  const getTrackingStepClasses = (state: TrackingStepState) =>
    stepClassMap[state];

  return {
    getOrderStatusLabel,
    getOrderStatusBadgeClasses,
    getPaymentMethodLabel,
    isOrderCancelled,
    getTrackingSteps,
    getTrackingStepClasses,
  };
};
