import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

  constructor(private fb: FormBuilder) {
    this.ticketForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerAddress: ['', Validators.required],
      deviceType: ['', Validators.required],
      serialNumber: [''],
      faultDescription: ['', Validators.required],
      priority: ['عادي', Validators.required],
      attachments: [null]
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.ticketForm.patchValue({
        attachments: file
      });
    }
  }

  onSubmit() {
    if (this.ticketForm.valid) {
      console.log('Form Submitted!', this.ticketForm.value);
      // Here we would typically send the data to a server
      alert('تم إرسال طلب الصيانة بنجاح!');
      this.ticketForm.reset();
    } else {
      // Mark all fields as touched to display validation errors
      this.ticketForm.markAllAsTouched();
    }
  }
}