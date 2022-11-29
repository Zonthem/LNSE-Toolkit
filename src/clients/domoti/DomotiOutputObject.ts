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

export class DomotiOutputObject {
  data: {
    _declaration: Declaration,
    batch: {
      field: Field[],
      document: {
        field: Field[],
        page: Page[]
      }
    }
  }

  constructor() {
    this.data = {
      _declaration: {
        _attributes: {
          version: '1.0',
          encoding: 'utf-16'
        }
      },
      batch: {
        field: [],
        document: {
          field: [],
          page: []
        }
      }
    }
  }

  private createField(name: string, text: string, type?: string): Field {
    const field: Field = {
      _attributes: {
        name: name,
        ...type && {type}
      },
      _text: text
    };

    return field;
  }

  addFieldToBatch(name: string, text: string, type?: string) {
    this.data.batch.field.push(this.createField(name, text, type));
  }

  addFieldToDocument(name: string, text: string, type?: string) {
    this.data.batch.document.field.push(this.createField(name, text, type));
  }

  addFieldToPage(pageName: string, name: string, text: string, type?: string) {
    const page = this.data.batch.document.page.find(p => p._attributes.name === pageName)

    if (!page) {
      console.error('page introuvable : ', pageName);
      console.error(this.data.batch.document.page);
    }

    this.data.batch.field.push(this.createField(name, text, type));
  }

  addPage(name: string) {
    const page: Page = {
      _attributes: {
        name: name
      },
      field: []
    };

    this.data.batch.document.page.push(page);
  }
}