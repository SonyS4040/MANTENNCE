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
  deviceTypes = [
    'جهاز ليزر لإزالة الشعر',
    'جهاز كافيتيشن للتخسيس',
    'جهاز شد الترهلات',
    'جهاز علاج طبيعي بالموجات فوق الصوتية'
  ];
  selectedFile: File | null = null;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.ticketForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerAddress: ['', Validators.required],
      deviceType: ['', Validators.required],
      serialNumber: [''],
      faultDescription: ['', Validators.required],
      priority: ['عادي', Validators.required]
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFile = null;
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

      // 2. Prepare data for insertion
      const ticketData = { ...this.ticketForm.value, attachment_url: attachmentUrl };

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