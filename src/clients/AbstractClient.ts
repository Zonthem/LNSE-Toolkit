import * as fs from "fs";
import path from "path";

export abstract class Client {

  writeFile(_path: string, contents: string, cb?: fs.WriteFileOptions) {
    try {
      fs.mkdirSync(path.dirname(_path), { recursive: true});
      fs.writeFileSync(_path, contents, cb);
    } catch (e) {
      console.error('Problème d\'écriture sur ' + _path + ' : ' + e)
    }
  }

}