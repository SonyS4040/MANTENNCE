import { Component, Input, OnInit, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';
import { TicketDetail } from '../ticket-detail/ticket-detail.component';

@Component({
  selector: 'app-ticket-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-report-form.component.html',
  styleUrl: './ticket-report-form.component.css'
})
export class TicketReportFormComponent implements OnInit {
  @Input({ required: true }) ticket!: TicketDetail;
  @Output() ticketUpdated = new EventEmitter<TicketDetail>();

  isSavingReport = signal(false);
  reportForm: FormGroup;

  private fb = inject(FormBuilder);

  constructor() {
    this.reportForm = this.fb.group({
      technical_inspection_notes: [''],
      repair_notes: [''],
      handover_notes: ['']
    });
  }

  ngOnInit(): void {
    this.reportForm.patchValue({
      technical_inspection_notes: this.ticket.technical_inspection_notes,
      repair_notes: this.ticket.repair_notes,
      handover_notes: this.ticket.handover_notes
    });
  }

  async saveReport() {
    if (this.reportForm.invalid || this.isSavingReport()) return;
    this.isSavingReport.set(true);
    const reportData = this.reportForm.value;
    try {
      const { data, error } = await supabase.from('tickets').update(reportData).eq('id', this.ticket.id).select('*, engineers(name)').single();
      if (error) throw error;
      this.ticketUpdated.emit(data as TicketDetail);
      this.reportForm.markAsPristine();
      alert('تم حفظ بيانات التقرير الفني بنجاح!');
    } catch (err: any) {
      alert(`حدث خطأ أثناء حفظ التقرير: ${err.message}`);
    } finally {
      this.isSavingReport.set(false);
    }
  }
}