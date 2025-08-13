import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { supabase } from '../../integrations/supabase/client';

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
  imports: [CommonModule],
  templateUrl: './tickets-list.component.html',
  styleUrl: './tickets-list.component.css'
})
export class TicketsListComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = true;
  error: string | null = null;

  async ngOnInit() {
    // This page requires authentication, but for now we'll fetch data
    // without a logged-in user. This will fail until a user is logged in
    // because of the RLS policy. This is the next step.
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
        // This error is expected if no user is logged in.
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
}