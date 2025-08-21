import { Routes } from '@angular/router';
import { AgentDashboardComponent } from './agent-dashboard/agent-dashboard.component';
import { LoginComponent } from './login/login.component';
import { CalendrierComponent } from './calendrier/calendrier.component';
import { UserComponent } from './user/user.component';
import { TacheComponent } from './tache/tache.component';
import { TacheAgentComponent } from './tache-agent/tache-agent.component';


export const routes: Routes = [
    {path: 'login', component: LoginComponent},
    {path: 'agent-dashboard', component: AgentDashboardComponent},
    {path: 'calendrier', component: CalendrierComponent},
    {path: 'compte', component: UserComponent},
    {path: 'tache', component: TacheComponent},
    {path: 'tacheAgent', component: TacheAgentComponent},
    {path: '', redirectTo: 'login', pathMatch:'full'}
];
