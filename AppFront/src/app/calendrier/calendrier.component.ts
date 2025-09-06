import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import { Tache, TaskService } from '../task.service';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Compte, UserService } from '../user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetailsTacheDialogComponent } from '../details-tache-dialog/details-tache-dialog.component';
import { catchError, EMPTY, Observable, tap } from 'rxjs';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import { Service } from '../model/service.model';
import { ServiceService } from '../service.service';


interface EventInputWithClassNames extends EventInput {
  classNames?: string[];
}



@Component({
  selector: 'app-calendrier',
  standalone: true,
  imports: [FullCalendarModule,CommonModule, FormsModule,MatDialogModule],
  templateUrl: './calendrier.component.html',
  styleUrls: ['./calendrier.component.css']
})
export class CalendrierComponent implements OnInit {
  modalOuvert = false;
  taches: Tache[] = [];
  services: Service[] = [];

  nouvelleTache = {
    titre: '',
    description: '',
    dateDebut: '',
    dureeEnHeures: 0,
    priorite: '',
    agentId: null
  };
  filtres: any = {
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

users: Compte[] = [];

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
  const tache = info.event.extendedProps as Tache;

  const color = tache.codeColor || '#6366f1';
  const isCadre = tache.cadre === true;
  const isConteneur = tache.conteneur === true;

  const textColor = isConteneur ? 'white' : '#1f2937';
  const backgroundColor = isConteneur ? color : '#f3f4f6';
  const borderColor = isCadre ? '#ef4444' : color; 
  const border = isCadre ? '3px solid' : '1px solid';

  const opacity = info.isPast ? '0.7' : '1';

  return {
    html: `
      <div style="
        background-color: ${backgroundColor};
        color: ${textColor};
        border: ${border};
        border-color: ${borderColor};
        border-radius: 8px;
        padding: 6px 10px;
        font-size: 0.85em;
        font-weight: 600;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: all 0.2s ease;
        opacity: ${opacity};
        box-sizing: border-box;
        min-height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${info.timeText ? `<span style="font-size:0.7em; opacity:0.9;">${info.timeText}</span><br/>` : ''}
        <span>${info.event.title}</span>
      </div>
    `
  };
},

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
            margin-bottom: 4px;
          ">
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
    private taskService: TaskService,
    private dialog: MatDialog,
    private router: Router,
    private http: HttpClient,
    private userService: UserService,
    private serviceService: ServiceService
  ) {}

  ngOnInit(): void {
    this.chargerTaches();
    this.loadUsers();
    this.loadServices();
    this.refreshCalendar();

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
    dateDebutEnd: '',
    serviceId: ''
  };
  this.chargerTaches().subscribe(() => this.refreshCalendar());
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

  onEventClick(info: any): void {
    const tache: Tache = {
      id: info.event.extendedProps.id,
      titre: info.event.title,
      description: info.event.extendedProps.description,
      dateDebut: info.event.start,
      dureeEnHeures: this.getDurationInHours(info.event.start, info.event.end),
      priorite: info.event.extendedProps.priorite,
      agentId: info.event.extendedProps.agentId,
      etat: info.event.extendedProps.etat 
    };

    this.openDetails(tache);
  }

  getDurationInHours(start: Date, end: Date): number {
    const duration = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
    return Math.round(duration);
  }

  private computeEndDate(start: string, dureeHeures: number): string {
    const date = new Date(start);
    date.setHours(date.getHours() + dureeHeures);
    return date.toISOString();
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

    this.http.post('http://localhost:8083/taches', body, { headers })
      .subscribe({
        next: () => {
          alert('Tâche ajoutée avec succès !');
          this.fermerModal();
          this.refreshCalendar();
        },
        error: err => console.error('Erreur ajout tâche:', err)
      });
  }

  openDetails(tache: Tache) {
    const dialogRef = this.dialog.open(DetailsTacheDialogComponent, {
      width: '400px',
      data: {
    tache,
    users: this.users 
  }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Résultat de la boîte de dialogue :', result); 
      if (!result) return;

      if (result.action === 'save') {
        this.updateTache(result.tache);
      } else if (result.action === 'delete') {
        this.deleteTache(result.tache.id);
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
      this.chargerTaches().subscribe(() => {
        this.refreshCalendar();
      });
    },
    error: err => {
      console.error('Erreur modification tâche :', err);
    }
  });
}

deleteTache(id: number) {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.delete(`http://localhost:8083/taches/${id}`, { headers }).subscribe({
    next: () => {
      console.log('Tâche supprimée.');
      this.chargerTaches().subscribe(() => {
        this.refreshCalendar();
      });
    },
    error: err => {
      console.error('Erreur suppression tâche :', err);
    }
  });
}

chargerTaches(): Observable<Tache[]> {
  return this.taskService.getTaches().pipe(
    tap(data => this.taches = data),
    catchError(err => {
      console.error('Erreur chargement tâches :', err);
      return EMPTY;
    })
  );
}
appliquerFiltres() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  let params: any = {};
  if (this.filtres.serviceId) params.serviceId = +this.filtres.serviceId;
  if (this.filtres.agentId) params.agentId = this.filtres.agentId;
  if (this.filtres.priorite) params.priorite = this.filtres.priorite;
  if (this.filtres.dateDebutStart) params.start = new Date(this.filtres.dateDebutStart).toISOString();
  if (this.filtres.dateDebutEnd) params.end = new Date(this.filtres.dateDebutEnd).toISOString();

  this.http.get<Tache[]>('http://localhost:8083/taches/filtre', { params, headers }).subscribe({
    next: (data) => {
      this.mettreAJourEvenements(data);
    },
    error: (err) => {
      console.error('Erreur lors du filtrage des tâches', err);
      if (err.status === 403) {
        alert("Vous n'avez pas le droit d'accéder à ces données.");
      } else {
        alert("Erreur lors du filtrage. Vérifiez les paramètres.");
      }
    }
  });
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

  this.calendarOptions.events = events;
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

refreshCalendar() {
  this.taskService.getTaches().subscribe({
    next: (taches: Tache[]) => {
      const events: EventInputWithClassNames[] = taches.map(tache => ({
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

      const conflicts = this.checkForConflicts(events);
      for (const resourceId in conflicts) {
        conflicts[resourceId].forEach(([eventA, eventB]) => {
          if (eventA.classNames && !eventA.classNames.includes('conflict')) {
            eventA.classNames.push('conflict');
          }
          if (eventB.classNames && !eventB.classNames.includes('conflict')) {
            eventB.classNames.push('conflict');
          }
        });
      }
      this.calendarOptions = {
        ...this.calendarOptions,
        events: events
      };
    },
    error: (err) => {
      console.error('Erreur lors du chargement des tâches', err);
    }
  });
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
onEventDrop(info: any) {
  const updatedTache: Tache = {
    id: info.event.extendedProps.id,
    titre: info.event.title,
    description: info.event.extendedProps.description,
    dateDebut: info.event.start,
    dureeEnHeures: this.getDurationInHours(info.event.start, info.event.end),
    priorite: info.event.extendedProps.priorite,
    etat: info.event.extendedProps.etat,
    agentId: info.event.getResources()[0]?.id ? parseInt(info.event.getResources()[0].id) : null
  };

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  const tacheAvecDateISO = {
    ...updatedTache,
    dateDebut: new Date(updatedTache.dateDebut).toISOString()
  };

  this.http.put(`http://localhost:8083/taches/${tacheAvecDateISO.id}`, tacheAvecDateISO, { headers }).subscribe({
    next: () => {
      console.log('Tâche déplacée avec succès.');
      this.refreshCalendar();
    },
    error: (err) => {
      if (err.status === 403) {
        alert("Vous n'avez pas le droit de déplacer cette tâche.");
      } else {
        alert("Une erreur est survenue lors du déplacement de la tâche.");
      }
      this.refreshCalendar(); 
    }
  });
}
navigatetouser(){
  this.router.navigate(['/compte'])
}
navigatetotache(){
  this.router.navigate(['/tache'])
}

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
exporterExcel() {
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  this.http.get('http://localhost:8083/export/taches.xlsx', {
    headers: headers,
    responseType: 'blob'
  }).subscribe({
    next: (data) => {
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'taches_' + new Date().toISOString().split('T')[0] + '.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      console.error('Erreur export Excel', err);
      alert('Erreur lors de l’export des tâches.');
    }
  });
}

chargerTachesParService() {
  const serviceId = +this.filtres.serviceId;

  if (!serviceId) {
    alert('Aucun service sélectionné.');
    return;
  }

  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  this.http.get<Tache[]>(`http://localhost:8083/taches/par-service`, {
    params: { serviceId },
    headers
  }).subscribe({
    next: (taches) => {
      this.mettreAJourEvenements(taches);
    },
    error: (err) => {
      console.error('Erreur lors du chargement des tâches du service', err);
      alert('Erreur lors du chargement des tâches de ce service.');
    }
  });
}
 
}