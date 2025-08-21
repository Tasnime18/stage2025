export interface Tache {
  id?: number;
  titre: string;
  description: string;
  dateDebut: string; // ISO format
  dureeEnHeures: number;
  priorite: string;
  agentId: number | null;
  etat: string;
}