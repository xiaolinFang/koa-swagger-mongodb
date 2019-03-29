import { SwaggerRouter } from '../../dist';

const router = new SwaggerRouter();

// swagger docs avaliable at http://localhost:3000/api/swagger-html
router.swagger({

  // Pro-cli 是一款自动化项目构建框架，通过数据库建表形式，自动生成api数据接口、后台管理系统、前端统一API、初始化WEB、h5、app、小程序等前端应用，帮助企业快速搭建项目，节省80%资源及成本。
  // Pro-cli is an automated project construction framework. It automatically generates api data interfaces, background management systems, front-end unified APIs, and initializes front-end applications such as WEB, h5, app, and applets through database construction forms to help enterprises quickly build projects. Save 80% of resources and costs.

  title: 'Pro-cli api docs',
  description: `Pro-cli是一个自动化的项目构建框架。自动生成api数据接口、后台管理系统、前端统一api，通过数据库构建表单初始化WEB、h5、app、小程序等前端应用，帮助企业快速构建项目。节省80%的资源和成本。（Pro-cli is an automated project construction framework. It automatically generates api data interfaces, background management systems, front-end unified APIs, and initializes front-end applications such as WEB, h5, app, and applets through database construction forms to help enterprises quickly build projects. Save 80% of resources and costs.）`,
  version: '1.0.0',

  // [optional] default is root path.
  prefix: '/api',

  // [optional] default is /swagger-html
  swaggerHtmlEndpoint: '/swagger-html',

  // [optional] default is /swagger-json
  swaggerJsonEndpoint: '/swagger-json',

  // [optional] additional options for building swagger doc
  // eg. add api_key as shown below
  swaggerOptions: {
    securityDefinitions: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'Authorization'
      }
    }
  }
});

// mapDir will scan the input dir, and automatically call router.map to all Router Class
router.mapDir(__dirname, {
  // default: true. To recursively scan the dir to make router. If false, will not scan subroutes dir
  // recursive: true,
  // default: true, if true, you can call ctx.validatedBody[Query|Params] to get validated data.
  // doValidation: true,
});

export default router;
