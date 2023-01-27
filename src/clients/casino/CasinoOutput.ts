export type HUBIndex = {
  HUBIndex: {
    HUBFile: HUBFile[]
  }
}

export type HUBFile = {
  _attributes: {
    FileName: string
  },
  Categorie: string,
  Code_Type: string,
  Code_Sous_Type: string,
  GEDDataFlux: {
    Code_Fournisseur: string
  },
  GEDMetadonnees: {
    Entrepot_admin: string,
    Type_document: string,
    Date_document: string,
    Date_livraison: string,
    Code_societe: string,
  },
  GEDMultiLinesList: {
    GEDMultiLines: GEDMultiLines[]
  }
}

export type GEDMultiLines = {
  _attributes: {
    type: string
  },
  Line_value: string[]
}