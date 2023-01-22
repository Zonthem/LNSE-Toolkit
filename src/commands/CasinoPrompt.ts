import { QuestionCollection } from "inquirer";

export const inputFolderPrompt: QuestionCollection<any> = {
  name: 'input',
  type: 'input',
  message: 'Dossier d\'entrée'
}

export const outputFolderPrompt: QuestionCollection<any> = {
  name: 'output',
  type: 'input',
  message: 'Dossier de sortie'
}