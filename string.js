import {
  request,
  summary,
  body,
  tags,
  middlewares,
  path,
  description,
  query
} from '../../dist';
import dbClient from '../middleware/db';

const RouteName = 'string';
const RouteTarget = RouteName.toLowerCase().replace(
  RouteName.charAt(0),
  RouteName.charAt(0).toUpperCase()
);
// .toUpperCase()
const tag = tags([RouteTarget]);

const bodyConditions = {
  // jsonStr 是一条数据记录json 字符串对象，用于对数据集合的增、删、改、查时，分别作为，插入数据、删除条件、修改条件、查询条件json字符串对象传入
  // JsonStr is a data record json string object, which is used to add, delete, change, and check the data set, respectively as, insert data, delete condition, modify condition, and query condition json string object passed in
  jsonStr: { type: 'object', description: 'json 字符串' }
};
const upDateJson = {
  condition: {
    type: 'object',
    require: 'true',
    description: 'Update the conditional json string'
  },
  jsonStr: {
    type: 'object',
    require: 'true',
    description: 'Update the data json string'
  }
};
const queryConditions = {
  jsonStr: { type: 'string', description: 'a jsons data string or condition' }
  // showFileds: { type: 'string', description: 'Display field condition'}
};

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};
export default class {
  // 增
  @request('POST', `/${RouteName}/add${RouteTarget}`)
  @summary(`add ${RouteName}`)
  @description(`add a ${RouteName}`)
  @tag
  @middlewares([logTime()])
  @body(bodyConditions)
  static async register(ctx, next) {
    const params = ctx.request.body;
    let postData = {};
    let result = {};
    if (params.jsonStr !== undefined) {
      try {
        postData =
          typeof params.jsonStr === 'string'
            ? JSON.parse(params.jsonStr)
            : params.jsonStr;
        result = await dbClient.insert(RouteName, postData);
      } catch (e) {
        console.log(e);
        throw Error('Jsonstr is not a json string');
      }
      ctx.body = result;
    } else {
      ctx.body = {
        code: 500,
        message: 'jsonStr undefined'
      };
    }
  }
  // 删
  @request('DELETE', `/${RouteName}`)
  @summary(`delete ${RouteName} by condition`)
  @tag
  @body(bodyConditions)
  // @path({ id: { type: 'string', required: true } })
  static async deleteOne(ctx) {
    const params = ctx.request.body;
    let paramsData = {};
    if (params.jsonStr !== undefined) {
      try {
        paramsData =
          typeof params.jsonStr === 'string'
            ? JSON.parse(params.jsonStr)
            : params.jsonStr;
        if (paramsData._id) {
          paramsData._id = dbClient.getObjectId(paramsData._id);
        }
        const result = await dbClient.remove(RouteName, paramsData);
        ctx.body = result;
      } catch (e) {
        // console.log('Jsonstr is not a json string',e)
        throw Error('Jsonstr is not a json string');
      }
    } else {
      ctx.body = {
        code: 500,
        message: 'Jsonstr is undefined'
      };
    }
  }
  // 改
  @request('Put', `/${RouteName}/update`)
  @summary(`update ${RouteName}`)
  @description(`update a ${RouteName}`)
  @tag
  @middlewares([logTime()])
  @body(upDateJson)
  static async updateData(ctx, next) {
    const params = ctx.request.body;
    let condition = {};
    let postData = {};
    let result = {};
    if (params.condition !== undefined && params.jsonStr !== undefined) {
      try {
        condition =
          typeof params.condition === 'string'
            ? JSON.parse(params.condition)
            : params.condition;
        postData =
          typeof params.jsonStr === 'string'
            ? JSON.parse(params.jsonStr)
            : params.jsonStr;
        result = await dbClient.update(RouteName, condition, postData);
      } catch (e) {
        console.log(e);
        throw Error('Jsonstr is not a json string');
      }
      ctx.body = result;
    } else {
      ctx.body = {
        code: 500,
        message: params.condition
          ? 'jsonStr undefined'
          : params.jsonStr
            ? 'condition json string undefined'
            : ' condition and jsonStr json string all undefined or {}'
      };
    }
  }
  // 查
  @request('get', `/${RouteName}`)
  @summary(`${RouteName} list / query by condition`)
  @query(queryConditions)
  @tag
  static async getAll(ctx) {
    const params = ctx.request.query;
    const fieldsStatus = {};
    let paramsData = {};
    if (params.jsonStr && params.jsonStr !== undefined) {
      try {
        paramsData = JSON.parse(params.jsonStr);
        // fieldsStatus = JSON.parse(params.showFileds)
      } catch (e) {
        throw Error('Jsonstr is not a json string');
      }
    }
    if (paramsData._id) {
      paramsData._id = dbClient.getObjectId(paramsData._id);
    }
    const result = await dbClient.find(RouteName, paramsData);
    ctx.body = result;
  }
}
