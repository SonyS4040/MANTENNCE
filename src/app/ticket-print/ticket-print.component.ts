import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';

// Define interfaces locally for this component's specific needs
export interface MaintenanceCost {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

export interface TicketForPrint {
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
  engineers: { name: string } | null;
  technical_inspection_notes: string | null;
  repair_notes: string | null;
  handover_notes: string | null;
  maintenance_costs: MaintenanceCost[];
}

@Component({
  selector: 'app-ticket-print',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, CurrencyPipe],
  templateUrl: './ticket-print.component.html',
  styleUrl: './ticket-print.component.css'
})
export class TicketPrintComponent implements OnInit {
  ticket = signal<TicketForPrint | null>(null);
  isLoading = true;
  error: string | null = null;

  totalCost = computed(() => {
    if (!this.ticket()?.maintenance_costs) {
      return 0;
    }
    return this.ticket()!.maintenance_costs.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  });

  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.fetchTicketDetails(ticketId);
    } else {
      this.error = 'لم يتم العثور على معرف العطل.';
      this.isLoading = false;
    }
  }

  async fetchTicketDetails(id: string) {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, engineers(name), maintenance_costs(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        this.ticket.set(data as TicketForPrint);
        // Automatically trigger print dialog after a short delay to allow rendering
        setTimeout(() => this.printPage(), 500);
      } else {
        this.error = 'لم يتم العثور على العطل المطلوب.';
      }

    } catch (err: any) {
      this.error = `حدث خطأ في جلب تفاصيل العطل: ${err.message}`;
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  printPage() {
    window.print();
  }
}