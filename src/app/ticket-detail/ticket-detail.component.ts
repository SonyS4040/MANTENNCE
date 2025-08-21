import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { Ticket } from '../tickets-list/tickets-list.component';
import { TicketCostsComponent } from '../ticket-costs/ticket-costs.component';
import { TicketActionsComponent } from '../ticket-actions/ticket-actions.component';
import { TicketReportFormComponent } from '../ticket-report-form/ticket-report-form.component';
import { TicketInfoComponent } from '../ticket-info/ticket-info.component';

export interface TicketDetail extends Ticket {
  customer_phone: string;
  customer_address: string;
  serial_number: string | null;
  fault_description: string;
  attachment_url: string | null;
  assigned_engineer_id: string | null;
  engineers: { name: string } | null;
  technical_inspection_notes: string | null;
  repair_notes: string | null;
  handover_notes: string | null;
  repair_video_url: string | null;
  before_repair_video_url: string | null;
  warranty_status: string;
  visit_date: string | null;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    DatePipe, 
    TicketCostsComponent,
    TicketActionsComponent,
    TicketReportFormComponent,
    TicketInfoComponent
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  ticket = signal<TicketDetail | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.fetchTicketDetails(ticketId);
    } else {
      this.error.set('لم يتم العثور على معرف العطل.');
      this.isLoading.set(false);
    }
  }

  async fetchTicketDetails(id: string) {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, engineers(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        this.ticket.set(data as TicketDetail);
      } else {
        this.error.set('لم يتم العثور على العطل المطلوب.');
      }

    } catch (err: any) {
      this.error.set(`حدث خطأ في جلب تفاصيل العطل: ${err.message}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  handleTicketUpdate(updatedTicket: TicketDetail) {
    this.ticket.set(updatedTicket);
  }
}