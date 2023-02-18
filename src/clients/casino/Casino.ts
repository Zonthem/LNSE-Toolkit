import inquirer from "inquirer";
import * as fs from 'fs';
import path from 'path';
import { defaultOutputMessage, inputFolderPrompt, outputFolderPrompt } from "../../commands/DefaultPrompt.js";
import { CasinoAnswer } from "../../types/CasinoAnswer.js";
import { Client, InputObjectRead, isXmlElement } from "../AbstractClient.js";
import { xml2js, Element as XmlElement, js2xml } from "xml-js";
import { CasinoLEV } from "./CasinoLEV.js";
import { CasinoBLI } from "./CasinoBLI.js";
import { GEDMultiLines, HUBFile, HUBIndex } from "./CasinoOutput.js";
import { CasinoLER } from "./CasinoLER.js";

export class Casino extends Client {

  listBLI: CasinoBLI[] = [];
  listLEV: CasinoLEV[] = [];
  listLER: CasinoLER[] = [];
  lastLEV: CasinoLEV | undefined;

  constructor() {
    super();
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

  startProcess(answers: CasinoAnswer) {
    this.inputFolder = answers.input;
    this.outputFolder = (answers.output === defaultOutputMessage ? answers.input : answers.output);

    const inputObjectRead: InputObjectRead = this.readFromInputFolder();

    this.logger.info(inputObjectRead.objects.length + ' fichiers découverts');

    this.filelist.forEach(element => {
      if (element.toLowerCase().endsWith('.xml')) {
        this.logger.info(`Traitement de ${path.join(answers.input, element)}`);
        let file = fs.readFileSync(path.join(answers.input, element), 'utf-8');
        const obj = xml2js(file);

        if (isXmlElement(obj)) {
          const listDocs = obj.elements?.find(f => f.name = 'root')?.elements;
          if (listDocs === undefined) {
            this.logger.warn('Pas de données trouvées');
          } else {
            this.extractFromXml(listDocs);
          }
        }

        this.logger.info(`Données trouvées : ${this.listLEV.length} LEV ; ${this.listBLI.length} BLI ; ${this.listLER.length} LER`)

        const xml: {
          lev: string,
          bli: string,
          ler: string
        } = this.translate();

        if (!fs.existsSync(answers.output)) {
          this.logger.info(`${answers.output} n\'existe pas, création en cours ...`);
          fs.mkdirSync(answers.output);
        }
        if (this.listLEV.length > 0) this.writeFile(path.join(answers.output, this.nameOutputFile('LEV', element)), xml.lev);
        if (this.listBLI.length > 0) this.writeFile(path.join(answers.output, this.nameOutputFile('BL', element)), xml.bli);
        if (this.listLER.length > 0) this.writeFile(path.join(answers.output, this.nameOutputFile('LER', element)), xml.ler);
        this.logger.info(`${path.join(answers.input, element)} a été généré`);
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
          this.listBLI.push(newBLI);
          break;
        case 'LER':
          this.listLER.push(this.createLER(doc));
          break;
        default:
          this.logger.warn('document pété : ', sousType);
      }
    })
  }

  translate(): { lev: string, bli: string, ler: string } {
    this.logger.info('Début traduction')

    const xmlLEV = this.createXMLStruct(this.listLEV, 'Lettre de voiture');
    const xmlBLI = this.createXMLStruct(this.listBLI, 'BL');
    const xmlLER = this.createXMLStruct(this.listLER, 'LER');

    return {
      bli: xmlBLI,
      lev: xmlLEV,
      ler: xmlLER
    }

  }

  createXMLStruct(list: CasinoLEV[] | CasinoBLI[] | CasinoLER[], type: 'Lettre de voiture' | 'BL' | 'LER'): string {
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
          Entrepot_admin: element.entrepot_admin,
          Lot_numerisation: element.lot_numerisation,
          Date_desactivation: element.date_desactivation
        },
        GEDMultiLinesList: {
          //On force la séparation entre l'objet et sa référence
          GEDMultiLines: JSON.parse(JSON.stringify(multiLineList))
        }
      })
    });
    var output: HUBIndex = {
      HUBIndex: {
        HUBFile: hubFile
      }
    }
    const xml = js2xml(output, { compact: true });
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
      this.getElementValue(doc, 'lot_numerisation'),
      ""
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
      this.getElementValue(doc, 'lot_numerisation'),
      this.getElementValue(doc, 'Date_desactivation')
    );
  }

  createLER(doc: XmlElement): CasinoLER {
    return new CasinoLER(
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
      this.getElementValue(doc, 'lot_numerisation'),
      this.getElementValue(doc, 'Date_desactivation'),
    );
  }

  pushToLastLEV(bli: CasinoBLI): void {
    if (this.lastLEV === undefined) {
      this.logger.warn('BLI avant LEV, attention !');
      return;
    }
    this.lastLEV.addCodeEntrepot(bli.code_entrepot);
    this.lastLEV.addNumCommande(bli.num_commande);
    if (this.lastLEV.addDateDesactivation(bli.date_desactivation)) {
      this.logger.warn('Attention, 2 BLI ont des date_desactivation différentes, la première sera gardée par défaut');
    }
    this.lastLEV.addEntrepotAdmin(bli.entrepot_admin);
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
    let pathStr: string[] = nameInputFile.split(path.sep);
    let fileInputCut: string[];
    if (pathStr.length > 1) {
      fileInputCut = pathStr.pop()?.split('.')[0].split('_') || ['undefined'];
    } else {
      fileInputCut = pathStr[0].split('.')[0].split('_');
    }
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

    return [...pathStr, newName].join('/');
  }
}