export enum AppointmentStatusEnum {
  Pending   = "pending",
  Approved  = "approved",
  Rejected  = "rejected",
  Cancelled = "cancelled",
}

export const APPOINTMENT_STATUS_CONFIG: Record<
  AppointmentStatusEnum,
  { label: string; color: string }
> = {
  [AppointmentStatusEnum.Pending]:   { label: "Onay Bekliyor", color: "#D4AF37" },
  [AppointmentStatusEnum.Approved]:  { label: "Onaylandı",     color: "#22C55E" },
  [AppointmentStatusEnum.Rejected]:  { label: "Reddedildi",    color: "#EF4444" },
  [AppointmentStatusEnum.Cancelled]: { label: "İptal Edildi",  color: "#EF4444" },
};
