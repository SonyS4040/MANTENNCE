import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: `
    <div class="main">
      <img src="https://angular.io/assets/images/logos/angular/angular.svg" alt="Angular Logo" width="120">
      <h1>Welcome to your Angular App!</h1>
      <p>This is a minimal template for Dyad.sh.</p>
      <p>Routing is now set up and working correctly.</p>
    </div>
  `,
  styles: [`
    .main {
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #fafafa;
    }
    img {
      margin-bottom: 2rem;
    }
    h1 {
      color: #333;
      margin-bottom: 1rem;
    }
    p {
      color: #666;
    }
  `]
})
export class HomeComponent { }