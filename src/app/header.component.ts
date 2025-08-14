import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="header">
      <nav>
        <a routerLink="/" class="logo">نظام التذاكر</a>
        <div class="nav-links">
          <a routerLink="/new-ticket" class="nav-link">تذكرة جديدة</a>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .header {
      background-color: #1976d2;
      padding: 1rem 2rem;
      color: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      direction: rtl;
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
    .nav-links {
      display: flex;
      gap: 1rem;
    }
    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class HeaderComponent { }