import fs from 'fs';

export default {
  async createRouter(name) {
    let newRouterFile = '';
    let fileStr = '';
    const count = 0;
    const isSuccess = false;

    return new Promise((resolve, reject) => {
      // 读取tempRouter
      const fileReadStream = fs.createReadStream('src/public/js/tempRouter.js');

      fileReadStream.on('data', (chunk) => {
        // console.log(`${ ++count } 接收到：${chunk.length}`)
        fileStr += chunk;
      });
      fileReadStream.on('error', (error) => {
        reject(isSuccess);
        throw Error('read router template fail');
      });

      fileReadStream.on('end', () => {
        newRouterFile = fileStr.replace(/RouteName/gi, name);

        const writerStream = fs.createWriteStream(`src/routes/generateRoutes/${name}.js`);
        fileReadStream.pipe(writerStream);

        // 读取tempRouter 成功后，将路由模板写入新路由文件
        writerStream.write(newRouterFile, 'UTF8');

        // 标记文件末尾
        writerStream.end();

        // 处理流事件 --> finish 事件
        writerStream.on('finish', () => {
          /* finish - 所有数据已被写入到底层系统时触发。 */
          // console.log('写入成功');
          resolve(!isSuccess);
        });

        writerStream.on('error', (err) => {
          // console.log(err.stack)
          reject(isSuccess);
          throw Error('create new router fail');
        });
      });
    });
  },
  async removeFile(path) {
    const successful = false;
    return new Promise((resolve, reject) => {
      fs.unlink(path, (error) => {
        if (error) {
          reject(successful);
          throw Error('remove router file fail');
        } else {
          resolve(!successful);
        }
      });
    });
  }
};
