/**
 * Utilitaires liés au niveau scolaire de l'élève.
 * Mode "jeune élève" = interface simplifiée, grands emojis, vocabulaire enfantin.
 * S'applique uniquement à PRIMAIRE_1 et PRIMAIRE_2 (6-7 ans).
 */

const NIVEAUX_JEUNES = ["PRIMAIRE_1", "PRIMAIRE_2"] as const;

export type NiveauJeune = (typeof NIVEAUX_JEUNES)[number];

export function estJeuneEleve(niveauScolaire: string): boolean {
  return (NIVEAUX_JEUNES as readonly string[]).includes(niveauScolaire);
}
