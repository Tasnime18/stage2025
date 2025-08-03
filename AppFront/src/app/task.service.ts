import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Tache {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string; // ISO format
  dureeEnHeures: number;
  priorite: string;
  agentId: number | null;
}


@Injectable({
  providedIn: 'root'
})
export class TaskService {
private baseUrl = 'http://localhost:8083/taches';

 constructor(private http: HttpClient) { }

 private getAuthHeaders(): HttpHeaders {
  const token = localStorage.getItem('token');
  return new HttpHeaders({ Authorization: `Bearer ${token}` });
}

  getTaches(): Observable<Tache[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<Tache[]>(this.baseUrl, { headers });
  }
  getMesTaches(): Observable<Tache[]> {
  return this.http.get<Tache[]>('http://localhost:8083/taches/mes-taches', { 
    headers: this.getAuthHeaders() 
  });
}

  ajouterTache(tache: any): Observable<any> {
  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post<any>(this.baseUrl, tache, { headers });
}
updateTache(tache: Tache): Observable<any> {
  return this.http.put(`${this.baseUrl}/${tache.id}`, tache);
}

deleteTache(id: number): Observable<any> {
  return this.http.delete(`${this.baseUrl}/${id}`,{ responseType: 'text' });
}

getTachesFiltres(params: any): Observable<Tache[]> {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  let queryParams = new URLSearchParams();
  for (const key in params) {
    if (params[key]) queryParams.set(key, params[key]);
  }
  const url = `${this.baseUrl}/filtre?${queryParams.toString()}`;

  return this.http.get<Tache[]>(url, { headers });
}


}
