import { Element as XmlElement, ElementCompact, Attributes, js2xml } from "xml-js";
import { Data, DomotiOutputObject } from "./DomotiOutputObject.js";
import { DomotiCourrierOutputObject } from "./DomotiCourrierOutputObject.js";
import { DomotiInputObject, Image } from "./DomotiInputObject.js";
import { Domoti } from "./Domoti.js";

export class DomotiCourrier extends Domoti {

  translate(obj: XmlElement, filename: string): string {
    const rootElements: XmlElement[] | undefined = obj.elements;
    const outputObject: DomotiOutputObject = new DomotiCourrierOutputObject();
    const inputObject: DomotiInputObject = new DomotiInputObject();
    var img: Image;

    if (rootElements === undefined) {
      console.error('root null');
      return '';
    }

    const listFilename: string[] = filename.split(".")[0].split('-');
    
    outputObject.data.batch._attributes.name = listFilename[listFilename.length - 1];

    rootElements.forEach(image => {
      const imageElements: XmlElement[] | undefined = image.elements;

      if (imageElements === undefined) {
        return;
      }



      imageElements.forEach(field => {
        const fieldElement: XmlElement[] | undefined = field.elements;

        if (fieldElement === undefined) {
          return;
        }

        img = Object.assign({});

        fieldElement.forEach(attr => {
          const fieldAttributes: Attributes | undefined = attr.attributes;

          if (fieldAttributes === undefined) {
            return;
          }

          let value: string;
          switch (typeof fieldAttributes.value) {
            case 'string':
              value = fieldAttributes.value;
              break;
            case 'number':
              value = fieldAttributes.value.toString();
              break;
            default:
              value = '';
          }

          switch (fieldAttributes.name) {
            case ('UserName'):
              img.UserName = value;
              break;
            case ('Provenance'):
              img.Provenance = value;
              break;
            case ('Enseigne'):
              img.Enseigne = value;
              break;
            case ('document'):
              img.document = value;
              break;
            case ('Image Filename'):
              img.Image_Filename = value;
              break;
            case ('path'):
              img.path = value;
              break;
            case ('Image height'):
              img.Image_height = value;
              break;
            case ('Image width'):
              img.Image_width = value;
              break;
            default:
              console.log('Attribut non traité dans ' + filename + ' : ' + fieldAttributes.name + '(valeur=' + value + ')');
          }
        });

        inputObject.addImage(img);
      });
    });

    //Ici, inputObject est censé être complet
    const data: Data = outputObject.fill(inputObject.imageList);
    const xml = js2xml(data, { compact: true });
    return xml;
  }

}