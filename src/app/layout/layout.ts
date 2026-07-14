import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router'; 
import { AuthService } from '../auth/auth';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet], 
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class LayoutComponent implements OnInit {
  public authService = inject(AuthService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      if (!this.authService.currentUser()) {
        this.router.navigate(['/login']);
      }
    }
  }
}
