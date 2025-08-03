import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Tache, TaskService } from '../task.service';
import { FormsModule } from '@angular/forms';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { Compte, UserService } from '../user.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DetailsTacheDialogComponent } from '../details-tache-dialog/details-tache-dialog.component';
import { catchError, EMPTY, Observable, tap } from 'rxjs';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';

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
    dateDebutEnd: ''
  };


  users: Compte[] = [];

calendarOptions: CalendarOptions = {
  plugins: [resourceTimeGridPlugin, dayGridPlugin, interactionPlugin],
  initialView: 'resourceTimeGridTwoWeek',
  editable: true, 
  droppable: true,
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
  eventDrop: this.onEventDrop.bind(this) 
};
@ViewChild('calendarScroll') calendarScroll!: ElementRef;

scrollCalendar(direction: 'left' | 'right') {
  const el = this.calendarScroll.nativeElement;
  el.scrollLeft += direction === 'left' ? -200 : 200;
}



  constructor(
    private taskService: TaskService,
    private dialog: MatDialog,
    private router: Router,
    private http: HttpClient,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.chargerTaches();
    this.loadUsers();
    this.refreshCalendar();
  }
  reinitialiserFiltres(): void {
  this.filtres = {
    agentId: '',
    priorite: '',
    dateDebutStart: '',
    dateDebutEnd: ''
  };
  this.chargerTaches().subscribe(() => this.refreshCalendar());
}

  onEventClick(info: any): void {
    const tache: Tache = {
      id: info.event.extendedProps.id,
      titre: info.event.title,
      description: info.event.extendedProps.description,
      dateDebut: info.event.start,
      dureeEnHeures: this.getDurationInHours(info.event.start, info.event.end),
      priorite: info.event.extendedProps.priorite,
      agentId: info.event.extendedProps.agentId
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
      .filter(agent => agent.id !== undefined && agent.role === 'USER') // <-- filtre rôle
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

  deconnexion() {
  localStorage.removeItem('token');
  this.router.navigate(['/login']).then(() => {
    window.location.reload(); 
  });
}
 
}
