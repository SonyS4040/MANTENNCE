import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { NotFoundComponent } from './not-found.component';
import { LayoutComponent } from './layout.component';
import { NewTicketComponent } from './new-ticket/new-ticket.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'new-ticket', component: NewTicketComponent },
      { path: '**', component: NotFoundComponent }
    ]
  }
];