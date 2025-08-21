import { Component, OnInit } from '@angular/core';
import { Tache, TaskService } from '../task.service'; 
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Compte, UserService } from '../user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-tache',
  imports: [CommonModule,FormsModule,ReactiveFormsModule,MatSnackBarModule 
  ],
  templateUrl: './tache.component.html',
  styleUrl: './tache.component.css'
})
export class TacheComponent implements OnInit {
taches: Tache[] = [];
users: Compte[] = [];
filtres = {
  agentId: '',
  priorite: '',
  dateDebutStart: '',
  dateDebutEnd: ''
};

userName: string = 'Chargement...';
userPrenom: string = '';
userNom: string = '';

  utilisateurs: Compte[] = [];
  role: string | null = '';
  userId: number | null = null;

  showModal = false;
  isEdit = false;
  selectedTache: Tache = this.initTache();

  constructor(private taskService: TaskService, private userService: UserService,
    private http: HttpClient,private router: Router,private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.role = this.userService.getUserRole();
    this.userId = this.userService.getUserId();
    this.loadTaches();
    this.userService.getAll().subscribe(users => this.utilisateurs = users);

  this.role = this.userService.getUserRole();
  this.userId = this.userService.getUserId();

  //Décoder le token pour obtenir le nom/prénom
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // Décoder JWT
      this.userPrenom = payload.prenom || 'Utilisateur';
      this.userNom = payload.nom || '';
      this.userName = `${this.userPrenom} ${this.userNom}`.trim();
    } catch (e) {
      console.error('Erreur lecture token:', e);
      this.userName = 'Profil';
    }
  }

  this.loadTaches();
  this.userService.getAll().subscribe(users => this.utilisateurs = users);
  }

  initTache(): Tache {
    return {
      titre: '',
      description: '',
      dateDebut: '',
      dureeEnHeures: 1,
      priorite: 'Moyenne',
      agentId: null,
      etat: 'A faire'
    };
  }
loadTaches(): void {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  let params: any = {};

  // Appliquer les filtres si présents
  if (this.filtres.agentId) params.agentId = this.filtres.agentId;
  if (this.filtres.priorite) params.priorite = this.filtres.priorite;
  if (this.filtres.dateDebutStart) params.start = new Date(this.filtres.dateDebutStart).toISOString();
  if (this.filtres.dateDebutEnd) params.end = new Date(this.filtres.dateDebutEnd).toISOString();

  // Si utilisateur normal, on ajoute le filtre "mes tâches"
  if (this.role !== 'ADMIN') {
    params.mesTaches = 'true';
  }
  this.http.get<Tache[]>('http://localhost:8083/taches/filtre', { params, headers }).subscribe({
    next: (data) => {
      this.taches = data;
    },
    error: (err) => {
      console.error('Erreur lors du chargement des tâches :', err);
      this.snackBar.open('❌ Erreur de chargement.', 'Fermer', {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    }
  });
}
appliquerFiltres(): void {
  this.loadTaches();
}

reinitialiserFiltres(): void {
  this.filtres = {
    agentId: '',
    priorite: '',
    dateDebutStart: '',
    dateDebutEnd: ''
  };
  this.loadTaches();
}
getNomAgent(agentId: number | null): string {
  if (agentId === null) {
    return 'Non assigné';
  }
  const agent = this.utilisateurs.find(user => user.id === agentId);
  return agent ? `${agent.prenom} ${agent.nom}` : 'Inconnu';
}

  openModal(tache?: Tache): void {
    this.isEdit = !!tache;
    this.selectedTache = tache ? { ...tache } : this.initTache();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedTache = this.initTache();
  }

saveTache(): void {
  const tacheToSend = {
    ...this.selectedTache,
    dateDebut: new Date(this.selectedTache.dateDebut).toISOString()
  };

  const request = this.isEdit
    ? this.taskService.updateTache(tacheToSend)
    : this.taskService.ajouterTache(tacheToSend);

  request.subscribe({
    next: () => {
      const message = this.isEdit
        ? 'Tâche modifiée avec succès.'
        : 'Tâche créée avec succès.';

      this.snackBar.open(message, 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });

      this.loadTaches();
      this.closeModal();
    },
    error: (err) => {
      console.error('Erreur lors de la sauvegarde :', err);
      let errorMessage = 'Erreur inconnue';
      if (err.error?.message) {
        errorMessage = err.error.message;
      } else if (err.status === 401) {
        errorMessage = 'Non autorisé. Token invalide.';
      } else if (err.status === 400) {
        errorMessage = 'Données invalides. Vérifiez les champs.';
      }

      this.snackBar.open(`❌ ${errorMessage}`, 'Fermer', {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    }
  });
}

    updateTache(tache: Tache) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  const tacheAvecDateISO = {
    ...tache,
    dateDebut: new Date(tache.dateDebut).toISOString()
  };

  console.log('Envoi de modification :', tacheAvecDateISO);

  this.http.put(`http://localhost:8083/taches/${tacheAvecDateISO.id}`, tacheAvecDateISO, { headers }).subscribe({
    next: () => {
      console.log('Tâche modifiée avec succès.');
      this.loadTaches();
      this.closeModal();
    },
    error: err => {
      console.error('Erreur modification tâche :', err);
    }
  });
}

deleteTache(id: number) {

    const confirmation = window.confirm('🗑️ Voulez-vous vraiment supprimer cette tâche ?');
  if (!confirmation) {
    console.log('Suppression annulée par l’utilisateur.');
    return;
  }
  
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.delete(`http://localhost:8083/taches/${id}`, { headers }).subscribe({
    next: () => {
      console.log('Tâche supprimée.');
      this.loadTaches();
    },
    error: err => {
      console.error('Erreur suppression tâche :', err);
    }
  });
}
navigatetouser(){
  this.router.navigate(['/compte'])
}
navigatetotache(){
  this.router.navigate(['/tache'])
}
navigatetocalendar(){
  this.router.navigate(['/calendrier'])}

  deconnexion() {
  localStorage.removeItem('token');
  this.router.navigate(['/login']).then(() => {
    window.location.reload(); 
  });
}
sidebarVisible: boolean = true;
toggleSidebar(): void {
  this.sidebarVisible = !this.sidebarVisible;
}
telechargerCSV(): void {
  const headers = ['Titre', 'Description', 'Date de début', 'Durée (h)', 'Priorité', 'Agent', 'État'];
  
  const rows = this.taches.map(t => [
    this.escapeCSV(t.titre),
    this.escapeCSV(t.description || ''),
    this.escapeCSV(new Date(t.dateDebut).toLocaleString('fr-FR')),
    this.escapeCSV(t.dureeEnHeures.toString()),
    this.escapeCSV(t.priorite),
    this.escapeCSV(this.getNomAgent(t.agentId)),
    this.escapeCSV(t.etat)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `taches_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

private escapeCSV(value: string): string {
  if (value == null) return '';
  const str = value.toString();
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}


}
