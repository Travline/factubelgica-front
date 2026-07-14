import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<User | null>(null);

  constructor() { }

  login(credentials: any): Observable<User> {
    const loginUrl = `${environment.apiUrl}/auth/login`;
    return this.http.post<User>(loginUrl, credentials, { withCredentials: true }).pipe(
      tap((user) => {
        this.currentUser.set(user);
      })
    );
  }

  logout() {
    this.currentUser.set(null);
  }
}
