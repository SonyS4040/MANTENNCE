import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../integrations/supabase/client';
import { RouterLink } from '@angular/router';

export interface Ticket {
  id: string;
  created_at: string;
  ticket_ref: string;
  customer_name: string;
  customer_email: string; // Added for linking
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

  async ngOnInit() {
    await this.fetchTickets();
  }

  async fetchTickets() {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, created_at, ticket_ref, customer_name, customer_email, device_type, priority, status')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
             this.error = 'الرجاء تسجيل الدخول لعرض قائمة الأعطال.';
        } else {
            throw error;
        }
      }
      
      if (data) {
        this.tickets = data as Ticket[];
      }

    } catch (err: any) {
      this.error = `حدث خطأ في جلب البيانات: ${err.message}`;
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }
}