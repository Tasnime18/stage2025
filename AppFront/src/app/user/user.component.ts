import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Compte, UserService } from '../user.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit{
  users: Compte[] = [];
  form: FormGroup;
  searchTerm: string = '';
  modalOpen = false;
  selectedUserId: number | null = null;

  constructor(private userService: UserService, private fb: FormBuilder, private router:Router,private snackBar: MatSnackBar) {
    this.form = this.fb.group({
      nom: [''],
      prenom: [''],
      mail: [''],
      motdepasse: [''],
      role: ['USER']
    });
  }
userName: string = 'Chargement...';
userPrenom: string = '';
userNom: string = '';
role: string | null = '';
userId: number | null = null;
isChargement = false;

  ngOnInit(): void {
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



loadUsers() {
  this.isChargement = true;
  this.userService.getAll().subscribe({
    next: (data) => {
      this.users = data;
      this.isChargement = false;
    },
    error: (err) => {
      this.isChargement = false;
      this.snackBar.open('❌ Échec chargement', 'Fermer', { duration: 5000 });
    }
  });
}

  get filteredUsers() {
  return this.users.filter(user =>
    user.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    user.prenom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
    user.mail.toLowerCase().includes(this.searchTerm.toLowerCase())
  );
}

  openModal() {
    this.form.reset({ role: 'USER' });
    this.selectedUserId = null;
    this.modalOpen = true;
  }

  edit(user: Compte) {
    this.form.patchValue({ ...user, motdepasse: '' });
    this.selectedUserId = user.id!;
    this.modalOpen = true;
  }

submit() {
  const user = this.form.value;
  
  if (this.selectedUserId) {
    // Modification
    this.userService.update(this.selectedUserId, user).subscribe({
      next: () => {
        this.modalOpen = false;
        this.loadUsers(); // ✅ Rafraîchit la liste
        this.snackBar.open('✅ Utilisateur modifié', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('Erreur modification:', err);
        this.snackBar.open('❌ Échec modification', 'Fermer', { duration: 5000 });
      }
    });
  } else {
    // Ajout
    this.userService.add(user).subscribe({
      next: () => {
        this.modalOpen = false;
        this.loadUsers();
        this.snackBar.open('✅ Utilisateur ajouté', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        console.error('Erreur ajout:', err);
        this.snackBar.open('❌ Échec ajout : ' + (err.error?.message || 'Vérifiez les champs'), 'Fermer', { duration: 5000 });
      }
    });
  }
}

  delete(id: number) {
    if (confirm('Supprimer ce compte ?')) {
      this.userService.delete(id).subscribe(() => this.loadUsers());
    }
  }
activer(id: number) {
  this.userService.activer(id).subscribe(() => this.loadUsers());
}

desactiver(id: number) {
  this.userService.desactiver(id).subscribe(() => this.loadUsers());
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
sidebarVisible: boolean = true;
toggleSidebar(): void {
  this.sidebarVisible = !this.sidebarVisible;
}
telechargerCSV(): void {
  const headers = ['Nom', 'Prénom', 'Email', 'Rôle', 'Statut'];
  const rows = this.users.map(user => [
    this.escapeCSV(user.nom),
    this.escapeCSV(user.prenom),
    this.escapeCSV(user.mail),
    this.escapeCSV(user.role),
    user.actif ? 'Actif' : 'Inactif'
  ]);


  const csvContent = [
    headers.join(','), 
    ...rows.map(row => row.join(','))
  ].join('\n');

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
  if (value === null || value === undefined) return '';
  const str = value.toString();
  // Si la valeur contient une virgule, un saut de ligne ou un guillemet, on l'entoure de guillemets
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`; 
  }
  return str;
}




}
