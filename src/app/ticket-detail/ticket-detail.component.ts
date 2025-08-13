import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { Ticket } from '../tickets-list/tickets-list.component';

// Extend the interface to include all ticket fields
export interface TicketDetail extends Ticket {
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  serial_number: string | null;
  fault_description: string;
  attachment_url: string | null;
}

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  ticket: TicketDetail | null = null;
  isLoading = true;
  error: string | null = null;

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
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }
      
      if (data) {
        this.ticket = data as TicketDetail;
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
}