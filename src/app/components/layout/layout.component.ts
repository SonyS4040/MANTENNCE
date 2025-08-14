import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header></app-header>
    <main class="content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .content {
      padding: 1rem;
    }
  `]
})
export class LayoutComponent { }