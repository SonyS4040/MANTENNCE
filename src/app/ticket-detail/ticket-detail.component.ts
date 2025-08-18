import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { supabase } from '../../integrations/supabase/client';
import { Ticket } from '../tickets-list/tickets-list.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export interface Engineer {
  id: string;
  name: string;
}

export interface MaintenanceCost {
  id: string;
  ticket_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  created_at: string;
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
  repair_video_url: string | null;
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
  costItems = signal<MaintenanceCost[]>([]);
  isLoading = true;
  error: string | null = null;
  isUpdatingStatus = false;
  isAssigningEngineer = false;
  isSavingReport = false;
  isAddingCost = false;
  selectedRepairVideo: File | null = null;

  statusUpdateForm: FormGroup;
  engineerAssignmentForm: FormGroup;
  reportForm: FormGroup;
  costItemForm: FormGroup;
  availableStatuses = ['مفتوح', 'قيد المعالجة', 'تم الإصلاح', 'لم يتم الإصلاح', 'معلق'];

  totalCost = computed(() => 
    this.costItems().reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  );

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
    this.costItemForm = this.fb.group({
      description: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(0.01)]],
      unit_price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    const ticketId = this.route.snapshot.paramMap.get('id');
    if (ticketId) {
      this.fetchTicketDetails(ticketId);
      this.fetchEngineers();
      this.fetchCostItems(ticketId);
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

  async fetchCostItems(ticketId: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_costs')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      this.costItems.set(data || []);
    } catch (err: any) {
      console.error('Error fetching cost items:', err);
      alert(`حدث خطأ في جلب بنود التكلفة: ${err.message}`);
    }
  }

  async addCostItem() {
    if (!this.ticket() || this.costItemForm.invalid) {
      this.costItemForm.markAllAsTouched();
      return;
    }
    this.isAddingCost = true;
    const costData = {
      ...this.costItemForm.value,
      ticket_id: this.ticket()!.id
    };
    try {
      const { error } = await supabase.from('maintenance_costs').insert([costData]);
      if (error) throw error;
      this.costItemForm.reset({ quantity: 1, unit_price: 0, description: '' });
      await this.fetchCostItems(this.ticket()!.id);
    } catch (err: any) {
      alert(`حدث خطأ أثناء إضافة بند التكلفة: ${err.message}`);
    } finally {
      this.isAddingCost = false;
    }
  }

  async deleteCostItem(costId: string) {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا البند؟')) return;
    try {
      const { error } = await supabase.from('maintenance_costs').delete().eq('id', costId);
      if (error) throw error;
      await this.fetchCostItems(this.ticket()!.id);
    } catch (err: any) {
      alert(`حدث خطأ أثناء حذف بند التكلفة: ${err.message}`);
    }
  }

  onRepairVideoChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedRepairVideo = event.target.files[0];
    } else {
      this.selectedRepairVideo = null;
    }
  }

  async updateTicketStatus() {
    if (!this.ticket() || this.isUpdatingStatus) return;
    
    const newStatus = this.statusUpdateForm.value.newStatus;

    if (newStatus === 'تم الإصلاح' && !this.selectedRepairVideo) {
      alert('الرجاء رفع فيديو بعد الإصلاح لإتمام العملية.');
      return;
    }

    this.isUpdatingStatus = true;
    let repairVideoUrl: string | null = null;

    try {
      if (newStatus === 'تم الإصلاح' && this.selectedRepairVideo) {
        const file = this.selectedRepairVideo;
        const filePath = `public/repair-videos/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
        repairVideoUrl = data.publicUrl;
      }

      const updateData: { status: string; repair_video_url?: string } = { status: newStatus };
      if (repairVideoUrl) {
        updateData.repair_video_url = repairVideoUrl;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', this.ticket()!.id);

      if (error) throw error;

      this.ticket.update(t => {
        if (!t) return null;
        const updatedTicket: TicketDetail = { ...t, status: newStatus };
        if (repairVideoUrl) {
          updatedTicket.repair_video_url = repairVideoUrl;
        }
        return updatedTicket;
      });
      
      this.selectedRepairVideo = null;
      const videoInput = document.getElementById('repair_video') as HTMLInputElement;
      if (videoInput) videoInput.value = '';

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
}