import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { TicketDetail } from '../ticket-detail/ticket-detail.component';

@Component({
  selector: 'app-ticket-print',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './ticket-print.component.html',
  styleUrl: './ticket-print.component.css'
})
export class TicketPrintComponent implements OnInit {
  ticket = signal<TicketDetail | null>(null);
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
        .select('*, engineers(name)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (data) {
        this.ticket.set(data as TicketDetail);
      } else {
        this.error = 'لم يتم العثور على العطل المطلوب.';
      }

    } catch (err: any) {
      this.error = `حدث خطأ في جلب تفاصيل العطل: ${err.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  printReport() {
    window.print();
  }
}