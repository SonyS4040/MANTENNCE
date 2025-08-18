import { Component, Input, OnInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';
import { TicketDetail } from '../ticket-detail/ticket-detail.component';

export interface Engineer {
  id: string;
  name: string;
}

@Component({
  selector: 'app-ticket-actions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-actions.component.html',
  styleUrl: './ticket-actions.component.css'
})
export class TicketActionsComponent implements OnInit {
  @Input({ required: true }) ticket!: TicketDetail;
  @Output() ticketUpdated = new EventEmitter<TicketDetail>();

  engineers = signal<Engineer[]>([]);
  isUpdatingStatus = signal(false);
  isAssigningEngineer = signal(false);
  selectedRepairVideo: File | null = null;

  statusUpdateForm: FormGroup;
  engineerAssignmentForm: FormGroup;
  availableStatuses = ['مفتوح', 'قيد المعالجة', 'تم الإصلاح', 'لم يتم الإصلاح', 'معلق'];

  private fb = inject(FormBuilder);

  constructor() {
    this.statusUpdateForm = this.fb.group({
      newStatus: ['']
    });
    this.engineerAssignmentForm = this.fb.group({
      engineerId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchEngineers();
    this.statusUpdateForm.patchValue({ newStatus: this.ticket.status });
    this.engineerAssignmentForm.patchValue({ engineerId: this.ticket.assigned_engineer_id });
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

  onRepairVideoChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedRepairVideo = event.target.files[0];
    } else {
      this.selectedRepairVideo = null;
    }
  }

  async updateTicketStatus() {
    if (this.isUpdatingStatus()) return;
    
    const newStatus = this.statusUpdateForm.value.newStatus;

    if (newStatus === 'تم الإصلاح' && !this.selectedRepairVideo) {
      alert('الرجاء رفع فيديو بعد الإصلاح لإتمام العملية.');
      return;
    }

    this.isUpdatingStatus.set(true);
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

      const { data, error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', this.ticket.id)
        .select('*, engineers(name)')
        .single();

      if (error) throw error;

      this.ticketUpdated.emit(data as TicketDetail);
      this.selectedRepairVideo = null;
      const videoInput = document.getElementById('repair_video') as HTMLInputElement;
      if (videoInput) videoInput.value = '';

      alert('تم تحديث حالة العطل بنجاح!');

    } catch (err: any) {
      alert(`حدث خطأ أثناء تحديث الحالة: ${err.message}`);
    } finally {
      this.isUpdatingStatus.set(false);
    }
  }

  async assignEngineer() {
    if (this.engineerAssignmentForm.invalid || this.isAssigningEngineer()) return;
    this.isAssigningEngineer.set(true);
    const engineerId = this.engineerAssignmentForm.value.engineerId;
    try {
      const { data, error } = await supabase.from('tickets').update({ assigned_engineer_id: engineerId }).eq('id', this.ticket.id).select('*, engineers(name)').single();
      if (error) throw error;
      this.ticketUpdated.emit(data as TicketDetail);
      alert('تم تعيين المهندس بنجاح!');
    } catch (err: any) {
      alert(`حدث خطأ أثناء تعيين المهندس: ${err.message}`);
    } finally {
      this.isAssigningEngineer.set(false);
    }
  }
}