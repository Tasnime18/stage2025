import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Compte, UserService } from '../user.service';
import { Router } from '@angular/router';


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
  modalOpen = false;
  selectedUserId: number | null = null;

  constructor(private userService: UserService, private fb: FormBuilder, private router:Router) {
    this.form = this.fb.group({
      nom: [''],
      prenom: [''],
      mail: [''],
      motdepasse: [''],
      role: ['USER']
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe(data => this.users = data);
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
      this.userService.update(this.selectedUserId, user).subscribe(() => {
        this.modalOpen = false;
        this.loadUsers();
      });
    } else {
      this.userService.add(user).subscribe(() => {
        this.modalOpen = false;
        this.loadUsers();
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




}
