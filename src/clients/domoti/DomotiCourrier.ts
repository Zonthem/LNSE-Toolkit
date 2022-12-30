import inquirer from "inquirer";
import * as fs from 'fs';
import { inputFolderPrompt, outputFolderPrompt } from "../../commands/DomotiPrompt.js";
import { DomotiAnswer } from "../../types/DomotiAnswer.js";
import { AbstractClient } from "../AbstractClient.js";
import path from "path";
import { xml2js, Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { Data, DomotiOutputObject } from "./DomotiOutputObject.js";
import { DomotiCourrierOutputObject } from "./DomotiCourrierOutputObject.js";
import { DomotiInputObject, Image } from "./DomotiInputObject.js";

function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el.declaration.attributes;
}

export class DomotiCourrier extends AbstractClient {

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
    var filelist: string[] = [];
    const folderlist: string[] = fs.readdirSync(folders.input);

    for (let folder in folderlist) {
      let stats: fs.Stats = fs.statSync(path.join(folders.input, folder));
      if (stats.isDirectory()) {
        fs.readdirSync(path.join(folders.input, folder)).forEach(f => {
          folderlist.push(path.join(folder, f));
        })
      } else {
        filelist.push(folder);
      }
    }

    filelist.forEach(element => {
      if (element.toLowerCase().endsWith('.xml')) {
        let file = fs.readFileSync(path.join(folders.input, element), 'utf-8');
        const obj = xml2js(file);

        if (isXmlElement(obj)) {
          const xml = this.translate(obj, element);
          if (!fs.existsSync(folders.output)) {
            fs.mkdirSync(folders.output);
          }
          this.writeFile(path.join(folders.output, element), xml);
        }
      }
    });
  }

  translate(obj: XmlElement, filename: string): string {
    const rootElements: XmlElement[] | undefined = obj.elements;
    const outputObject: DomotiOutputObject = new DomotiCourrierOutputObject();
    const inputObject: DomotiInputObject = new DomotiInputObject();
    var img: Image;

    if (rootElements === undefined) {
      console.error('root null');
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
              console.log('Attribut non traité dans ' + filename + ' : ' + fieldAttributes.name + '(valeur=' + value + ')');
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