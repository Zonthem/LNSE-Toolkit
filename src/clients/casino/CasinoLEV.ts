export class CasinoLEV {
  categorie: string;
  code_type: string;
  code_sous_type: string;
  code_fournisseur: string;
  date_traitement: string;
  num_lettre: string;
  num_vehicule: string;
  num_bl: string;
  num_commande: string[];
  code_entrepot: string[];
  entrepot_admin: string;
  date_livraison: string;
  code_societe: string;
  document_filename: string;
  lot_numerisation: string;

  constructor(
    _categorie: string, 
    _code_type: string, 
    _code_sous_type: string, 
    _code_fournisseur: string, 
    _date_traitement: string, 
    _num_lettre: string, 
    _num_vehicule: string, 
    _num_bl: string, 
    _num_commande: string[], 
    _code_entrepot: string[], 
    _entrepot_admin: string, 
    _date_livraison: string, 
    _code_societe: string, 
    _document_filename: string,
    _lot_numerisation: string
  ) {
    this.categorie = _categorie;
    this.code_type = _code_type;
    this.code_sous_type = _code_sous_type;
    this.code_fournisseur = _code_fournisseur;
    this.date_traitement =  _date_traitement;
    this.num_lettre = _num_lettre;
    this.num_vehicule = _num_vehicule;
    this.num_bl = _num_bl;
    this.num_commande = _num_commande;
    this.code_entrepot = _code_entrepot;
    this.entrepot_admin = _entrepot_admin;
    this.date_livraison = _date_livraison;
    this.code_societe = _code_societe;
    this.document_filename = _document_filename;
    this.lot_numerisation = _lot_numerisation;
  }

  addNumCommande(_num_commande: string | string[]) {
    this.num_commande = this.num_commande.concat(_num_commande)
  }

  addCodeEntrepot(_code_entrepot: string | string[]) {
    this.code_entrepot = this.code_entrepot.concat(_code_entrepot)
  }
}