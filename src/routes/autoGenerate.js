import {
  request,
  summary,
  body,
  tags,
  query,
  middlewares,
  path,
  description
} from '../../dist';
import dbClient from '../middleware/db';
import fsReadWrite from '../public/js/createRouter';

const tag = tags(['autoGenerate']);
const collectionParams = {
  name: {
    type: 'string',
    require: true,
    description: 'Collection name',
    default: ''
  }
};
const CollectName = {
  name: {
    type: 'string',
    require: true,
    description: 'collection name'
  }
};

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};

export default class autoGenerate {
  @request('POST', '/autoGenerate/add')
  @summary('通过传入的name添加api Router文件')
  // @description('创建数据集合及定义字段，字段名称与显示名称将存放在collectConfig 集合中，用作后期显示，程序将自动在数据库中添加该集合，')
  @tag
  //  @middlewares([logTime()])
  @body(collectionParams)
  static async add(ctx, next) {
    const params = ctx.request.body;
    let result = {};

    const collectionObj = {
      name: params.name
    };
    // let checkCollectionByName = await dbClient.find('collectConfig',{ name: params.name })

    // if(checkCollectionByName.data.length){
    //   throw Error(`The data set '${params.name}' already exists`)
    //   return
    // }
    // if(params.name == 'collectConfig'){
    //   throw Error('The collection  "collectConfig" keeps the name for the system; use another name')
    //   return
    // }

    const wirteSuccess = await fsReadWrite.createRouter(params.name);

    if (wirteSuccess) {
      // 原 记录所有api router
      // result = await dbClient.insert('collectConfig',collectionObj)
      result = {
        code: 200,
        message: 'create Router success'
      };
    }
    ctx.body = result;
  }

  // 删
  @request('Delete', '/autoGenerate/delete')
  @summary('delete the collection by name')
  @description('删除集合')
  @tag
  //  @middlewares([logTime()])
  @body(CollectName)
  static async deleteCollection(ctx) {
    const params = ctx.request.body;
    let result = {};

    const checkCollectionByName = await dbClient.find('collectConfig', {
      name: params.name
    });

    if (!checkCollectionByName.data.length) {
      throw Error(`The collection '${params.name}' does not exist`);
    }
    result = await dbClient.remove('collectConfig', {
      name: params.name
    });
    // 删除router文件
    fsReadWrite.removeFile(`src/routes/generateRoutes/${params.name}.js`);

    ctx.body = result;
  }
}
