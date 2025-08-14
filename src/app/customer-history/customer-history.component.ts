import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { Ticket } from '../tickets-list/tickets-list.component';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
}

@Component({
  selector: 'app-customer-history',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './customer-history.component.html',
  styleUrl: './customer-history.component.css'
})
export class CustomerHistoryComponent implements OnInit {
  customerInfo = signal<CustomerInfo | null>(null);
  tickets = signal<Ticket[]>([]);
  isLoading = true;
  error: string | null = null;

  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const customerEmail = this.route.snapshot.paramMap.get('email');
    if (customerEmail) {
      this.fetchCustomerHistory(customerEmail);
    } else {
      this.error = 'لم يتم تحديد بريد إلكتروني للعميل.';
      this.isLoading = false;
    }
  }

  async fetchCustomerHistory(email: string) {
    this.isLoading = true;
    this.error = null;
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, created_at, ticket_ref, customer_name, customer_phone, customer_email, customer_address, device_type, priority, status')
        .eq('customer_email', email)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        this.tickets.set(data);
        // Set customer info from the first ticket
        this.customerInfo.set({
          name: data[0].customer_name,
          phone: data[0].customer_phone,
          email: data[0].customer_email,
          address: data[0].customer_address
        });
      } else {
        this.error = 'لم يتم العثور على طلبات صيانة لهذا العميل.';
      }
    } catch (err: any) {
      this.error = `حدث خطأ أثناء جلب سجل العميل: ${err.message}`;
    } finally {
      this.isLoading = false;
    }
  }
}