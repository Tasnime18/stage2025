import { Component, OnInit } from '@angular/core';
import{FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  loginForm:FormGroup;
  faUser = faUser;
  errorMessage: string='';

  constructor(private fb: FormBuilder, private authService: AuthService, private router:Router){
    this.loginForm=this.fb.group({
      mail:['',[Validators.required,Validators.email]],
      motdepasse:['',[Validators.required, Validators.minLength(6)]]
    });
  }
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  onSubmit():void{
  console.log('Valeurs saisies :', this.loginForm.value);
  console.log('Statut du formulaire :', this.loginForm.status);
    if (this.loginForm.invalid){
      console.log('formulaire invalide');
      return
    }
    const { mail, motdepasse } = this.loginForm.value;
    
    this.authService.login({mail, motdepasse}).subscribe({
      next: (response: any)=>{
        const token= response.token;
        localStorage.setItem('token', token);

        const decoded: any = jwtDecode(token);
        const role = decoded.role;

         if (role === 'ADMIN') {
          this.router.navigate(['/calendrier']);
        } else if (role === 'USER') {
          this.router.navigate(['/agent-dashboard']);
        } else {
          this.errorMessage = 'Rôle inconnu.';
        }
      },
      error: (err) => {
        console.error("erreur de login:",err);
        this.errorMessage = 'Email ou mot de passe incorrect, veillez réessayer';
      }
      
    })

  }


}
