import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { supabase } from '../../integrations/supabase/client';

@Component({
  selector: 'app-create-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket.component.html',
  styleUrl: './create-ticket.component.css'
})
export class CreateTicketComponent {
  ticketForm: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.ticketForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerAddress: ['', Validators.required],
      deviceType: ['', Validators.required],
      serialNumber: [''],
      faultDescription: ['', Validators.required],
      priority: ['عادي', Validators.required],
      warrantyStatus: ['خارج الضمان', Validators.required],
      visitDate: [null]
    });
  }

  async onSubmit() {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      // Prepare data for insertion with correct snake_case keys
      const formValue = this.ticketForm.value;
      const ticketData = {
        customer_name: formValue.customerName,
        customer_phone: formValue.customerPhone,
        customer_address: formValue.customerAddress,
        device_type: formValue.deviceType,
        serial_number: formValue.serialNumber,
        fault_description: formValue.faultDescription,
        priority: formValue.priority,
        warranty_status: formValue.warrantyStatus,
        visit_date: formValue.visitDate
      };

      // Insert data into the 'tickets' table
      const { error: insertError } = await supabase.from('tickets').insert([ticketData]);

      if (insertError) {
        throw insertError;
      }

      alert('تم إرسال طلب الصيانة بنجاح!');
      this.ticketForm.reset({ priority: 'عادي', warrantyStatus: 'خارج الضمان' });

    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      alert(`حدث خطأ أثناء إرسال الطلب: ${error.message}`);
    } finally {
      this.isSubmitting = false;
    }
  }
}