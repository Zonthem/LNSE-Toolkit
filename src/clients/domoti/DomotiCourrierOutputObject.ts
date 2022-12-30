import { Image } from "./DomotiInputObject.js";
import { Data, Document, DomotiOutputObject, Page } from "./DomotiOutputObject.js";

export class DomotiCourrierOutputObject extends DomotiOutputObject {
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

      var page : Page | undefined = doc.page.find(p => p._attributes.name === image.Image_Filename);
      if (!page) {
        //coupe le nom du fichier de "truc.aze" à "truc"
        //ATTENTION : marche pas si le nom du fichier est "truc.machin.pdf" parce que y'a un "." de trop
        let imageName: string = image.Image_Filename!.split('.')[0];
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