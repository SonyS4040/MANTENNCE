import { Routes } from '@angular/router';
import { CreateTicketComponent } from './create-ticket/create-ticket.component';
import { TicketsListComponent } from './tickets-list/tickets-list.component';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { EngineersManagementComponent } from './engineers-management/engineers-management.component';
import { AuthComponent } from './auth/auth.component';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', component: CreateTicketComponent },
  { path: 'login', component: AuthComponent },
  { 
    path: 'tickets', 
    component: TicketsListComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'tickets/:id', 
    component: TicketDetailComponent,
    canActivate: [authGuard]
  },
  {
    path: 'engineers',
    component: EngineersManagementComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '' }
];