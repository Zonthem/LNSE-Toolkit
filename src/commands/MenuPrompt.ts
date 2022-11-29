import { QuestionCollection } from "inquirer";

export const mainMenuPrompt: QuestionCollection<any> = {
  name: 'client',
  type: 'list',
  message: 'Client',
  choices: [
    {
      name: 'Domoti',
      value: 'domoti'
    }
  ]
}