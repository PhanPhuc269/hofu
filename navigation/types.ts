export type RootStackParamList = {
  "(tabs)": undefined;
  login: undefined;
  restaurant: { restaurantId?: string } | undefined;
  "address-selection": { from?: string } | undefined;
  modal: undefined;
  cart: undefined;
  "order-tracking":
    | {
        orderId: string;
        customerLocation?: { latitude: number; longitude: number };
      }
    | undefined;
  "order-detail": undefined;
};

export default RootStackParamList;
