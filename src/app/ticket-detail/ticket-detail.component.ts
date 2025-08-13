import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { Ticket } from '../tickets-list/tickets-list.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface Engineer {
  id: string;
  name: string;
}

export interface TicketDetail extends Ticket {
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  serial_number: string | null;
  fault_description: string;
  attachment_url: string | null;
  assigned_engineer_id: string | null;
  engineers: { name: string } | null; // For joined data
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
  availableEngineers = signal<Engineer[]>([]);
  isLoading = true;
  error: string | null = null;
  isUpdating = false;
  isAssigning = false;

  statusUpdateForm: FormGroup;
  engineerAssignForm: FormGroup;
  availableStatuses = ['مفتوح', 'قيد المعالجة', 'تم الإصلاح', 'لم يتم الإصلاح', 'معلق'];

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  constructor() {
    this.statusUpdateForm = this.fb.group({
      newStatus: ['']
    });
    this.engineerAssignForm = this.fb.group({
      engineerId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.fetchTicketDetails(ticketId);
      this.fetchEngineers();
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
        this.statusUpdateForm.patchValue({ newStatus: data.status });
        this.engineerAssignForm.patchValue({ engineerId: data.assigned_engineer_id });
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

  async fetchEngineers() {
    try {
      const { data, error } = await supabase
        .from('engineers')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      this.availableEngineers.set(data || []);
    } catch (err: any) {
      console.error('Error fetching engineers:', err);
      this.error = 'حدث خطأ في جلب قائمة المهندسين.';
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

      this.ticket.update(currentTicket => currentTicket ? { ...currentTicket, status: newStatus } : null);
      alert('تم تحديث حالة العطل بنجاح!');

    } catch (err: any) {
      console.error('Error updating status:', err);
      alert(`حدث خطأ أثناء تحديث الحالة: ${err.message}`);
    } finally {
      this.isUpdating = false;
    }
  }

  async assignEngineer() {
    if (!this.ticket() || this.engineerAssignForm.invalid || this.isAssigning) return;

    this.isAssigning = true;
    const engineerId = this.engineerAssignForm.value.engineerId;
    const ticketId = this.ticket()!.id;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({ assigned_engineer_id: engineerId })
        .eq('id', ticketId)
        .select('*, engineers(name)')
        .single();

      if (error) throw error;

      // Refetch details to get the latest engineer name
      await this.fetchTicketDetails(ticketId);
      
      alert('تم تعيين المهندس بنجاح!');

    } catch (err: any) {
      console.error('Error assigning engineer:', err);
      alert(`حدث خطأ أثناء تعيين المهندس: ${err.message}`);
    } finally {
      this.isAssigning = false;
    }
  }
}