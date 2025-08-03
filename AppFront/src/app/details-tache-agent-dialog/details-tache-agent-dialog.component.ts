import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

interface Tache {
  id: number;
  titre: string;
  description: string;
  dateDebut: string;
  dureeEnHeures: number;
  priorite: string;
  agentId: number;
}

@Component({
  selector: 'app-details-tache-agent-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './details-tache-agent-dialog.component.html',
  styleUrl: './details-tache-agent-dialog.component.css'
})
export class DetailsTacheAgentDialogComponent {
  tache: Tache;
  estProprietaire: boolean;

  constructor(
    public dialogRef: MatDialogRef<DetailsTacheAgentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.tache = data.tache;
    this.estProprietaire = data.estProprietaire;
  }

  save(): void {
    this.dialogRef.close({ action: 'save', tache: this.tache });
  }

  delete(): void {
    if (confirm('Voulez-vous vraiment supprimer cette tâche ?')) {
      this.dialogRef.close({ action: 'delete', tache: this.tache });
    }
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

