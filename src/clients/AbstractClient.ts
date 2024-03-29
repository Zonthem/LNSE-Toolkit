import * as fs from "fs";
import path from "path";
import { FileLogger } from "../FileLogger.js";
import { Logger } from "ts-log";
import { xml2js, Element as XmlElement, ElementCompact, js2xml } from "xml-js";
import { zip } from "zip-a-folder";

export type InputObjectRead = {
  objects: string[];
  folders: string[];
}

export type InputSubfolderList = {
  path: string,
  filename: string
}

export function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el?.declaration.attributes || false;
}

export abstract class Client {

  inputFolder!: string;
  outputFolder!: string;
  filelist!: string[];
  logger: Logger;

  constructor() {
    this.runMessage();
    this.logger = FileLogger.getInstance();
  }

  abstract runMessage(): void;

  writeFile(_path: string, contents: string, cb?: fs.WriteFileOptions) {
    try {
      fs.mkdirSync(path.dirname(_path), { recursive: true});
      fs.writeFileSync(_path, contents, cb);
    } catch (e) {
      console.error('Problème d\'écriture sur ' + _path + ' : ' + e)
    }
  }

  readFromInputFolder(): InputObjectRead {
    const inputObjectList: string[] = fs.readdirSync(this.inputFolder);
    const inputSubfolderList: string[] = [];

    this.filelist = [];

    // recherche récurs
    for (const object of inputObjectList) {

      let stats: fs.Stats = fs.statSync(path.join(this.inputFolder, object));

      if (stats.isDirectory()) {
        // add le dossier à la liste des sous dossiers importants QUE SI il contient un fichier .xml
        let folderHasAnXmlFile: boolean = false;
        // add tous les fichiers / sous dossiers à la recherche récurs
        fs.readdirSync(path.join(this.inputFolder, object)).forEach(f => {
          inputObjectList.push(path.join(object, f));
          if (f.toLowerCase().endsWith('.xml')) {
            inputSubfolderList.push(JSON.parse(JSON.stringify(path.join(this.inputFolder, object))));
          }
        })
      } else {
        // TODO : trouver un moyen de zipper le dossier racine s'il ne contient pas de sous-dossier
        /*if (!inputSubfolderList.includes(this.inputFolder)) {
          inputSubfolderList.push(JSON.parse(JSON.stringify(this.inputFolder)));
        }*/
        this.filelist.push(object);
      }
    }

    return {
      folders: inputSubfolderList,
      objects: inputObjectList
    };

  }

  async doZip(folderList: string[], folderOut: string): Promise<void> {
    return new Promise(resolve => {
      folderList.forEach(async f => {
        this.logger.info('zippationnage de ' + f);
        let folderName: string = f.substring(f.lastIndexOf(path.sep) + 1) + '.zip';
        let zipReturnValue: Error | void = await zip(f, path.join(folderOut, folderName));
        if (zipReturnValue instanceof Error) {
          this.logger.warn('Problème  ' + zipReturnValue.name + ' : ' + zipReturnValue.message)
        }
      });
      resolve();
    })
  }

}