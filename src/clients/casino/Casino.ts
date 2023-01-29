import inquirer from "inquirer";
import * as fs from 'fs';
import path from 'path';
import { inputFolderPrompt, outputFolderPrompt } from "../../commands/CasinoPrompt.js";
import { CasinoAnswer } from "../../types/CasinoAnswer.js";
import { Client } from "../AbstractClient.js";
import { xml2js, Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { CasinoLEV } from "./CasinoLEV.js";
import { CasinoBLI } from "./CasinoBLI.js";
import { GEDMultiLines, HUBFile, HUBIndex } from "./CasinoOutput.js";
import { Logger } from "ts-log";
import { FileLogger } from "../../FileLogger.js";

function isXmlElement(el: XmlElement | ElementCompact): el is XmlElement {
  return el?.declaration.attributes;
}

export class Casino extends Client {
  inputFolder!: string;
  logger: Logger;

  listBLI: CasinoBLI[] = [];
  listLEV: CasinoLEV[] = [];
  lastLEV: CasinoLEV | undefined;

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

        this.logger.info(`Données trouvées : ${this.listLEV.length} LEV et ${this.listBLI.length} BLI`)

        const xml: {
          lev: string,
          bli: string
        } = this.translate();

        if (!fs.existsSync(folders.output)) {
          this.logger.info(`${folders.output} n\'existe pas, création en cours ...`);
          fs.mkdirSync(folders.output);
        }
        this.writeFile(path.join(folders.output, this.nameOutputFile('LEV', element)), xml.lev);
        this.writeFile(path.join(folders.output, this.nameOutputFile('BL', element)), xml.bli);
        this.logger.info(`${path.join(folders.input, element)} a été généré`);
      }
    });
  }

  extractFromXml(listDocs: XmlElement[]) {
    listDocs.forEach(doc => {
      let sousType = doc.elements?.find(f => {
        return f.attributes?.name === "Code_sous_Type"
      })?.attributes?.value
      switch (sousType) {
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
    this.logger.info('Début traduction')

    const xmlLEV = this.createXMLStruct(this.listLEV, 'Lettre de voiture');
    const xmlBLI = this.createXMLStruct(this.listBLI, 'BL');

    return {
      bli: xmlBLI,
      lev: xmlLEV
    }

  }

  createXMLStruct(list: CasinoLEV[] | CasinoBLI[], type: 'Lettre de voiture' | 'BL'): string {
    var multiLineList: GEDMultiLines[] = [];
    var multiLineNumCommande: GEDMultiLines;
    var multiLineCodeEntrepot: GEDMultiLines;
    var hubFile: HUBFile[] = [];

    list.forEach(element => {
      //Reset multiline
      multiLineList = [];
      multiLineCodeEntrepot = {
        _attributes: { type: 'Code_entrepot' },
        Line_value: []
      };
      multiLineNumCommande = {
        _attributes: { type: 'Num_commande' },
        Line_value: []
      };

      //Set multiline pour code_entrepot
      element.code_entrepot.forEach(code => {
        multiLineCodeEntrepot.Line_value.push(code)
      });

      //Set multiline pour 
      element.num_commande.forEach(num => {
        multiLineNumCommande.Line_value.push(num)
      });

      //Concat des listes
      multiLineList = [multiLineCodeEntrepot, multiLineNumCommande];

      //Insersion du doc dans la liste des docs générés
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
        GEDMultiLinesList: {
          //On force la séparation entre l'objet et sa référence
          GEDMultiLines: JSON.parse(JSON.stringify(multiLineList))
        }
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
      this.getElementValue(doc, 'Document Filename'),
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
      this.getAllNotNullElementValue(doc, 'num_commande'),
      this.getAllNotNullElementValue(doc, 'code_entrepot'),
      this.getElementValue(doc, 'Entrepot_admin'),
      this.getElementValue(doc, 'Date_livraison'),
      this.getElementValue(doc, 'Code_societe'),
      this.getElementValue(doc, 'Document Filename'),
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
        return '' + a
      default:
        return '';
    }
  }

  getAllNotNullElementValue(doc: XmlElement, key: string): string[] {
    let a: (string)[] | undefined = doc.elements
      ?.filter(f => {
        return typeof f.attributes?.name === 'string'
          && f.attributes?.name.toLowerCase().startsWith(key.toLowerCase())
          && f.attributes.value !== '';
      })
      .map<string>(m => {
        switch (typeof m.attributes?.value) {
          case 'string':
            return m.attributes.value;
          case 'number':
            return '' + m.attributes.value
          default:
            return '';
        }
      });

    return a || [];
  }

  nameOutputFile(type: 'LEV' | 'BL' | 'LER', nameInputFile: string): string {
    let fileInputCut: string[] = nameInputFile.split('.')[0].split('_');
    if (fileInputCut.length < 3) {
      this.logger.warn('Le fichier d\'entrée ' + nameInputFile + ' a un nom qui ne correspond pas au pattern attendu : HUB-INDEX-XXX_yyyy-MM-dd_numLot.xml')
      return 'HUB-INDEX-' + type + '.xml';
    }
    let newName: string =
      'HUB-INDEX-'
      + type
      + '_'
      + fileInputCut[1]
      + '_'
      + fileInputCut[2]
      + '.xml';

    return newName;
  }
}