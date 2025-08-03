import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl= 'http://localhost:8080/api/auth/login';

  constructor(private http: HttpClient) { }

  login(credentials: {mail:string; motdepasse: string}): Observable<any>{
    return this.http.post(this.apiUrl, credentials).pipe(
      catchError((error)=>{
        return throwError(()=>error);
      })
    );  
  }

  getUserId(): number {
  const token = localStorage.getItem('token');
  if (!token) return -1;

  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload?.Id;
}

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

   getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }
}