import inquirer from "inquirer";
import * as fs from 'fs';
import { defaultOutputMessage, doZipPrompt, inputFolderPrompt, outputFolderPrompt, zipPathPrompt } from "../../commands/DefaultPrompt.js";
import { DefaultAnswer } from "../../types/DefaultAnswer.js";
import { Client, InputObjectRead, isXmlElement } from "../AbstractClient.js";
import path from "path";
import { xml2js, Element as XmlElement, Attributes, js2xml } from "xml-js";
import { Data, DomotiOutputObject } from "./DomotiOutputObject.js";
import { DomotiInputObject, Image } from "./DomotiInputObject.js";

export class Domoti extends Client {

  constructor() {
    super();
  }

  runMessage() {
    inquirer.prompt([
      inputFolderPrompt,
      outputFolderPrompt,
      doZipPrompt,
      zipPathPrompt
    ])
      .then((answers: DefaultAnswer) => {
        this.startProcess(answers)
      })
  }

  startProcess(answers: DefaultAnswer) {
    this.inputFolder = answers.input;
    this.outputFolder = (answers.output === defaultOutputMessage ? answers.input : answers.output);

    const inputObjectRead: InputObjectRead = this.readFromInputFolder();

    this.logger.info(inputObjectRead.objects.length + ' fichiers découverts');

    this.filelist.forEach(element => {
      if (element.toLowerCase().endsWith('.xml')) {
        this.logger.info(`Traitement de ${path.join(this.inputFolder, element)}`);
        let file = fs.readFileSync(path.join(this.inputFolder, element), 'utf-8');
        const obj = xml2js(file);

        if (isXmlElement(obj)) {
          this.logger.info(`Traduction de ${path.join(this.inputFolder, element)} ...`);
          const xml = this.translate(obj, path.join(this.inputFolder, element));
          this.logger.info(`Fin de la traduction de ${path.join(this.inputFolder, element)}`);
          if (!fs.existsSync(this.outputFolder)) {
            this.logger.info(`${this.outputFolder} n\'existe pas, création en cours ...`);
            fs.mkdirSync(this.outputFolder);
          }
          this.writeFile(path.join(this.outputFolder, element), xml);
          this.logger.info(`${path.join(this.inputFolder, element)} a été généré`);
        } else {
          this.logger.info(`${path.join(this.inputFolder, element)} est pourri`);
        }
      }
    });
    this.logger.info('Tous les éléments sont traités');
    if (answers.zip) {
      this.doZip(inputObjectRead.folders, answers.zipPath)      
    }
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