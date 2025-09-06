import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Compte, UserService } from '../user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Service } from '../model/service.model';
import { ServiceService } from '../service.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-user',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit {
  users: Compte[] = [];
  services: Service[] = [];
  form: FormGroup;
  searchTerm: string = '';
  selectedServiceFilter: number | '' = '';
  modalOpen = false;
  selectedUserId: number | null = null;
  userName: string = 'Chargement...';
  userPrenom: string = '';
  userNom: string = '';
  role: string | null = '';
  userId: number | null = null;
  isChargement = false;
  sidebarVisible: boolean = true;

  constructor(
    private userService: UserService,
    private serviceService: ServiceService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      nom: [''],
      prenom: [''],
      mail: [''],
      motdepasse: [''],
      role: ['USER'],
      serviceId: ['']
    });
  }

  ngOnInit(): void {

      const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📄 Payload JWT:', payload); // 🔍 Vérifie ici
      this.userPrenom = payload.prenom || 'Utilisateur';
      this.userNom = payload.nom || '';
      this.role = payload.role;
      this.userId = payload.Id; // ⚠️ Attention à la casse !
    } catch (e) {
      console.error('❌ Erreur lecture token:', e);
    }
  }
    this.isChargement = true;

    combineLatest([this.userService.getAll(), this.serviceService.getAll()])
      .subscribe({
        next: ([users, services]) => {
          this.services = services;
          this.users = users.map(user => ({
            ...user,
            nomService: services.find(s => s.id === user.serviceId)?.nomService || '-'
          }));
          this.isChargement = false;
        },
        error: () => {
          this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 5000 });
          this.isChargement = false;
        }
      });

    this.role = this.userService.getUserRole();
    this.userId = this.userService.getUserId();
  }

  get filteredUsers() {
    return this.users.filter(user => {
      const matchesSearch = user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            user.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                            user.mail.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesService = this.selectedServiceFilter === '' || user.serviceId === this.selectedServiceFilter;
      return matchesSearch && matchesService;
    });
  }
    getServiceName(serviceId?: number): string {
    const service = this.services.find(s => s.id === serviceId);
    return service ? service.nomService : '-';
  }

  openModal() {
    this.form.reset({ role: 'USER', serviceId: '' });
    this.selectedUserId = null;
    this.modalOpen = true;
  }

  edit(user: Compte) {
    this.form.patchValue({ ...user, motdepasse: '' });
    this.selectedUserId = user.id!;
    this.modalOpen = true;
  }

  submit() {
    const userData = this.form.value;

    const refreshUsers = () => {
      combineLatest([this.userService.getAll(), this.serviceService.getAll()])
        .subscribe({
          next: ([users, services]) => {
            this.services = services;
            this.users = users.map(user => ({
              ...user,
              nomService: services.find(s => s.id === user.serviceId)?.nomService || '-'
            }));
          },
          error: () => this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 5000 })
        });
    };

    if (this.selectedUserId) {
      this.userService.update(this.selectedUserId, userData).subscribe({
        next: () => {
          this.modalOpen = false;
          refreshUsers();
          this.snackBar.open('Utilisateur modifié', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          console.error('Erreur modification:', err);
          this.snackBar.open('Échec modification', 'Fermer', { duration: 5000 });
        }
      });
    } else {
      this.userService.add(userData).subscribe({
        next: () => {
          this.modalOpen = false;
          refreshUsers();
          this.snackBar.open('Utilisateur ajouté', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          console.error('Erreur ajout:', err);
          this.snackBar.open('Échec ajout', 'Fermer', { duration: 5000 });
        }
      });
    }
  }

  delete(id: number) {
    if (confirm('Supprimer ce compte ?')) {
      this.userService.delete(id).subscribe(() => this.refreshUsers());
    }
  }

  activer(id: number) {
    this.userService.activer(id).subscribe(() => this.refreshUsers());
  }

  desactiver(id: number) {
    this.userService.desactiver(id).subscribe(() => this.refreshUsers());
  }

  refreshUsers() {
    combineLatest([this.userService.getAll(), this.serviceService.getAll()])
      .subscribe({
        next: ([users, services]) => {
          this.services = services;
          this.users = users.map(user => ({
            ...user,
            nomService: services.find(s => s.id === user.serviceId)?.nomService || '-'
          }));
        },
        error: () => this.snackBar.open('Erreur de chargement', 'Fermer', { duration: 5000 })
      });
  }

  navigatetocalnder() { this.router.navigate(['/calendrier']); }
  navigatetouser() { this.router.navigate(['/compte']); }
  navigatetotache() { this.router.navigate(['/tache']); }
  navigatetoservice() { this.router.navigate(['/services']); }

  toggleSidebar(): void { this.sidebarVisible = !this.sidebarVisible; }

  telechargerCSV(): void {
    const headers = ['Nom', 'Prénom', 'Email', 'Rôle', 'Statut', 'Service'];
    const rows = this.filteredUsers.map(user => [
      this.escapeCSV(user.nom),
      this.escapeCSV(user.prenom),
      this.escapeCSV(user.mail),
      this.escapeCSV(user.role),
      user.actif ? 'Actif' : 'Inactif',
      this.escapeCSV(user.nomService || '-')
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    const str = value.toString();
    return str.includes(',') || str.includes('\n') || str.includes('"')
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  }
}
