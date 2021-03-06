import Router from 'koa-router';


import ApiRouter from './api';

const router = new Router();

router.use('/api', ApiRouter.routes());
router.get('/', (ctx) => {
  ctx.body = `Quickly get started with the pro-cli
  swagger-router: /api/swagger-html`;
});


export default router;
