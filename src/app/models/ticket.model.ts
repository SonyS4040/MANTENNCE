export interface TicketDetail {
  id: string;
  created_at: string;
  ticket_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  device_type: string;
  serial_number: string | null;
  fault_description: string;
  priority: string;
  status: string;
  attachment_url: string | null;
  assigned_engineer_id: string | null;
  technical_inspection_notes: string | null;
  repair_notes: string | null;
  handover_notes: string | null;
  repair_video_url: string | null;
  before_repair_video_url: string | null;
  engineers: { name: string } | null;
}