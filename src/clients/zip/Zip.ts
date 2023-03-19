import inquirer from "inquirer";
import { zipPathNoWhenPrompt } from "../../commands/DefaultPrompt.js";
import { ZipAnswer } from "../../types/ZipAnswers.js";
import { Client } from "../AbstractClient.js";
import * as fs from 'fs';
import path from "path";

export class Zip extends Client {

  constructor() {
    super();
  }

  runMessage(): void {
    inquirer.prompt([
      zipPathNoWhenPrompt
    ])
      .then((answers: ZipAnswer) => {
        this.startProcess(answers)
      })
  }

  startProcess(answers: ZipAnswer) {
    const rootFileStat = fs.statSync(answers.zipPath);
    if (!rootFileStat.isDirectory()) {
      this.logger.warn(answers.zipPath + ' n\'est pas un dossier.');
      return ;
    }
    const fileList = fs.readdirSync(answers.zipPath);
    const foldersToZip: string[] = [];
    fileList.forEach((file: string) => {
      let filepath = path.join(answers.zipPath, file);
      if (fs.statSync(filepath).isDirectory()) {
        this.logger.info('dossier trouvé : ' + file);
        foldersToZip.push(filepath);
      }
    });

    if (foldersToZip.length === 0) {
      this.logger.warn('Aucun sous dossier trouvé dans ' + answers.zipPath);
      return;
    }

    this.doZip(foldersToZip, answers.zipPath);

    this.logger.info('Traitement terminé');
  }

}