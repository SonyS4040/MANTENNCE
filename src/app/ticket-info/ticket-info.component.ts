import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TicketDetail } from '../ticket-detail/ticket-detail.component';

@Component({
  selector: 'app-ticket-info',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './ticket-info.component.html',
  styleUrl: './ticket-info.component.css'
})
export class TicketInfoComponent {
  @Input({ required: true }) ticket!: TicketDetail;
}