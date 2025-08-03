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
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

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
    plugins: [resourceTimeGridPlugin, dayGridPlugin, interactionPlugin],
    initialView: 'resourceTimeGridTwoWeek',
    slotMinWidth: 120,
    contentHeight: "auto",
    editable: true,
    eventDrop: this.onEventDrop.bind(this),
    resources: [],
    views: {
      resourceTimeGridTwoWeek: {
        type: 'resourceTimeGrid',
        duration: { days: 14 },
        buttonText: '2 semaines'
      }
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'multiWeek,dayGridMonth'
    },
    resourceAreaHeaderContent: 'Agents',
    events: [],
    eventClick: this.onEventClick.bind(this),
    customButtons: {
  boutonDeuxSemaines: {
    text: '2 semaines',
    click: () => {
      this.calendarOptions.initialView = 'resourceTimeGridTwoWeek';
      this.calendarOptions = { ...this.calendarOptions }; 
    }
  },
  boutonMois: {
    text: 'Mois',
    click: () => {
      this.calendarOptions.initialView = 'dayGridMonth';
      this.calendarOptions = { ...this.calendarOptions };
    }
  }
},  
  };
  @ViewChild('calendarScroll') calendarScroll!: ElementRef;

scrollCalendar(direction: 'left' | 'right') {
  const el = this.calendarScroll.nativeElement;
  el.scrollLeft += direction === 'left' ? -200 : 200;
}


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
        agentId: task.agentId
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
              agentId: task.agentId
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
      agentId: info.event.extendedProps.agentId
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
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

  let params: any = {};

  if (this.filtres.agentId) params.agentId = this.filtres.agentId;
  if (this.filtres.priorite) params.priorite = this.filtres.priorite;
  if (this.filtres.dateDebutStart) 
    params.start = new Date(this.filtres.dateDebutStart).toISOString();

  if (this.filtres.dateDebutEnd) 
     params.end = new Date(this.filtres.dateDebutEnd).toISOString();


this.http.get<Tache[]>('http://localhost:8083/taches/filtre', { params, headers }).subscribe({
    next: (data) => {
      this.taches = data;
      this.calendarOptions.events = data.map(task => ({
        title: task.titre,
        start: task.dateDebut,
        end: this.computeEndDate(task.dateDebut, task.dureeEnHeures),
        resourceId: task.agentId?.toString(),  // <--- IMPORTANT
        extendedProps: {
          id: task.id,
          description: task.description,
          priorite: task.priorite,
          agentId: task.agentId
        }
      }));
    },
    error: (err) => {
      console.error('Erreur lors du filtrage des tâches :', err);
      alert("Erreur d'authentification : vérifiez votre session.");
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
    agentId: event.extendedProps.agentId
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


  deconnexion() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']).then(() => {
      window.location.reload();
    });
  }
}
