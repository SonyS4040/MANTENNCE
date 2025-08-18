import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreateTicketComponent } from './create-ticket/create-ticket.component';
import { TicketsListComponent } from './tickets-list/tickets-list.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './auth.guard';
import { TicketDetailComponent } from './ticket-detail/ticket-detail.component';
import { EngineersComponent } from './engineers/engineers.component';
import { TicketPrintComponent } from './ticket-print/ticket-print.component';
import { AccountsComponent } from './accounts/accounts.component';

export const routes: Routes = [
    { path: '', component: HomeComponent, title: 'الصفحة الرئيسية - أواسيس فارما' },
    { path: 'create-ticket', component: CreateTicketComponent, title: 'إبلاغ عن عطل - أواسيس فارما' },
    { 
      path: 'tickets', 
      component: TicketsListComponent, 
      title: 'متابعة الأعطال - أواسيس فارما',
      canActivate: [authGuard]
    },
    { 
      path: 'tickets/:id', 
      component: TicketDetailComponent, 
      title: 'تفاصيل العطل - أواسيس فارما',
      canActivate: [authGuard] 
    },
    { 
      path: 'tickets/:id/print',
      component: TicketPrintComponent, 
      title: 'طباعة تقرير - أواسيس فارما',
      canActivate: [authGuard] 
    },
    { 
      path: 'engineers', 
      component: EngineersComponent, 
      title: 'إدارة المهندسين - أواسيس فارما',
      canActivate: [authGuard] 
    },
    { 
      path: 'accounts', 
      component: AccountsComponent, 
      title: 'الحسابات - أواسيس فارما',
      canActivate: [authGuard] 
    },
    { path: 'login', component: LoginComponent, title: 'تسجيل الدخول - أواسيس فارما' }
];