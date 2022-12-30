import figlet from "figlet";
import { AbstractClient } from "./clients/AbstractClient.js";
import { Domoti } from "./clients/domoti/Domoti.js";
import { DomotiCourrier } from "./clients/domoti/DomotiCourrier.js";
import { MainMenu } from "./MainMenu.js";
import { ClientAnswer } from "./types/ClientAnswer.js";

class CliTool {

  header: string = figlet.textSync('LNSE toolkit');

  currentClient!: AbstractClient;

  run() {
    console.log(this.header);

    const mainMenu = new MainMenu();
    mainMenu.displayMainMenu()
      .then(client => {
        this.redirectToClient(client);
      })
      .catch(error => {
        console.error(error);
      })
  }

  redirectToClient(client: ClientAnswer): void {
    switch (client.client) {
      case 'domoti_bon_commande':
        this.currentClient = new Domoti();
        break;
      case 'domoti_courrier':
        this.currentClient = new DomotiCourrier();
        break;
    }
  }

}

const cliTool = new CliTool();

cliTool.run();