import { Component, OnInit } from '@angular/core';
import { Tache, TaskService } from '../task.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Compte, UserService } from '../user.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Service } from '../model/service.model';
import { ServiceService } from '../service.service';

@Component({
  selector: 'app-tache',
  imports: [CommonModule, FormsModule, MatSnackBarModule],
  templateUrl: './tache.component.html',
  styleUrl: './tache.component.css'
})
export class TacheComponent implements OnInit {
  taches: Tache[] = [];
  utilisateurs: Compte[] = [];
  services: Service[] = [];

  filtres = {
    agentId: '',
    priorite: '',
    dateDebutStart: '',
    dateDebutEnd: '',
    serviceId: ''
  };

  userName: string = 'Chargement...';
  userPrenom: string = '';
  userNom: string = '';
  role: string | null = '';
  userId: number | null = null;

  showModal = false;
  isEdit = false;
  selectedTache: Tache = this.initTache();

  constructor(
    private taskService: TaskService,
    private userService: UserService,
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private serviceService: ServiceService
  ) {}

  ngOnInit(): void {
    this.loadServices();


    this.role = this.userService.getUserRole();
    this.userId = this.userService.getUserId();

    // Décoder token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.userPrenom = payload.prenom || 'Utilisateur';
        this.userNom = payload.nom || '';
        this.userName = `${this.userPrenom} ${this.userNom}`.trim();
      } catch (e) {
        console.error('Erreur lecture token:', e);
        this.userName = 'Profil';
      }
    }
    this.loadUsers();
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

  loadUsers(): void {
    this.userService.getAll().subscribe({
      next: (users) => {
        this.utilisateurs = users.filter(u => u.role === 'USER'); 
        this.loadTaches();
      },
      error: (err) => {
        console.error('Erreur chargement utilisateurs', err);
        this.snackBar.open('Impossible de charger les agents.', 'Fermer', {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
        this.loadTaches();
      }
    });
  }

  loadTaches(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    let params: any = {};

    if (this.filtres.agentId) params.agentId = +this.filtres.agentId;
    if (this.filtres.priorite) params.priorite = this.filtres.priorite;
    if (this.filtres.dateDebutStart) params.start = new Date(this.filtres.dateDebutStart).toISOString();
    if (this.filtres.dateDebutEnd) params.end = new Date(this.filtres.dateDebutEnd).toISOString();

    if (this.role !== 'ADMIN') {
      params.mesTaches = 'true';
    }

    this.http.get<Tache[]>('http://localhost:8083/taches/filtre', { params, headers }).subscribe({
      next: (data) => {
        this.taches = data;
      },
      error: (err) => {
        console.error('Erreur chargement tâches', err);
        this.snackBar.open('Erreur de chargement des tâches.', 'Fermer', {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }
  loadServices() {
  this.serviceService.getAll().subscribe({
    next: (data) => {
      this.services = data;
    },
    error: (err) => {
      console.error('Erreur lors du chargement des services', err);
    }
  });
}

appliquerFiltres() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  let params: any = {};

  if (this.filtres.agentId) params.agentId = +this.filtres.agentId;
  if (this.filtres.priorite) params.priorite = this.filtres.priorite;
  if (this.filtres.dateDebutStart) params.start = new Date(this.filtres.dateDebutStart).toISOString();
  if (this.filtres.dateDebutEnd) params.end = new Date(this.filtres.dateDebutEnd).toISOString();
  if (this.filtres.serviceId) params.serviceId = +this.filtres.serviceId; // ✅ Toujours envoyer

  if (this.role !== 'ADMIN') {
    params.mesTaches = 'true';
  }

  this.http.get<Tache[]>('http://localhost:8083/taches/filtre', { params, headers }).subscribe({
    next: (data) => {
      this.taches = data;
    },
    error: (err) => {
      console.error('Erreur filtrage', err);
    }
  });
}

  reinitialiserFiltres(): void {
    this.filtres = {
      agentId: '',
      priorite: '',
      dateDebutStart: '',
      dateDebutEnd: '',
      serviceId: ''
    };
    this.loadTaches();
  }

  getNomAgent(agentId: number | null): string {
    if (agentId === null) return 'Non assigné';
    const agent = this.utilisateurs.find(u => u.id === agentId);
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
        this.snackBar.open(
          this.isEdit ? 'Tâche modifiée.' : 'Tâche créée.',
          'Fermer',
          { duration: 3000, verticalPosition: 'top', panelClass: ['snackbar-success'] }
        );
        this.loadTaches();
        this.closeModal();
      },
      error: (err) => {
        let message = 'Données invalides.';
        if (err.status === 401) message = 'Non autorisé.';
        else if (err.status === 403) message = 'Accès refusé.';

        this.snackBar.open(` ${message}`, 'Fermer', {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  deleteTache(id: number): void {
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.delete(`http://localhost:8083/taches/${id}`, { headers }).subscribe({
      next: () => {
        this.snackBar.open('Tâche supprimée.', 'Fermer', {
          duration: 3000,
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.loadTaches();
      },
      error: (err) => {
        console.error('Erreur suppression tâche:', err);
        this.snackBar.open(' Échec de la suppression.', 'Fermer', {
          duration: 5000,
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  // --- Navigation ---
  navigatetouser(): void { this.router.navigate(['/compte']); }
  navigatetotache(): void { this.router.navigate(['/tache']); }
  navigatetocalendar(): void { this.router.navigate(['/calendrier']); }

  deconnexion(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  sidebarVisible: boolean = true;
  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  // --- Export CSV ---
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

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
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

  //service
  loadTachesByService(serviceId: number): void {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.get<Tache[]>('http://localhost:8083/taches/par-service', {
    params: { serviceId },
    headers
  }).subscribe({
    next: (data) => {
      this.taches = data;
      this.snackBar.open(` ${data.length} tâche(s) chargée(s).`, 'Fermer', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['snackbar-success']
      });
    },
    error: (err) => {
      console.error('Erreur chargement par service', err);
      this.snackBar.open(' Erreur lors du chargement.', 'Fermer', {
        duration: 5000,
        verticalPosition: 'top',
        panelClass: ['snackbar-error']
      });
    }
  });
}
  private computeEndDate(start: string, dureeHeures: number): string {
    const date = new Date(start);
    date.setHours(date.getHours() + dureeHeures);
    return date.toISOString();
  }

chargerTachesParService() {
  this.filtres.serviceId = this.filtres.serviceId; 
  this.appliquerFiltres();
}
mettreAJourEvenements(taches: Tache[]) {
  const events = taches.map(tache => ({
    id: tache.id?.toString(),
    title: tache.titre,
    start: tache.dateDebut,
    end: this.computeEndDate(tache.dateDebut, tache.dureeEnHeures),
    resourceId: tache.agentId?.toString(),
    extendedProps: {
      id: tache.id,
      description: tache.description,
      priorite: tache.priorite,
      agentId: tache.agentId,
      etat: tache.etat,
      codeColor: tache.codeColor,
      cadre: tache.cadre,
      conteneur: tache.conteneur
    },
    classNames: [] as string[]
  }));
}
}