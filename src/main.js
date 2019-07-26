import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
// import cors from 'koa-cors';
// import convert from 'koa-convert';
// import koaBody from 'koa-body';
import serve from 'koa-static';

import config from './config';
import errorHandle from './middleware/errorHandle';
import router from './routes/index';

const app = new Koa();

app
  .use(bodyParser())
  .use(serve('./public'))
  .use(errorHandle())
  .use(router.routes())
  .use(router.allowedMethods());
// .use(koaBody({
//   multipart: true,
//   formidable: {
//     maxFieldsSize: 3 * 1024 * 1024,
//     multipart: true
//   }
// }));
// 实现跨域处理
// .use(convert(cors({
//   origin: 'http://localhost:3001', // 这个域名就是上传页面所部署的服务的域名，根据自己的场景做相应的调整
//   // exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
//   // maxAge: 5,
//   // credentials: true,
//   allowMethods: ['POST'],
//   allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
// })));

export default app.listen(config.port, () => {
  console.log(`App is listening on ${config.port}.`);
});
