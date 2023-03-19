import { QuestionCollection } from "inquirer";

export const mainMenuPrompt: QuestionCollection<any> = {
  name: 'client',
  type: 'list',
  message: 'Client',
  choices: [
    {
      name: 'Domoti - Bon de commande',
      value: 'domoti_bon_commande'
    },
    {
      name: 'Domoti - Courrier',
      value: 'domoti_courrier'
    },
    {
      name: 'Casino',
      value: 'casino'
    },
    {
      name: 'Cheque',
      value: 'zip'
    }
  ]
}