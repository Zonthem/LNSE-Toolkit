export type Image = {
  UserName?: string,
  Provenance?: string,
  Enseigne?: string,
  document?: string,
  code_client?: string,
  Code_Avantage?: string,
  Cheque?: string,
  Image_Filename?: string,
  path?: string,
  Image_height?: string,
  Image_width?: string
}

export class DomotiInputObject {

  imageList: Image[];

  constructor() {
    this.imageList = [];
  }

  addImage(img: Image) {
    this.imageList.push(img);
  }

}