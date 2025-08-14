import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { NotFoundComponent } from './not-found.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '**', component: NotFoundComponent }
];