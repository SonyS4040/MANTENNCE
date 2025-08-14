import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TicketService } from '../ticket.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-ticket.component.html',
  styleUrls: ['./new-ticket.component.css']
})
export class NewTicketComponent {
  ticketForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private router: Router
  ) {
    this.ticketForm = this.fb.group({
      customer_name: ['', Validators.required],
      customer_phone: ['', Validators.required],
      customer_address: ['', Validators.required],
      device_type: ['', Validators.required],
      serial_number: [''],
      fault_description: ['', Validators.required],
      priority: ['عادي', Validators.required]
    });
  }

  async onSubmit() {
    if (this.ticketForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      await this.ticketService.createTicket(this.ticketForm.value);
      alert('تم إنشاء التذكرة بنجاح!');
      this.router.navigate(['/']);
    } catch (error) {
      this.errorMessage = 'حدث خطأ أثناء إنشاء التذكرة. يرجى المحاولة مرة أخرى.';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}