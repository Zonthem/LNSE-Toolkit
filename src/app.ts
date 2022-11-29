import figlet from "figlet";
import { AbstractClient } from "./clients/AbstractClient.js";
import { Domoti } from "./clients/domoti/Domoti.js";
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
      case 'domoti':
        this.currentClient = new Domoti();
    }
  }

}

const cliTool = new CliTool();

cliTool.run();