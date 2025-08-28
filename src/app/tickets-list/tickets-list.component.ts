import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../integrations/supabase/client';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.css'
})
export class TicketsListComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  isLoading = true;
  error: string | null = null;

  // Signals for filtering
  searchTerm = signal('');
  searchDate = signal('');

  private router = inject(Router);

  // Computed signal for filtered tickets
  filteredTickets = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const date = this.searchDate();

    return this.tickets().filter(ticket => {
      const matchesTerm = term
        ? ticket.customer_name.toLowerCase().includes(term) ||
          ticket.ticket_ref.toLowerCase().includes(term)
        : true;

      const matchesDate = date
        ? new Date(ticket.created_at).toISOString().split('T')[0] === date
        : true;

      return matchesTerm && matchesDate;
    });
  });

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
        this.tickets.set(data);
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

  clearFilters() {
    this.searchTerm.set('');
    this.searchDate.set('');
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
      this.tickets.update(tickets => tickets.filter(ticket => ticket.id !== ticketId));
      alert(`تم حذف العطل "${ticketRef}" بنجاح.`);

    } catch (err: any) {
      alert(`حدث خطأ أثناء حذف العطل: ${err.message}`);
      console.error(err);
    }
  }
}