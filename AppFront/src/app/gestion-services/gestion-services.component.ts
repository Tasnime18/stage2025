import { Component, Injectable, OnInit } from '@angular/core';
import { Service } from '../model/service.model';
import { ServiceService } from '../service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const token = localStorage.getItem('token');

    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });
      return next.handle(cloned);
    }

    return next.handle(req);
  }
}

@Component({
  selector: 'app-gestion-services',
  imports: [CommonModule,FormsModule],
  templateUrl: './gestion-services.component.html',
  styleUrl: './gestion-services.component.css'
})


export class ServicesComponent implements OnInit {
  services: Service[] = [];
  service: Service = { nomService: '' };
  editing = false;
  loading = false;
  message = '';
  searchTerm = '';
  sidebarVisible = true;
  modalOpen = false;

  constructor(private serviceService: ServiceService, private router: Router) { }

  ngOnInit(): void {
    this.loadServices();
  }
  toggleSidebar() {
  this.sidebarVisible = !this.sidebarVisible;
}

  loadServices(): void {
    this.loading = true;
    this.serviceService.getAll().subscribe({
      next: (data) => {
        this.services = data;
        this.loading = false;
      },
      error: (err) => {
        this.showMessage('Erreur lors du chargement des services.', 'error');
        this.loading = false;
      }
    });
  }

  save(): void {
    if (!this.service.nomService.trim()) {
      this.showMessage('Le nom du service est obligatoire.', 'error');
      return;
    }

    if (this.editing) {
      this.serviceService.update(this.service.id!, this.service).subscribe({
        next: (updated) => {
          this.resetForm();
          this.loadServices();
          this.showMessage(`Service "${updated.nomService}" mis à jour.`, 'success');
        },
        error: () => this.showMessage('Échec de la mise à jour.', 'error')
      });
    } else {
      this.serviceService.create(this.service).subscribe({
        next: (created) => {
          this.resetForm();
          this.loadServices();
          this.showMessage(`Service "${created.nomService}" ajouté.`, 'success');
        },
        error: () => this.showMessage('Échec de l\'ajout.', 'error')
      });
    }
  }

  edit(service: Service): void {
    this.service = { ...service };
    this.editing = true;
    window.scrollTo(0, 0);
  }

  delete(id: number, nom: string): void {
    if (confirm(`Voulez-vous vraiment supprimer le service "${nom}" ?`)) {
      this.serviceService.delete(id).subscribe({
        next: () => {
          this.loadServices();
          this.showMessage('Service supprimé.', 'success');
        },
        error: () => this.showMessage('Échec de la suppression.', 'error')
      });
    }
  }

  cancel(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.service = { nomService: '' };
    this.editing = false;
  }

  showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;
    setTimeout(() => this.message = '', 3000);
  }

  retour(){
    this.router.navigate(['/compte']);
  }
  get filteredServices() {
  return this.services.filter(s =>
    s.nomService.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}

// Ouvre la modal
openModal() {
  this.service = { nomService: '' };
  this.editing = false;
  this.modalOpen = true;
}
navigatetocalnder(){
  this.router.navigate(['/calendrier'])
}
navigatetouser(){
  this.router.navigate(['/compte'])
}
navigatetotache(){
  this.router.navigate(['/tache'])
}
}

