import figlet from "figlet";
import { Client } from "./clients/AbstractClient.js";
import { Domoti } from "./clients/domoti/Domoti.js";
import { DomotiCourrier } from "./clients/domoti/DomotiCourrier.js";
import { MainMenu } from "./MainMenu.js";
import { ClientAnswer } from "./types/ClientAnswer.js";
import { Casino } from "./clients/casino/Casino.js";

class CliTool {

  header: string = figlet.textSync('LNSE toolkit');

  currentClient!: Client;

  run() {

    console.log(this.header);

    console.log('v1.0.1');
    console.log();

    const mainMenu = new MainMenu();
    mainMenu.displayMainMenu()
      .then(client => {
        this.redirectToClient(client);
      })
      .catch(error => {
        console.error(error);
      });
  }

  redirectToClient(client: ClientAnswer): void {
    switch (client.client) {
      case 'domoti_bon_commande':
        this.currentClient = new Domoti();
        break;
      case 'domoti_courrier':
        this.currentClient = new DomotiCourrier();
        break;
      case 'casino':
        this.currentClient = new Casino();
        break;
    }
  }
}

const cliTool = new CliTool();

cliTool.run();