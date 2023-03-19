import { QuestionCollection } from "inquirer";

export const inputFolderPrompt: QuestionCollection<any> = {
  name: 'input',
  type: 'input',
  message: 'Dossier d\'entrée'
}

export const defaultOutputMessage: string = 'Par défaut : Dossier d\'entrée';

export const outputFolderPrompt: QuestionCollection<any> = {
  name: 'output',
  type: 'input',
  message: 'Dossier de sortie',
  default: defaultOutputMessage
}

export const doZipPrompt: QuestionCollection<any> = {
  name: 'zip',
  type: 'confirm',
  message: 'Zipper les dossiers ?'
}

export const zipPathPrompt: QuestionCollection<any> = {
  name: 'zipPath',
  type: 'input',
  message: 'Dossier d\'export des zip',
  when: function (answers: any) {
    return answers.zip;
  }
}

export const zipPathNoWhenPrompt: QuestionCollection<any> = {
  name: 'zipPath',
  type: 'input',
  message: 'Dossier d\'entrée des zips'
}