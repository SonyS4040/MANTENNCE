import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="header">
      <nav>
        <a routerLink="/" class="logo">Angular App</a>
      </nav>
    </header>
  `,
  styles: [`
    .header {
      background-color: #1976d2;
      padding: 1rem 2rem;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: white;
      text-decoration: none;
    }
  `]
})
export class HeaderComponent { }