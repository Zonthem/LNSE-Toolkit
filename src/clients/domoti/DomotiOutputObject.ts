import { Image } from "./DomotiInputObject"

export type Declaration = {
  _attributes: {
    version: string,
    encoding: string
  }
}

export type Field = {
  _text: string,
  _attributes: {
    name: string,
    type?: string
  }
}

export type Page = {
  _attributes: {
    name: string
  },
  field: Field[]
}

export type Document = {
  _attributes: {
    name: string
  },
  field: Field[],
  page: Page[]
}

export type Data = {
  _declaration: Declaration,
  batch: {
    _attributes: {
      name: string
    },
    field: Field[],
    document: Document[]
  }
}

export class DomotiOutputObject {
  data: Data

  constructor() {
    this.data = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'utf-16'
        }
      },
      batch: {
        _attributes: {
          name: 'BCP108'
        },
        field: [],
        document: []
      }
    }
  }

  addDocument(name: string): Document {
    const doc: Document = {
      _attributes: {
        name: name
      },
      field: [],
      page: []
    };

    this.data.batch.document.push(doc);
    return doc;
  }

  addPagetoDocument(name: string, doc: Document): Page {
    const page: Page = {
      _attributes: {
        name: name
      },
      field: []
    };

    doc.page.push(page);
    return page;
  }

  addFieldIfNotPresent(fieldList: Field[], name: string, value: string) {
    const field = fieldList.find(f => f._attributes.name === name);
    //Si le champ est déjà présent (non undefined)
    if (field) {
      if (field._text !== value) {
        console.error('présent : ' + field._text + ' - arrive : ' + value);
      }
      return ;
    }

    fieldList.push({
      _text: value,
      _attributes: {
        name: name
      }
    })
  }

  fill(imageList: Image[]): Data {
  
    imageList.forEach((image: Image) => {

      //bypass tous les champs potentiellement undefined
      if (Object.values(image).some(o => o == undefined)) {
        console.log('image avec du null', image);
        return ;
      }

      //ajout fields a <batch>
      this.addFieldIfNotPresent(this.data.batch.field, 'UserName', image.UserName!);
      this.addFieldIfNotPresent(this.data.batch.field, 'Provenance', image.Provenance!);

      var doc: Document | undefined = this.data.batch.document.find(d => d._attributes.name === image.document)
      //création doc
      if (!doc) {
        doc = this.addDocument(image.document!);
      }

      //ajout fields a <document>
      this.addFieldIfNotPresent(doc.field, 'Enseigne', image.Enseigne!);
      this.addFieldIfNotPresent(doc.field, 'code_client', image.code_client!);
      this.addFieldIfNotPresent(doc.field, 'Code_Avantage', image.Code_Avantage!);
      this.addFieldIfNotPresent(doc.field, 'Cheque', image.Cheque!);

      var page : Page | undefined = doc.page.find(p => p._attributes.name === image.Image_Filename);
      if (!page) {
        page = this.addPagetoDocument(image.Image_Filename!, doc);
      }

      //ajout fields a <page>
      this.addFieldIfNotPresent(page.field, 'path', image.path!);
      this.addFieldIfNotPresent(page.field, 'width', image.Image_width!);
      this.addFieldIfNotPresent(page.field, 'height', image.Image_height!);

    });

    return JSON.parse(JSON.stringify(this.data));

  }
}