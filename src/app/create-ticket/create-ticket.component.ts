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
  selectedFile: File | null = null;
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
      attachment: [null, Validators.required]
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.selectedFile = file;
      this.ticketForm.patchValue({ attachment: file });
      this.ticketForm.get('attachment')?.updateValueAndValidity();
    } else {
      this.selectedFile = null;
      this.ticketForm.patchValue({ attachment: null });
      this.ticketForm.get('attachment')?.updateValueAndValidity();
    }
  }

  async onSubmit() {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    let attachmentUrl = null;

    try {
      // 1. Handle file upload if a file is selected
      if (this.selectedFile) {
        const file = this.selectedFile;
        const filePath = `public/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(filePath);
        attachmentUrl = data.publicUrl;
      }

      // 2. Prepare data for insertion with correct snake_case keys
      const formValue = this.ticketForm.value;
      const ticketData = {
        customer_name: formValue.customerName,
        customer_phone: formValue.customerPhone,
        customer_address: formValue.customerAddress,
        device_type: formValue.deviceType,
        serial_number: formValue.serialNumber,
        fault_description: formValue.faultDescription,
        priority: formValue.priority,
        attachment_url: attachmentUrl
      };

      // 3. Insert data into the 'tickets' table
      const { error: insertError } = await supabase.from('tickets').insert([ticketData]);

      if (insertError) {
        throw insertError;
      }

      alert('تم إرسال طلب الصيانة بنجاح!');
      this.ticketForm.reset({ priority: 'عادي' });
      this.selectedFile = null;
      // Also reset the file input visually if possible
      const fileInput = document.getElementById('attachments') as HTMLInputElement;
      if(fileInput) fileInput.value = '';


    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      alert(`حدث خطأ أثناء إرسال الطلب: ${error.message}`);
    } finally {
      this.isSubmitting = false;
    }
  }
}