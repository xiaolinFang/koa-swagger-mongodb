import fs from 'fs';
import path from 'path';

const hostdir = './public/uploads/';
export default class Common {
  static mkdir(dirname) {
    dirname = hostdir + dirname;
    if (fs.existsSync(dirname)) {
      return true;
    }
    if (this.mkdir(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
    return false;
  }
}
