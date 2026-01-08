export type TripStatusValue =
  | "searching"
  | "driver_assigned"
  | "accepted"
  | "active"
  | "completed"
  | "cancelled"
  | "driver not found";

export type TripStatus = {
  label: string;
  value: TripStatusValue;
};

export type WebSocketMessage = {
  event: "trip:assigned" | "trip:status:update" | string;
  data: any;
  message_id: string;
};