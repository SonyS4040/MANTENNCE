import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found-container">
      <h1>404 - الصفحة غير موجودة</h1>
      <p>الصفحة التي تبحث عنها غير موجودة.</p>
      <a routerLink="/">العودة إلى الصفحة الرئيسية</a>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      font-family: Arial, sans-serif;
      padding: 4rem 1rem;
    }
    h1 {
      font-size: 3rem;
      color: #333;
    }
    p {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 2rem;
    }
    a {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      transition: background-color 0.3s;
    }
    a:hover {
      background-color: #0056b3;
    }
  `]
})
export class NotFoundComponent { }