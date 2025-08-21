import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TicketDetail } from '../ticket-detail/ticket-detail.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';

@Component({
  selector: 'app-ticket-info',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule],
  templateUrl: './ticket-info.component.html',
  styleUrl: './ticket-info.component.css'
})
export class TicketInfoComponent implements OnChanges {
  @Input({ required: true }) ticket!: TicketDetail;
  @Output() ticketUpdated = new EventEmitter<TicketDetail>();

  isEditing = signal(false);
  isSaving = signal(false);
  ticketForm: FormGroup;

  private fb = inject(FormBuilder);

  constructor() {
    this.ticketForm = this.fb.group({
      customer_name: ['', Validators.required],
      customer_phone: ['', Validators.required],
      customer_address: ['', Validators.required],
      device_type: ['', Validators.required],
      serial_number: [''],
      fault_description: ['', Validators.required],
      warranty_status: ['', Validators.required],
      visit_date: [null]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticket'] && this.ticket) {
      this.populateForm();
    }
  }

  toggleEdit(): void {
    this.isEditing.set(!this.isEditing());
    if (this.isEditing()) {
      this.populateForm();
    }
  }

  private populateForm(): void {
    this.ticketForm.patchValue({
      customer_name: this.ticket.customer_name,
      customer_phone: this.ticket.customer_phone,
      customer_address: this.ticket.customer_address,
      device_type: this.ticket.device_type,
      serial_number: this.ticket.serial_number,
      fault_description: this.ticket.fault_description,
      warranty_status: this.ticket.warranty_status,
      visit_date: this.ticket.visit_date
    });
  }

  async saveChanges(): Promise<void> {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(this.ticketForm.value)
        .eq('id', this.ticket.id)
        .select('*, engineers(name)')
        .single();

      if (error) throw error;

      this.ticketUpdated.emit(data as TicketDetail);
      this.isEditing.set(false);
      alert('تم تحديث بيانات العطل بنجاح.');
    } catch (err: any) {
      console.error('Error updating ticket info:', err);
      alert(`حدث خطأ أثناء تحديث البيانات: ${err.message}`);
    } finally {
      this.isSaving.set(false);
    }
  }
}