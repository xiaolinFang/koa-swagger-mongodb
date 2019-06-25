import formidable from 'koa-formidable';
import fs from 'fs';
import path from 'path';
import {
  base64encode
}
  from 'nodejs-base64';
import {
  request,
  summary,
  tags,
  description
} from '../../dist';

const tag = tags(['Help']);
const mkdirs = (dirname) => {
  fs.exists(dirname, (exists) => {
    if (exists) {
      return;
    }
    mkdirs(path.dirname(dirname), () => {
      fs.mkdir(dirname);
    });
  });
};
export default class Help {
    @request('post', '/uploads')
    @summary('Download and save files')
    @description('help apis')
    @tag
  static async uploads(ctx) {
    // TODO  根据传入的二级目录创建文件夹并存放文件
    const form = formidable.parse(ctx.request);
    form.encoding = 'utf-8';
    form.keepExtensions = true; // 保留后缀
    mkdirs('public/uploads');
    const upload = new Promise((resolve) => {
      form((opt, {
        files
      }) => {
        const filename = files.file.name;
        const uploadDir = 'public/uploads/';
        const prename = filename.slice(0, filename.indexOf('.'));
        const lastname = filename.slice(filename.indexOf('.'), filename.length);
        const avatarName = `${Date.now()}_${base64encode(prename)}${lastname}`;

        const readStream = fs.createReadStream(files.file.path);
        const writeStream = fs.createWriteStream(uploadDir + avatarName);
        readStream.pipe(writeStream);
        resolve(`/uploads/${avatarName}`);
        // /public/upload/1513523744257_WX20171205-150757.png
      });
    });

    const url = await upload;
    ctx.body = {
      code: 200,
      msg: 'success',
      url
    };
  }
}
