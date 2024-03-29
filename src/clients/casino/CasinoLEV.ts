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
  date_desactivation: string;

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
    _lot_numerisation: string,
    _date_desactivation: string
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
    this.date_desactivation = _date_desactivation;
  }

  addNumCommande(_num_commande: string | string[]) {
    if (Array.isArray(_num_commande)) {
      _num_commande.forEach(num => {
        if (this.num_commande.includes(num)) return;
        this.num_commande.push(num)
      })
    } else {
      if (this.num_commande.includes(_num_commande)) return;
      this.num_commande.push(_num_commande)
    }
  }

  addCodeEntrepot(_code_entrepot: string | string[]) {
    if (Array.isArray(_code_entrepot)) {
      _code_entrepot.forEach(code => {
        if (this.code_entrepot.includes(code)) return;
        this.code_entrepot.push(code)
      })
    } else {
      if (this.code_entrepot.includes(_code_entrepot)) return;
      this.code_entrepot.push(_code_entrepot)
    }
  }

  /**
   * set la date_desactivation pour ce LEV
   * @param _date nouvelle date
   * @returns true si la date est différente (non modifiée, règle métier), false si l'ancienne était vide ou si la date est restée identique
   */
  addDateDesactivation(_date: string): boolean {
    if (this.date_desactivation === "" || this.date_desactivation === _date) {
      this.date_desactivation = _date;
      return false;
    } else {
      return true;
    }
  }

  addEntrepotAdmin(_entrepot_admin: string) {
    this.entrepot_admin = _entrepot_admin;
  }
}