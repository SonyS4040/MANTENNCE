import { Routes } from '@angular/router';
import { HomeComponent } from './home.component';
import { NotFoundComponent } from './not-found.component';
import { LayoutComponent } from './layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: '**', component: NotFoundComponent }
    ]
  }
];