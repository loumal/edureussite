import type { DomaineSpecialiste } from "@/generated/prisma";
import type { Questionnaire } from "./questionnaire-types";
import { questionnaireNeuropsychologue } from "./questionnaire-neuropsychologue";
import { questionnaireOrthopedagogue } from "./questionnaire-orthopedagogue";
import { questionnaireOrthophoniste } from "./questionnaire-orthophoniste";
import { questionnaireErgotherapeute } from "./questionnaire-ergotherapeute";
import { questionnaireOptometriste } from "./questionnaire-optometriste";
import { questionnairePsychoeducateur } from "./questionnaire-psychoeducateur";
import { questionnaireAnamnese } from "./questionnaire-anamnese";

export const QUESTIONNAIRES: Record<DomaineSpecialiste, Questionnaire> = {
  NEUROPSYCHOLOGUE: questionnaireNeuropsychologue,
  ORTHOPEDAGOGUE: questionnaireOrthopedagogue,
  ORTHOPHONISTE: questionnaireOrthophoniste,
  ERGOTHERAPEUTE: questionnaireErgotherapeute,
  OPTOMETRISTE: questionnaireOptometriste,
  PSYCHOEDUCATEUR: questionnairePsychoeducateur,
};

export const QUESTIONNAIRE_ANAMNESE = questionnaireAnamnese;

export function getQuestionnaire(domaine: DomaineSpecialiste): Questionnaire {
  return QUESTIONNAIRES[domaine];
}

export function countItems(questionnaire: Questionnaire): number {
  return questionnaire.sections.reduce((total, section) => {
    const items = section.items?.length ?? 0;
    const questions = section.questions?.length ?? 0;
    return total + items + questions;
  }, 0);
}
