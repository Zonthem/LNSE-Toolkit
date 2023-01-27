import inquirer from "inquirer";
import * as fs from 'fs';
import { inputFolderPrompt, outputFolderPrompt } from "../../commands/DomotiPrompt.js";
import { DomotiAnswer } from "../../types/DomotiAnswer.js";
import { Client } from "../AbstractClient.js";
import path from "path";
import { xml2js, Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { Data, DomotiOutputObject } from "./DomotiOutputObject.js";
import { DomotiInputObject, Image } from "./DomotiInputObject.js";
import { FileLogger } from "../../FileLogger.js";
import { Logger } from "ts-log";

function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el.declaration.attributes;
}

export class Domoti extends Client {

  inputFolder!: string;
  logger: Logger;

  constructor() {
    super();
    this.runMessage();
    this.logger = FileLogger.getInstance();
  }

  runMessage() {
    inquirer.prompt([
      inputFolderPrompt,
      outputFolderPrompt
    ])
      .then((answers: DomotiAnswer) => {
        this.startProcess(answers)
      })
  }

  startProcess(folders: DomotiAnswer) {
    this.inputFolder = folders.input;
    var filelist: string[] = [];
    const folderlist: string[] = fs.readdirSync(folders.input);

    for (const folder of folderlist) {
      let stats: fs.Stats = fs.statSync(path.join(folders.input, folder));
      if (stats.isDirectory()) {
        fs.readdirSync(path.join(folders.input, folder)).forEach(f => {
          folderlist.push(path.join(folder, f));
        })
      } else {
        filelist.push(folder);
      }
    }

    this.logger.info(folderlist.length + ' fichiers découverts');

    filelist.forEach(element => {
      if (element.toLowerCase().endsWith('.xml')) {
        this.logger.info(`Traitement de ${path.join(folders.input, element)}`);
        let file = fs.readFileSync(path.join(folders.input, element), 'utf-8');
        const obj = xml2js(file);

        if (isXmlElement(obj)) {
          this.logger.info(`Traduction de ${path.join(folders.input, element)} ...`);
          const xml = this.translate(obj, path.join(folders.input, element));
          this.logger.info(`Fin de la traduction de ${path.join(folders.input, element)}`);
          if (!fs.existsSync(folders.output)) {
            this.logger.info(`${folders.output} n\'existe pas, création en cours ...`);
            fs.mkdirSync(folders.output);
          }
          this.writeFile(path.join(folders.output, element), xml);
          this.logger.info(`${path.join(folders.input, element)} a été généré`);
        } else {
          this.logger.info(`${path.join(folders.input, element)} est pourri`);
        }
      }
    });
    this.logger.info('Tous les éléments sont traités, fermeture de l\'app');
  }

  translate(obj: XmlElement, filename: string): string {
    const rootElements: XmlElement[] | undefined = obj.elements;
    const outputObject: DomotiOutputObject = new DomotiOutputObject();
    const inputObject: DomotiInputObject = new DomotiInputObject();
    var img: Image;

    if (rootElements === undefined) {
      this.logger.error('Élément root null sur ' + filename);
      return '';
    }

    const listFilename: string[] = filename.split(".")[0].split('-');
    
    outputObject.data.batch._attributes.name = listFilename[listFilename.length - 1];

    rootElements.forEach(image => {
      const imageElements: XmlElement[] | undefined = image.elements;

      if (imageElements === undefined) {
        return;
      }



      imageElements.forEach(field => {
        const fieldElement: XmlElement[] | undefined = field.elements;

        if (fieldElement === undefined) {
          return;
        }

        img = Object.assign({});

        fieldElement.forEach(attr => {
          const fieldAttributes: Attributes | undefined = attr.attributes;

          if (fieldAttributes === undefined) {
            return;
          }

          let value: string;
          switch (typeof fieldAttributes.value) {
            case 'string':
              value = fieldAttributes.value;
              break;
            case 'number':
              value = fieldAttributes.value.toString();
              break;
            default:
              value = '';
          }

          switch (fieldAttributes.name) {
            case ('UserName'):
              img.UserName = value;
              break;
            case ('Provenance'):
              img.Provenance = value;
              break;
            case ('Enseigne'):
              img.Enseigne = value;
              break;
            case ('document'):
              img.document = value;
              break;
            case ('code_client'):
              img.code_client = value;
              break;
            case ('Code_Avantage'):
              img.Code_Avantage = value;
              break;
            case ('Cheque'):
              img.Cheque = value;
              break;
            case ('Image Filename'):
              img.Image_Filename = value;
              break;
            case ('path'):
              img.path = value;
              break;
            case ('Image height'):
              img.Image_height = value;
              break;
            case ('Image width'):
              img.Image_width = value;
              break;
            default:
              this.logger.warn('Attribut non traité dans ' + filename + ' : ' + fieldAttributes.name + '(valeur=' + value + ')');
          }
        });

        inputObject.addImage(img);
      });
    });

    //Ici, inputObject est censé être complet
    const isMultipleCheques: boolean = this.checkNameForMultipleCheques(listFilename[listFilename.length - 1]);
    const data: Data = outputObject.fill(inputObject.imageList, isMultipleCheques);
    const xml = js2xml(data, { compact: true });
    return xml;
  }

  checkNameForMultipleCheques(filename: string): boolean {
    //BE et BM
    const pattern = /^B[EM]\d{5}$/;
    return pattern.test(filename);
  }

}