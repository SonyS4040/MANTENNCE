import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../integrations/supabase/client';
import { Router, RouterLink } from '@angular/router';

export interface Ticket {
  id: string;
  created_at: string;
  ticket_ref: string;
  customer_name: string;
  device_type: string;
  priority: string;
  status: string;
}

@Component({
  selector: 'app-tickets-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.css'
})
export class TicketsListComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = true;
  error: string | null = null;

  private router = inject(Router);

  async ngOnInit() {
    await this.fetchTickets();
  }

  async fetchTickets() {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, created_at, ticket_ref, customer_name, device_type, priority, status')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
             this.error = 'الرجاء تسجيل الدخول لعرض قائمة الأعطال.';
        } else {
            throw error;
        }
      }
      
      if (data) {
        this.tickets = data;
      }

    } catch (err: any) {
      this.error = `حدث خطأ في جلب البيانات: ${err.message}`;
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  navigateToDetail(ticketId: string) {
    this.router.navigate(['/tickets', ticketId]);
  }

  async deleteTicket(ticketId: string, ticketRef: string, event: MouseEvent) {
    event.stopPropagation(); // Prevent row click from navigating

    if (!confirm(`هل أنت متأكد من رغبتك في حذف العطل رقم "${ticketRef}"؟ سيتم حذف جميع البيانات المتعلقة به نهائياً.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) {
        throw error;
      }

      // Update the UI instantly by removing the ticket from the local list
      this.tickets = this.tickets.filter(ticket => ticket.id !== ticketId);
      alert(`تم حذف العطل "${ticketRef}" بنجاح.`);

    } catch (err: any) {
      alert(`حدث خطأ أثناء حذف العطل: ${err.message}`);
      console.error(err);
    }
  }
}