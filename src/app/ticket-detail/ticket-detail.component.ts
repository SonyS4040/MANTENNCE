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
  customer_address: string;
  serial_number: string | null;
  fault_description: string;
  attachment_url: string | null;
  assigned_engineer_id: string | null;
  engineers: { name: string } | null;
  technical_inspection_notes: string | null;
  repair_notes: string | null;
  handover_notes: string | null;
  maintenance_cost: number | null;
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
  engineers = signal<Engineer[]>([]);
  isLoading = true;
  error: string | null = null;
  isUpdatingStatus = false;
  isAssigningEngineer = false;
  isSavingReport = false;
  isSavingCost = false;

  statusUpdateForm: FormGroup;
  engineerAssignmentForm: FormGroup;
  reportForm: FormGroup;
  costForm: FormGroup;
  availableStatuses = ['مفتوح', 'قيد المعالجة', 'تم الإصلاح', 'لم يتم الإصلاح', 'معلق'];

  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  constructor() {
    this.statusUpdateForm = this.fb.group({
      newStatus: ['']
    });
    this.engineerAssignmentForm = this.fb.group({
      engineerId: [null, Validators.required]
    });
    this.reportForm = this.fb.group({
      technical_inspection_notes: [''],
      repair_notes: [''],
      handover_notes: ['']
    });
    this.costForm = this.fb.group({
      maintenance_cost: [0, [Validators.required, Validators.min(0)]]
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
        const ticketData = data as TicketDetail;
        this.ticket.set(ticketData);
        this.statusUpdateForm.patchValue({ newStatus: ticketData.status });
        this.engineerAssignmentForm.patchValue({ engineerId: ticketData.assigned_engineer_id });
        this.reportForm.patchValue({
          technical_inspection_notes: ticketData.technical_inspection_notes,
          repair_notes: ticketData.repair_notes,
          handover_notes: ticketData.handover_notes
        });
        this.costForm.patchValue({
          maintenance_cost: ticketData.maintenance_cost
        });
      } else {
        this.error = 'لم يتم العثور على العطل المطلوب.';
      }

    } catch (err: any) {
      this.error = `حدث خطأ في جلب تفاصيل العطل: ${err.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  async fetchEngineers() {
    try {
      const { data, error } = await supabase.from('engineers').select('id, name').order('name');
      if (error) throw error;
      this.engineers.set(data || []);
    } catch (err: any) {
      console.error('Error fetching engineers:', err);
    }
  }

  async updateTicketStatus() {
    if (!this.ticket() || this.isUpdatingStatus) return;
    this.isUpdatingStatus = true;
    const newStatus = this.statusUpdateForm.value.newStatus;
    try {
      const { error } = await supabase.from('tickets').update({ status: newStatus }).eq('id', this.ticket()!.id);
      if (error) throw error;
      this.ticket.update(t => t ? { ...t, status: newStatus } : null);
      alert('تم تحديث حالة العطل بنجاح!');
    } catch (err: any) {
      alert(`حدث خطأ أثناء تحديث الحالة: ${err.message}`);
    } finally {
      this.isUpdatingStatus = false;
    }
  }

  async assignEngineer() {
    if (!this.ticket() || this.engineerAssignmentForm.invalid || this.isAssigningEngineer) return;
    this.isAssigningEngineer = true;
    const engineerId = this.engineerAssignmentForm.value.engineerId;
    try {
      const { data, error } = await supabase.from('tickets').update({ assigned_engineer_id: engineerId }).eq('id', this.ticket()!.id).select('*, engineers(name)').single();
      if (error) throw error;
      this.ticket.set(data as TicketDetail);
      alert('تم تعيين المهندس بنجاح!');
    } catch (err: any) {
      alert(`حدث خطأ أثناء تعيين المهندس: ${err.message}`);
    } finally {
      this.isAssigningEngineer = false;
    }
  }

  async saveReport() {
    if (!this.ticket() || this.reportForm.invalid || this.isSavingReport) return;
    this.isSavingReport = true;
    const reportData = this.reportForm.value;
    try {
      const { error } = await supabase.from('tickets').update(reportData).eq('id', this.ticket()!.id);
      if (error) throw error;
      this.ticket.update(t => t ? { ...t, ...reportData } : null);
      this.reportForm.markAsPristine();
      alert('تم حفظ بيانات التقرير الفني بنجاح!');
    } catch (err: any) {
      alert(`حدث خطأ أثناء حفظ التقرير: ${err.message}`);
    } finally {
      this.isSavingReport = false;
    }
  }

  async saveMaintenanceCost() {
    if (!this.ticket() || this.costForm.invalid || this.isSavingCost) return;
    this.isSavingCost = true;
    const costData = this.costForm.value;
    try {
      const { error } = await supabase.from('tickets').update(costData).eq('id', this.ticket()!.id);
      if (error) throw error;
      this.ticket.update(t => t ? { ...t, ...costData } : null);
      this.costForm.markAsPristine();
      alert('تم حفظ تكلفة الصيانة بنجاح!');
    } catch (err: any) {
      alert(`حدث خطأ أثناء حفظ التكلفة: ${err.message}`);
    } finally {
      this.isSavingCost = false;
    }
  }
}