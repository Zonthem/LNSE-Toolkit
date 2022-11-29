import inquirer from "inquirer";
import { mainMenuPrompt } from "./commands/MenuPrompt.js";
import { ClientAnswer } from "./types/ClientAnswer.js";

export class MainMenu {

  constructor() { }

  displayMainMenu(): Promise<ClientAnswer> {

    return new Promise((resovle, reject) => {

      inquirer
        .prompt([
          mainMenuPrompt
        ])
        .then((answers: ClientAnswer) => {
          resovle(answers);
        })
        .catch((error) => {
          if (error.isTtyError) {
            reject('Ça marchera pas, force pas ..');
          } else {
            reject(error);
          }
        });
    });
  }

}