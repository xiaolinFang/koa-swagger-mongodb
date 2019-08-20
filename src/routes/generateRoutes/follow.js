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
// .toUpperCase()
const tag = tags([
  'follow'
    .toLowerCase()
    .replace('follow'.charAt(0), 'follow'.charAt(0).toUpperCase())
]);

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

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};
export default class follow {
  // 增
  @request('POST', '/follow/add')
  @summary('add follow')
  @description('add a follow')
  @tag
  @middlewares([logTime()])
  @body({})
  static async add(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少添加数据'
      };
      return;
    }
    if (params.obj._id) {
      params.obj._id = dbClient.getObjectId(params.obj._id);
    }
    console.log(params, '/params');

    const result = await dbClient.insert('follow', params);
    ctx.body = {
      code: result.code,
      data: result.data.result,
      message: result.code === 200 ? '保存成功' : '保存失败'
    };
  }
  // 删
  @request('DELETE', '/follow/delete')
  @summary('delete follow by condition')
  @tag
  @body({})
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
        const result = await dbClient.remove('follow', paramsData);
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
  @request('Put', '/follow/update')
  @summary('update follow')
  @description('update a follow')
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
    //     result = await dbClient.update('follow',condition,postData)
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
  @request('post', '/follow/list')
  @summary('list follows by obj._id')
  @body({})
  @tag
  static async getlist(ctx) {
    const params = ctx.request.body;
    const postParams = {};
    Object.keys(params).map((key) => {
      if (key !== 'page' && key !== 'pageSize') {
        if (key === 'obj._id') {
          postParams['obj._id'] = dbClient.getObjectId(params[key]);
        } else {
          postParams[key] = params[key];
        }
      }
    });
    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'follow',
          postParams,
          {},
          params.page,
          params.pageSize
        )
        : await dbClient.find('follow', postParams, {});

    ctx.body = result;
  }
  // 查
  @request('post', '/follow/find')
  @summary('follow list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    const filterConditions = {};
    const paramsData = {};
    Object.keys(params).map((key) => {
      if (key !== 'page' && key !== 'pageSize') {
        paramsData[key] = params[key];
      }
    });
    if (paramsData._id) {
      paramsData._id = dbClient.getObjectId(paramsData._id);
    }

    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'follow',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('follow', paramsData, filterConditions);
    ctx.body = result;
  }
}
