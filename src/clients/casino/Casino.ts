import inquirer from "inquirer";
import * as fs from 'fs';
import path from 'path';
import log4js, { Logger } from "log4js";
import { inputFolderPrompt, outputFolderPrompt } from "../../commands/CasinoPrompt.js";
import { CasinoAnswer } from "../../types/CasinoAnswer.js";
import { AbstractClient } from "../AbstractClient.js";
import { xml2js, Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { CasinoLEV } from "./CasinoLEV.js";
import { CasinoBLI } from "./CasinoBLI.js";
import { GEDMultiLines, HUBFile, HUBIndex } from "./CasinoOutput.js";

function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el?.declaration.attributes;
}

export class Casino extends AbstractClient {
  inputFolder!: string;
  logger: Logger;

  listBLI: CasinoBLI[] = [];
  listLEV: CasinoLEV[] = [];
  lastLEV: CasinoLEV | undefined;

  constructor() {
    super();
    this.runMessage();
    this.logger = log4js.getLogger();
  }

  runMessage() {
    inquirer.prompt([
      inputFolderPrompt,
      outputFolderPrompt
    ])
      .then((answers: CasinoAnswer) => {
        this.startProcess(answers)
      })
  }

  startProcess(folders: CasinoAnswer) {
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
          const listDocs = obj.elements?.find(f => f.name = 'root')?.elements;
          if (listDocs === undefined) {
            this.logger.warn('Pas de données trouvées');
          } else {
            this.extractFromXml(listDocs);
          }
        }

        const xml: {
          lev: string,
          bli: string
        } = this.translate();

        if (!fs.existsSync(folders.output)) {
          this.logger.info(`${folders.output} n\'existe pas, création en cours ...`);
          fs.mkdirSync(folders.output);
        }
        this.writeFile(path.join(folders.output, 'HUB-INDEX-LEV.xml'), xml.lev);
        this.writeFile(path.join(folders.output, 'HUB-INDEX-BLI.xml'), xml.bli);
        this.logger.info(`${path.join(folders.input, element)} a été généré`);
      }
    });
  }

  extractFromXml(listDocs: XmlElement[]) {
    listDocs.forEach(doc => {
      let sousType = doc.elements?.find(f => {
        return f.attributes?.name === "Code_sous_Type"
      })?.attributes?.value
      switch(sousType) {
        case 'LEV':
          let newLEV = this.createLEV(doc);
          this.lastLEV = newLEV;
          this.listLEV.push(this.lastLEV);
          break;
        case 'BLI':
          let newBLI = this.createBLI(doc);
          this.pushToLastLEV(newBLI);
          this.listBLI.push(newBLI)
          break;
        default:
          this.logger.warn('document pété : ', doc);
      }
    })
  }

  translate(): { lev: string, bli: string } {
    this.logger.info('translate')
    
    const xmlLEV = this.createXMLStruct(this.listLEV, 'Lettre de voiture');
    const xmlBLI = this.createXMLStruct(this.listBLI, 'BL');

    return {
      bli: xmlBLI,
      lev: xmlLEV
    }

  }

  createXMLStruct(list: CasinoLEV[] | CasinoBLI[], type: 'Lettre de voiture' | 'BL'): string {
    var multiLineList: GEDMultiLines[];
    var multiLineNumCommande: GEDMultiLines = {
      GEDMultiLines: {
        _attributes: { type: 'Num_commade' },
        Line_value: []
      }
    };
    var multiLineCodeEntrepot: GEDMultiLines = {
      GEDMultiLines: {
        _attributes: { type: 'Code_entrepot' },
        Line_value: []
      }
    };
    var hubFile: HUBFile[] = [];

    list.forEach(element => {
      multiLineNumCommande.GEDMultiLines.Line_value = [];
      multiLineCodeEntrepot.GEDMultiLines.Line_value = [];

      element.code_entrepot.forEach(code => {
        multiLineCodeEntrepot.GEDMultiLines.Line_value.push(code)
      });

      element.num_commande.forEach(num => {
        multiLineNumCommande.GEDMultiLines.Line_value.push(num)
      });

      multiLineList = [multiLineCodeEntrepot, multiLineNumCommande];

      hubFile.push({
        _attributes: { FileName: element.document_filename },
        Categorie: element.categorie,
        Code_Type: element.code_type,
        Code_Sous_Type: element.code_sous_type,
        GEDDataFlux: { Code_Fournisseur: element.code_fournisseur },
        GEDMetadonnees: {
          Code_societe: element.code_societe,
          Date_document: element.date_traitement,
          Date_livraison: element.date_livraison,
          Type_document: type,
          Entrepot_admin: element.entrepot_admin
        },
        GEDMultiLinesList: JSON.parse(JSON.stringify(multiLineList))
      })
    });
    var outputLEV: HUBIndex = {
      HUBIndex: {
        HUBFile: hubFile
      }
    }
    const xml = js2xml(outputLEV, { compact: true });
    return xml
  }

  createLEV(doc: XmlElement): CasinoLEV {
    return new CasinoLEV(
      this.getElementValue(doc, 'categorie'),
      this.getElementValue(doc, 'code_type'),
      this.getElementValue(doc, 'code_sous_type'),
      this.getElementValue(doc, 'code_fournisseur'),
      this.getElementValue(doc, 'date_traitement'),
      this.getElementValue(doc, 'Num_lettre'),
      this.getElementValue(doc, 'Num_vehicule'),
      this.getElementValue(doc, 'Num_bl'),
      [],
      [],
      this.getElementValue(doc, 'Entrepot_admin'),
      this.getElementValue(doc, 'Date_livraison'),
      this.getElementValue(doc, 'Code_societe'),
      this.getElementValue(doc, 'Compteur_LEV'),
    );
  }

  createBLI(doc: XmlElement): CasinoBLI {
    return new CasinoBLI(
      this.getElementValue(doc, 'categorie'),
      this.getElementValue(doc, 'code_type'),
      this.getElementValue(doc, 'code_sous_type'),
      this.getElementValue(doc, 'code_fournisseur'),
      this.getElementValue(doc, 'date_traitement'),
      this.getElementValue(doc, 'Num_bl'),
      [this.getElementValue(doc, 'num_commande')],
      [this.getElementValue(doc, 'code_entrepot')],
      this.getElementValue(doc, 'Entrepot_admin'),
      this.getElementValue(doc, 'Date_livraison'),
      this.getElementValue(doc, 'Code_societe'),
      this.getElementValue(doc, 'Compteur_LEV'),
    );
  }

  pushToLastLEV(bli: CasinoBLI): void {
    if (this.lastLEV === undefined) {
      this.logger.warn('BLI avant LEV, attention !');
      return;
    }
    this.lastLEV.addCodeEntrepot(bli.code_entrepot);
    this.lastLEV.addNumCommande(bli.num_commande);
  }

  getElementValue(doc: XmlElement, key: string): string {
    let a = doc.elements?.find(f => {
      return typeof f.attributes?.name === 'string'
        && f.attributes?.name.toLowerCase() === key.toLowerCase()
    })?.attributes?.value;

    switch (typeof a) {
      case 'string':
        return a;
      case 'number':
        return ''+a
      default:
        return '';
    }
  }
}