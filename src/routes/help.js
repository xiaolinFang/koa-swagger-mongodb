import formidable from 'koa-formidable';
import fs from 'fs';
import path from 'path';
import { base64encode } from 'nodejs-base64';
import { request, summary, tags, description } from '../../dist';

const tag = tags(['Help']);
const mkdirsFunc = (dirname) => {
  if (fs.existsSync(dirname)) {
    return true;
  }
  if (mkdirsFunc(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
    return true;
  }
};
export default class Help {
  @request('post', '/uploads')
  @summary('upload and save files')
  @description('help apis')
  @tag
  static async uploads(ctx) {
    // TODO  根据传入的二级目录创建文件夹并存放文件
    const form = formidable.parse(ctx.request);
    form.encoding = 'utf-8';
    form.keepExtensions = true; // 保留后缀

    const upload = new Promise((resolve) => {
      form((opt, { fields, files }) => {
        console.log(fields, files, '//');

        if (!fields.type || !fields.dir) {
          ctx.body = {
            code: 400,
            message: ' type and dir is required'
          };
          return;
        }
        const uploadDir = `public/uploads/${fields.type}/${fields.dir}/`;

        mkdirsFunc(uploadDir);

        const filename = files.file.name;
        const prename = filename.slice(0, filename.indexOf('.'));
        const lastname = filename.slice(filename.indexOf('.'), filename.length);
        const avatarName = `${Date.now()}_${base64encode(prename)}${lastname}`;

        if (lastname.indexOf('exe') !== -1) return;
        const readStream = fs.createReadStream(files.file.path);
        const writeStream = fs.createWriteStream(uploadDir + avatarName);
        readStream.pipe(writeStream);
        resolve(`/uploads/${fields.type}/${fields.dir}/${avatarName}`);
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
  @request('post', '/removeFile')
  @tag
  @summary('根据路径删除文件')
  @description('help apis')
  static async removefile(ctx) {
    const params = ctx.request.body;
    const path = params.path;
    console.log(path, '/path');
  }
}
