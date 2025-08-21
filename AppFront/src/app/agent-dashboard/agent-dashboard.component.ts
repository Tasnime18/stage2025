import { Component, ElementRef, ViewChild } from '@angular/core';
import { CalendarOptions, EventInput } from '@fullcalendar/core/index.js';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, EMPTY, tap } from 'rxjs';
import { DetailsTacheAgentDialogComponent } from '../details-tache-agent-dialog/details-tache-agent-dialog.component';
import { Router } from '@angular/router';
import { TaskService } from '../task.service';
import { Compte, UserService } from '../user.service';
import { Tache } from '../model/Tache';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';

interface EventInputWithClassNames extends EventInput {
  classNames?: string[];
}

@Component({
  selector: 'app-agent-dashboard',
  imports: [CommonModule, FormsModule, FullCalendarModule, MatDialogModule],
  templateUrl: './agent-dashboard.component.html',
  styleUrl: './agent-dashboard.component.css'
})
export class AgentDashboardComponent {
  afficherToutesTaches = true;
  userId: number | null = null;
  modalOuvert = false;
  taches: Tache[] = [];
  users: Compte[] = [];
  isFiltrageEnCours = false;

  userName: string = 'Chargement...';
  userPrenom: string = '';
  userNom: string = '';

  role: string | null = '';

  nouvelleTache = {
    titre: '',
    description: '',
    dateDebut: '',
    dureeEnHeures: 0,
    priorite: '',
    agentId: null
  };
    filtres: any = {
    priorite: '',
    dateDebutStart: '',
    dateDebutEnd: ''
  };
calendarOptions: CalendarOptions = {
  plugins: [resourceTimelinePlugin, interactionPlugin],
  initialView: 'resourceTimelineThreeWeek',
  editable: true,
  droppable: true,
  resources: [],
  views: {
    resourceTimelineThreeWeek: {
      type: 'resourceTimeline',
      duration: { days: 21 },
      slotLabelFormat: [
        {
          week: 'numeric',
          omitCommas: true
        }
      ],
      buttonText: '3 semaines'
    }
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'resourceTimelineThreeWeek,dayGridMonth'
  },
  resourceAreaHeaderContent: 'Agents',
  events: [],
  themeSystem: 'standard', 

  // Style des événements
eventContent: (info) => {
  const priorite = info.event.extendedProps['priorite'] as string;
  const couleur = this.getCouleurParPriorite(priorite);
  const textColor = 
    priorite === 'FAIBLE' ? '#065f46' : 
    priorite === 'MOYENNE' ? '#7c2d12' : 
    priorite === 'HAUTE' ? '#7f1d1d' : 
    '#4b5563';

  return {
    html: `
      <div style="
        background: ${couleur};
        color: ${textColor};
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 0.85em;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      ">
        ${info.timeText ? `<span style="font-size:0.7em; opacity:0.8;">${info.timeText}</span><br/>` : ''}
        <span>${info.event.title}</span>
      </div>
    `
  };
} ,

  slotLabelContent: (arg) => {
    const date = new Date(arg.date);
    const day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    const weekNumber = this.getWeekNumber(date);

    if (date.getDay() === 1) {
      return {
        html: `
          <div style="text-align:center; padding: 4px;">
            <div style="font-weight:600; color:#1f2937;">${day}</div>
            <div style="
              background:#e0e0e0; 
              color:#4b5563; 
              border-radius:4px; 
              padding:2px 6px; 
              font-size:0.75em; 
              font-weight:500; 
              margin-top:4px;
              display:inline-block;">
              Semaine ${weekNumber}
            </div>
          </div>
        `
      };
    }

    return { 
      html: `<div style="text-align:center; padding:4px; color:#4b5563; font-size:0.85em;">${day}</div>` 
    };
  },

  resourceAreaWidth: '150px',
  resourceLabelContent: (info) => {
    return {
      html: `
        <div style="
          font-weight:600; 
          color:#1f2937; 
          padding:8px; 
          border-bottom:1px solid #e5e7eb;">
          ${info.resource.title}
        </div>
      `
    };
  },
  eventClick: this.onEventClick.bind(this),
  eventDrop: this.onEventDrop.bind(this),

  dayHeaderFormat: { weekday: 'long' },
  height: 'auto',
  expandRows: true,
  nowIndicator: true
};

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private router: Router,
    private taskService: TaskService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.chargerTaches();
    this.decodeToken(); 
    this.refreshCalendar();
    this.loadUsers();

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
    }}

    
  }
    reinitialiserFiltres(): void {
  this.filtres = {
    agentId: '',
    priorite: '',
    dateDebutStart: '',
    dateDebutEnd: ''
  };
  this.chargerTaches();
}
  decodeToken(): void {
  const token = localStorage.getItem('token');
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.userId = payload.Id;
    console.log('Utilisateur connecté ID :', this.userId);
  }
}


loadUsers() {
  this.userService.getAll().subscribe(data => {
    this.users = data;

    this.calendarOptions.resources = this.users
      .filter(agent => agent.id !== undefined && agent.role === 'USER') 
      .map(agent => ({
        id: agent.id!.toString(),
        title: agent.nom
      }));
  });
}

  ajouterTache() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const body = {
      ...this.nouvelleTache,
      dateDebut: new Date(this.nouvelleTache.dateDebut).toISOString()
    };

    this.http.post('http://localhost:8083/taches', body, { headers }).subscribe({
      next: () => {
        alert('Tâche ajoutée avec succès !');
        this.fermerModal();
        this.refreshCalendar();
      },
      error: err => console.error('Erreur ajout tâche:', err)
    });
  }
refreshCalendar() {
  this.taskService.getTaches().subscribe((tasks: Tache[]) => {
    let events = tasks.map(task => ({
      id: task.id?.toString(),
      title: task.titre,
      start: task.dateDebut,
      end: this.computeEndDate(task.dateDebut, task.dureeEnHeures),
      resourceId: task.agentId?.toString(),
      extendedProps: {
        id: task.id,
        description: task.description,
        priorite: task.priorite,
        agentId: task.agentId,
        etat: task.etat
      },
      classNames: [] as string[] 
    }));


    const conflicts = this.checkForConflicts(events);
    console.log('Conflits détectés :', conflicts);
    for (const resourceId in conflicts) {
      conflicts[resourceId].forEach(([eventA, eventB]) => {
        eventA.classNames = eventA.classNames || [];
        eventB.classNames = eventB.classNames || [];
        if (!eventA.classNames.includes('conflict')) eventA.classNames.push('conflict');
        if (!eventB.classNames.includes('conflict')) eventB.classNames.push('conflict');
      });
    }
    this.calendarOptions = {
      ...this.calendarOptions,
      events: events
    };
  });
}
getCouleurParPriorite(priorite: string): string {
  switch (priorite?.trim().toUpperCase()) {
    case 'HAUTE':   return '#FFCCED';
    case 'MOYENNE': return '#F9FFA6'; 
    case 'FAIBLE':  return '#a7f3d0'; 
    default:        return '#A6DDFF'; 
  }
}
getWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return weekNumber;
}


  ouvrirModal() {
    this.modalOuvert = true;
  }

  fermerModal() {
    this.modalOuvert = false;
    this.nouvelleTache = {
      titre: '',
      description: '',
      dateDebut: '',
      dureeEnHeures: 0,
      priorite: '',
      agentId: null
    };
  }

  toggleAfficher(): void {
    this.afficherToutesTaches = !this.afficherToutesTaches;
    this.chargerTaches();
  }

  chargerTaches(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const url = this.afficherToutesTaches
      ? 'http://localhost:8083/taches'
      : 'http://localhost:8083/taches/mes-taches';

    this.http.get<Tache[]>(url, { headers })
      .pipe(
        tap(data => {
          this.taches = data;
          this.calendarOptions.events = data.map(task => ({
            title: task.titre,
            start: task.dateDebut,
            end: this.computeEndDate(task.dateDebut, task.dureeEnHeures),
            resourceId: task.agentId?.toString(),
            extendedProps: {
              id: task.id,
              description: task.description,
              priorite: task.priorite,
              agentId: task.agentId,
              etat: task.etat
            }
          }));
        }),
        catchError(err => {
          console.error('Erreur chargement tâches :', err);
          return EMPTY;
        })
      )
      .subscribe();
  }

  computeEndDate(start: string, dureeHeures: number): string {
    const date = new Date(start);
    date.setHours(date.getHours() + dureeHeures);
    return date.toISOString();
  }

  onEventClick(info: any): void {
    const tache: Tache = {
      id: info.event.extendedProps.id,
      titre: info.event.title,
      description: info.event.extendedProps.description,
      dateDebut: info.event.start.toISOString(),
      dureeEnHeures:
        (new Date(info.event.end).getTime() -
          new Date(info.event.start).getTime()) /
        (1000 * 60 * 60),
      priorite: info.event.extendedProps.priorite,
      agentId: info.event.extendedProps.agentId,
      etat: info.event.extendedProps.etat
    };

    this.openDetails(tache);
  }

openDetails(tache: Tache): void {

  const dialogRef = this.dialog.open(DetailsTacheAgentDialogComponent, {
    width: '400px',
    data: { 
      tache,
      estProprietaire: tache.agentId === this.userId 
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (!result) return;

    if (result.action === 'save') {
      this.updateTache(result.tache);
    } else if (result.action === 'delete') {
      this.deleteTache(result.tache.id);
    }
  });
}

updateTache(tache: Tache): void {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.put(`http://localhost:8083/taches/${tache.id}`, tache, { headers }).subscribe({
    next: () => this.chargerTaches(),
    error: err => {
      if (err.status === 403) {
        alert("Vous n'avez pas le droit de modifier cette tâche.");
      } else {
        console.error('Erreur modification tâche :', err);
      }
    }
  });
}

deleteTache(id: number): void {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.delete(`http://localhost:8083/taches/${id}`, { headers }).subscribe({
    next: () => {
      this.chargerTaches();   
      this.refreshCalendar(); 
    },
    error: err => console.error('Erreur suppression tâche :', err)
  });
}
//filtre
appliquerFiltres() {
  this.isFiltrageEnCours = true;
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  let params: any = {};

  // 🔧 Correction : s'assurer que les valeurs sont bien transmises
  if (this.filtres.agentId) params.agentId = this.filtres.agentId;
  if (this.filtres.priorite) params.priorite = this.filtres.priorite.toUpperCase(); // 🔴 HAUTE, MOYENNE, FAIBLE
  if (this.filtres.dateDebutStart) 
    params.start = new Date(this.filtres.dateDebutStart).toISOString();
  if (this.filtres.dateDebutEnd) 
    params.end = new Date(this.filtres.dateDebutEnd).toISOString();

  // Si on est en mode "mes tâches", on ajoute un filtre implicite
  if (!this.afficherToutesTaches && this.userId) {
    params.agentId = this.userId; // Force le filtre sur l'utilisateur connecté
  }

  this.http.get<Tache[]>('http://localhost:8083/taches/filtre', { params, headers }).subscribe({
    next: (data) => {
      this.taches = data;
      this.calendarOptions.events = data.map(task => ({
        title: task.titre,
        start: task.dateDebut,
        end: this.computeEndDate(task.dateDebut, task.dureeEnHeures),
        resourceId: task.agentId?.toString(),
        extendedProps: {
          id: task.id,
          description: task.description,
          priorite: task.priorite,
          agentId: task.agentId,
          etat: task.etat
        }
      }));
    },
    error: (err) => {
      console.error('Erreur lors du filtrage des tâches :', err);
      alert("Erreur d'authentification ou paramètres invalides.");
    }
  });
}
//drag and drop
onEventDrop(info: any): void {
  const event = info.event;

  const tache: Tache = {
    id: event.extendedProps.id,
    titre: event.title,
    description: event.extendedProps.description,
    dateDebut: event.start.toISOString(),
    dureeEnHeures:
      (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60 * 60),
    priorite: event.extendedProps.priorite,
    agentId: event.extendedProps.agentId,
    etat: event.extendedProps.etat
  };
  if (tache.agentId !== this.userId) {
    alert("Vous ne pouvez déplacer que vos propres tâches.");
    info.revert();
    return;
  }
  this.updateTache(tache);
}

//surcharge 
checkForConflicts(events: EventInputWithClassNames[]) {
  const conflicts: { [resourceId: string]: EventInputWithClassNames[][] } = {};

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      if (a.resourceId && b.resourceId && a.resourceId === b.resourceId) {
        if (!a.start || !a.end || !b.start || !b.end) continue;

        const startA = new Date(a.start as string | Date).getTime();
        const endA = new Date(a.end as string | Date).getTime();
        const startB = new Date(b.start as string | Date).getTime();
        const endB = new Date(b.end as string | Date).getTime();

        if (startA < endB && startB < endA) {
          if (!conflicts[a.resourceId]) {
            conflicts[a.resourceId] = [];
          }
          conflicts[a.resourceId].push([a, b]);
        }
      }
    }
  }

  return conflicts;
}
navigatetotache(){
  this.router.navigate(['/tacheAgent'])
}
sidebarVisible: boolean = true;
toggleSidebar(): void {
  this.sidebarVisible = !this.sidebarVisible;
}
  deconnexion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}
