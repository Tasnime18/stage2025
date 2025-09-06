import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Compte {
  id?: number;
  nom: string;
  prenom: string;
  mail: string;
  motdepasse: string;
  role: string;
  actif?: boolean;
  serviceId?: number;
  nomService?: string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {
private apiUrl = 'http://localhost:8080/api/users';

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getAll(): Observable<Compte[]> {
    return this.http.get<Compte[]>(`${this.apiUrl}/all`);
  }
  add(compte: Compte): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, compte, { responseType: 'text' });
  }

  update(id: number, compte: Compte): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, compte, { responseType: 'text' });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
  getUserId(): number | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.Id;
  }

  getUserRole(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  }
  activer(id: number) {
  return this.http.put(`${this.apiUrl}/activer/${id}`, {}, { responseType: 'text' });
}

desactiver(id: number) {
  return this.http.put(`${this.apiUrl}/desactiver/${id}`, {}, { responseType: 'text' });
}
getByServiceId(serviceId: number): Observable<Compte[]> {
  return this.http.get<Compte[]>(`${this.apiUrl}/by-service/${serviceId}`);
}





}
