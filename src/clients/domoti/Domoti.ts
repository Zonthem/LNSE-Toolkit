import inquirer from "inquirer";
import * as fs from 'fs';
import { inputFolderPrompt, outputFolderPrompt } from "../../commands/DomotiPrompt.js";
import { DomotiAnswer } from "../../types/DomotiAnswer.js";
import { AbstractClient } from "../AbstractClient.js";
import path from "path";
import { xml2js, Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { DomotiOutputObject } from "./DomotiOutputObject.js";

function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el.declaration.attributes;
}

export class Domoti extends AbstractClient {

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
    const filelist: string[] = fs.readdirSync(folders.input);

    filelist.forEach(element => {
      if (element.toLowerCase().endsWith('.xml')) {
        let file = fs.readFileSync(path.join(folders.input, element), 'utf-8');
        const obj = xml2js(file);

        if (isXmlElement(obj)) {
          this.translate(obj);
        }
      }
    });
  }

  translate(obj: XmlElement) {
    const rootElements: XmlElement[] | undefined = obj.elements;
    var compteur = 0;

    if (rootElements === undefined) {
      console.error('root null');
      return;
    }

    rootElements.forEach(image => {
      const imageElements: XmlElement[] | undefined = image.elements;

      if (imageElements === undefined) {
        return;
      }

      imageElements.forEach(field => {
        const fieldAttributes: Attributes | undefined = image.attributes;

        if (fieldAttributes === undefined) {
          return;
        }

        compteur++;
      })
    });
  }

}