import figlet from "figlet";
import { AbstractClient } from "./clients/AbstractClient.js";
import { Domoti } from "./clients/domoti/Domoti.js";
import { DomotiCourrier } from "./clients/domoti/DomotiCourrier.js";
import { MainMenu } from "./MainMenu.js";
import { ClientAnswer } from "./types/ClientAnswer.js";
import log4js from "log4js";

class CliTool {

  header: string = figlet.textSync('LNSE toolkit');

  currentClient!: AbstractClient;

  run() {
    this.configureLogs();

    console.log(this.header);

    const mainMenu = new MainMenu();
    mainMenu.displayMainMenu()
      .then(client => {
        this.redirectToClient(client);
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        log4js.shutdown();
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

  /**
   * Partie utilisé pour configurer la lib log4js
   */
  configureLogs(): void {
    
    log4js.configure({
      appenders: { 
        info: { 
          type: "file", 
          filename: "logs/info.log",
        },
        stdout: {
          type: 'stdout'
        } 
      },
      categories: { 
        app: { 
          appenders: ['info', 'stdout'], 
          level: 'INFO' 
        },
        default: {
          appenders: ['stdout'],
          level: 'ERROR'
        } 
      },
    })
  }

}

const cliTool = new CliTool();

cliTool.run();