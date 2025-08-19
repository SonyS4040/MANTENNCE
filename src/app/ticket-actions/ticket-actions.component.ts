import { Component, Input, OnInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';
import { TicketDetail } from '../ticket-detail/ticket-detail.component';

export interface Engineer {
  id: string;
  name: string;
}

type VideoType = 'before' | 'after';

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
  
  selectedVideos: { [key in VideoType]?: File } = {};
  isSendingVideo: { [key in VideoType]?: boolean } = { before: false, after: false };

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

  onVideoChange(event: any, type: VideoType) {
    if (event.target.files.length > 0) {
      this.selectedVideos[type] = event.target.files[0];
    } else {
      this.selectedVideos[type] = undefined;
    }
  }

  async uploadAndSendVideo(type: VideoType) {
    const file = this.selectedVideos[type];
    if (!file) {
      alert('الرجاء اختيار ملف فيديو أولاً.');
      return;
    }

    this.isSendingVideo[type] = true;
    
    try {
      // 1. Upload video to Supabase Storage
      const filePath = `public/repair-videos/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
      const videoUrl = urlData.publicUrl;

      // 2. Update ticket record with the new video URL
      const columnToUpdate = type === 'before' ? 'before_repair_video_url' : 'repair_video_url';
      const { data: updatedTicket, error: updateError } = await supabase
        .from('tickets')
        .update({ [columnToUpdate]: videoUrl })
        .eq('id', this.ticket.id)
        .select('*, engineers(name)')
        .single();
      
      if (updateError) throw updateError;
      this.ticketUpdated.emit(updatedTicket as TicketDetail);
      
      // 3. Invoke the Edge Function to send WhatsApp message
      const { error: functionError } = await supabase.functions.invoke('send-whatsapp-video', {
        body: { ticketId: this.ticket.id, videoType: type },
      });

      if (functionError) throw new Error(`Function error: ${functionError.message}`);

      alert(`تم رفع الفيديو وإرساله إلى العميل بنجاح!`);
      this.selectedVideos[type] = undefined;
      const inputId = type === 'before' ? 'before_repair_video' : 'after_repair_video';
      const fileInput = document.getElementById(inputId) as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (err: any) {
      console.error(`Error during ${type} video process:`, err);
      alert(`حدث خطأ: ${err.message}`);
    } finally {
      this.isSendingVideo[type] = false;
    }
  }

  async updateTicketStatus() {
    if (this.isUpdatingStatus()) return;
    
    const newStatus = this.statusUpdateForm.value.newStatus;
    this.isUpdatingStatus.set(true);

    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', this.ticket.id)
        .select('*, engineers(name)')
        .single();

      if (error) throw error;

      this.ticketUpdated.emit(data as TicketDetail);
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