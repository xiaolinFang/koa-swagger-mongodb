import {
  request,
  summary,
  body,
  tags,
  middlewares,
  path,
  description,
  query
} from '../../../dist';
import dbClient from '../../middleware/db';
import { stat } from 'fs';
// .toUpperCase()
const tag = tags([
  'user'.toLowerCase().replace('user'.charAt(0), 'user'.charAt(0).toUpperCase())
]);

const bodyConditions = {
  // jsonStr 是一条数据记录json 字符串对象，用于对数据集合的增、删、改、查时，分别作为，插入数据、删除条件、修改条件、查询条件json字符串对象传入
  // JsonStr is a data record json string object, which is used to add, delete, change, and check the data set, respectively as, insert data, delete condition, modify condition, and query condition json string object passed in
  jsonStr: {
    type: 'object',
    description: 'json 字符串'
  }
};
const upDateJson = {
  condition: {
    type: 'object',
    require: 'true',
    description: 'Update the conditional json string'
  },
  json: {
    type: 'object',
    require: 'true',
    description: 'Update the data json string'
  }
};
const queryConditions = {
  jsonStr: {
    type: 'string',
    description: 'a jsons data string or condition'
  },
  page: {
    type: 'number',
    description: 'The current page number "Not set to query all"'
  },
  pageSize: {
    type: 'number',
    description: 'Number of data bars per page "Not set to show all"'
  },
  filterFileds: {
    type: 'string',
    description:
      '字段过滤条件 除_id 外，其他不同字段不能同时设置显示和隐藏，只能二选一'
  }
};
const token = {
  token: {
    type: 'string',
    require: true,
    description: '登录用户token'
  }
};

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};
export default class user {
  // 增
  @request('POST', '/user/add')
  @summary('add user')
  @description('add a user')
  @tag
  @middlewares([logTime()])
  @body(bodyConditions)
  static async register(ctx) {
    const params = ctx.request.body;
    let postData = {};
    let result = {};
    if (params.jsonStr !== undefined) {
      try {
        postData =
          typeof params.jsonStr === 'string'
            ? JSON.parse(params.jsonStr)
            : params.jsonStr;
        result = await dbClient.insert('user', postData);
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
  @request('DELETE', '/user/delete')
  @summary('delete user by condition')
  @tag
  @body(bodyConditions)
  // @path({ id: { type: 'string', required: true } })
  static async deleteMany(ctx) {
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
        const result = await dbClient.remove('user', paramsData);
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
  @request('Put', '/user/update')
  @summary('update user')
  @description('update a user')
  @tag
  @middlewares([logTime()])
  @body(upDateJson)
  static async updateData(ctx, next) {
    const params = ctx.request.body;
    const condition = {};
    const postData = {};
    let result = {};
    // if(params.condition !== undefined && params.jsonStr !== undefined){
    //   try {
    //     condition = typeof params.condition === 'string' ? JSON.parse(params.condition) : params.condition
    //     postData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
    //     result = await dbClient.update('user',condition,postData)
    //   } catch (e) {
    //     console.log(e);
    //     throw Error('Jsonstr is not a json string')
    //   }
    //   ctx.body = result
    // }
    if (params.json !== undefined && params.condition !== undefined) {
      try {
        delete params.json._id;
        condition._id = dbClient.getObjectId(params.condition._id);
        result = await dbClient.update('config', condition, params.json);
      } catch (e) {
        // console.log(e);
        throw Error('jsonStr is not a json string ');
      }
    } else {
      ctx.body = {
        code: 500,
        message: params.condition
          ? 'jsonStr undefined'
          : params.json
            ? 'condition json string undefined'
            : ' condition and jsonStr json string all undefined or {}'
      };
    }
  }
  // 查
  @request('post', '/user/find')
  @summary('user list / query by condition')
  @query(queryConditions)
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    console.log(params, '/geit params');

    let filterConditions = {};
    let paramsData = {};
    if (params.jsonStr && params.jsonStr !== undefined) {
      try {
        paramsData = JSON.parse(params.jsonStr);
      } catch (e) {
        throw Error('Jsonstr is not a json string');
      }
    }
    if (params.filterFileds) {
      filterConditions = JSON.parse(params.filterFileds);
    }
    if (paramsData._id) {
      paramsData._id = dbClient.getObjectId(paramsData._id);
    }
    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'user',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('user', paramsData, filterConditions);
    ctx.body = result;
  }
  // 用户登录
  @request('post', '/user/login')
  @summary('user login by name and password')
  @query(queryConditions)
  @tag
  static async login(ctx) {
    const params = ctx.request.body;
    if (params.name && params.password) {
      const result = await dbClient.find('user', params);
      ctx.body = result;
    } else {
      ctx.body = {
        code: 400,
        message: '缺少必填字段'
      };
    }
  }
  // 根据token （id）获取用户信息
  @request('get', '/user/info')
  @summary('根据用户id 查询用户信息')
  @query(token)
  @tag
  static async info(ctx) {
    const params = ctx.request.query;
    if (params.token) {
      const _id = dbClient.getObjectId(params.token);
      const result = await dbClient.find('user', {
        _id
      });
      ctx.body = result;
    } else {
      ctx.body = {
        code: 400,
        message: 'token 必传'
      };
    }
  }
}
