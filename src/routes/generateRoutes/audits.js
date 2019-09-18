import {
  request,
  summary,
  body,
  tags,
  middlewares,
  description,
  query
} from '../../../dist';
import dbClient from '../../middleware/db';
// .toUpperCase()
const tag = tags([
  'audits'
    .toLowerCase()
    .replace('audits'.charAt(0), 'audits'.charAt(0).toUpperCase())
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
export default class audits {
  // 增
  @request('POST', '/audits/add')
  @summary('add audits')
  @description('add a audits')
  @tag
  //  @middlewares([logTime()])
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
    // 查询是否存在相同id的数据
    // const _checkHasDone = async () => {
    //   const json = {
    //     type: params.type
    //   };
    //   json['obj._id'] = params.obj._id;

    //   const hasdone = await dbClient.find('audits', json);
    //   console.log(hasdone, '/hasdone');

    //   if (hasdone.count && hasdone.data.length) {
    //     return true;
    //   }
    //   return false;
    // };
    // const find = await _checkHasDone();
    // if (!find) {
    const result = await dbClient.insert('audits', params);
    ctx.body = {
      code: result.code,
      data: result.data.result
    };
    // } else {
    //   ctx.body = {
    //     code: 500,
    //     message: 'success'
    //   };
    // }
  }
  // 删
  @request('DELETE', '/audits/delete')
  @summary('delete audits by condition')
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
        const result = await dbClient.remove('audits', paramsData);
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
  @request('Put', '/audits/update')
  @summary('update audits')
  @description('update a audits')
  @tag
  //  @middlewares([logTime()])
  @body({})
  static async updateData(ctx) {
    const params = ctx.request.body;

    if (!params._id) {
      ctx.body = {
        code: 400,
        message: '缺少必要参数'
      };
      return;
    }
    const condition = {
      _id: dbClient.getObjectId(params._id)
    };
    delete params._id;
    const result = await dbClient.update('audits', condition, params);
    ctx.body = {
      code: result.code,
      data: result.result,
      message: result.result.nModified >= 1 ? '修改成功' : '修改失败'
    };

    // if (params.json !== undefined && params.condition !== undefined) {
    //   try {
    //     delete params.json._id;
    //     condition._id = dbClient.getObjectId(params.condition._id);
    //   } catch (e) {
    //     // console.log(e);
    //     throw Error('jsonStr is not a json string ');
    //   }
    // } else {
    //   ctx.body = {
    //     code: 500,
    //     message: params.condition ?
    //       'jsonStr undefined' : params.json ?
    //         'condition json string undefined' : ' condition and jsonStr json string all undefined or {}'
    //   };
    // }
  }
  // 查
  @request('post', '/audits/find')
  @summary('audits list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    const filterConditions = {};
    const paramsData = {};
    Object.keys(params).map((el) => {
      if (el !== 'page' && el !== 'pageSize' && el !== '_id') {
        paramsData[el] = params[el];
      } else if (el === '_id') {
        paramsData[el] = dbClient.getObjectId(params[el]);
      }
    });
    const sort = {
      time: -1
    };

    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'audits',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize,
          sort
        )
        : await dbClient.find(
          'audits',
          paramsData,
          filterConditions,
          null,
          null,
          sort
        );
    ctx.body = result;
  }
}
