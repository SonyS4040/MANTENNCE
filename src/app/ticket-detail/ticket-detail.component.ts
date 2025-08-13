import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { Ticket } from '../tickets-list/tickets-list.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

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
  imports: [CommonModule, RouterLink, DatePipe, ReactiveFormsModule],
  templateUrl: './ticket-detail.component.html',
  styleUrl: './ticket-detail.component.css'
})
export class TicketDetailComponent implements OnInit {
  ticket = signal<TicketDetail | null>(null);
  isLoading = true;
  error: string | null = null;
  isUpdating = false;

  statusUpdateForm: FormGroup;
  availableStatuses = ['مفتوح', 'قيد المعالجة', 'تم الإصلاح', 'لم يتم الإصلاح', 'معلق'];

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  constructor() {
    this.statusUpdateForm = this.fb.group({
      newStatus: ['']
    });
  }

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

      if (error) throw error;
      
      if (data) {
        this.ticket.set(data as TicketDetail);
        this.statusUpdateForm.patchValue({ newStatus: data.status });
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

  async updateTicketStatus() {
    if (!this.ticket() || this.isUpdating) return;

    this.isUpdating = true;
    const newStatus = this.statusUpdateForm.value.newStatus;
    const ticketId = this.ticket()!.id;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticketId);

      if (error) throw error;

      // Update the signal to reflect the change instantly
      this.ticket.update(currentTicket => {
        if (currentTicket) {
          return { ...currentTicket, status: newStatus };
        }
        return null;
      });
      
      alert('تم تحديث حالة العطل بنجاح!');

    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`حدث خطأ أثناء تحديث الحالة: ${err.message}`);
    } finally {
      this.isUpdating = false;
    }
  }
}