import inquirer from "inquirer";
import * as fs from 'fs';
import { inputFolderPrompt, outputFolderPrompt } from "../../commands/DomotiPrompt.js";
import { DomotiAnswer } from "../../types/DomotiAnswer.js";
import { AbstractClient } from "../AbstractClient.js";
import path from "path";
import { xml2js, Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { Data, DomotiOutputObject } from "./DomotiOutputObject.js";
import { DomotiInputObject, Image } from "./DomotiInputObject.js";

function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el.declaration.attributes;
}

export class Domoti extends AbstractClient {

  inputFolder!: string;

  constructor() {
    super();
    this.runMessage();
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
    const filelist: string[] = fs.readdirSync(folders.input);

    filelist.forEach(element => {
      if (element.toLowerCase().endsWith('.xml')) {
        let file = fs.readFileSync(path.join(folders.input, element), 'utf-8');
        const obj = xml2js(file);

        if (isXmlElement(obj)) {
          const xml = this.translate(obj);
          fs.writeFileSync(path.join(folders.output, element), xml);
        }
      }
    });
  }

  translate(obj: XmlElement): string {
    const rootElements: XmlElement[] | undefined = obj.elements;
    const outputObject: DomotiOutputObject = new DomotiOutputObject();
    const inputObject: DomotiInputObject = new DomotiInputObject();
    var img: Image;

    if (rootElements === undefined) {
      console.error('root null');
      return '';
    }

    const listInputFolder: string[] = this.inputFolder.split('-');
    
    outputObject.data.batch._attributes.name = listInputFolder[listInputFolder.length - 1];

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
              console.log('je connais pas');
          }
        });

        inputObject.addImage(img);
      });
    });

    //Ici, inputObject est censé être complet
    const data: Data = outputObject.fill(inputObject.imageList);
    const xml = js2xml(data, { compact: true });
    return xml;
  }

}