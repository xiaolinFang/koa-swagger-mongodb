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
  'lookat'
    .toLowerCase()
    .replace('lookat'.charAt(0), 'lookat'.charAt(0).toUpperCase())
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
export default class lookat {
  // 增
  @request('POST', '/lookat/add')
  @summary('add lookat')
  @description('add a lookat')
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
    params.houses.map((el) => {
      el._id = dbClient.getObjectId(el._id);
      // return el;
    });
    params._customerId = dbClient.getObjectId(params._customerId);
    if (params.withManage && params.withManage.length) {
      params.withManage.map((el) => {
        el._id = dbClient.getObjectId(el._id);
      });
    }
    const result = await dbClient.insert('lookat', params);
    ctx.body = {
      code: result.code,
      data: result.data.result,
      message: result.code === 200 ? '带看录入成功' : '带看录入失败'
    };
  }
  @request('post', '/lookat/search')
  @summary('房源详情搜索关联带看数据')
  @tag
  @body({})
  static async search(ctx) {
    const params = ctx.request.body;
    const filterData = [];
    if (!params._id) {
      ctx.body = {
        code: 400,
        message: '缺少必传参数'
      };
      return;
    }

    const result = await dbClient.find('lookat', {});
    if (result && result.data) {
      result.data.map((item) => {
        const hasSee = item.houses.some(_h => _h._id.toString() === params._id);

        if (hasSee) {
          filterData.push(item);
        }
      });
    }
    ctx.body = {
      code: result.code,
      data: filterData,
      count: filterData.length
    };
  }
  // 删
  @request('DELETE', '/lookat/delete')
  @summary('delete lookat by condition')
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
        const result = await dbClient.remove('lookat', paramsData);
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
  @request('Put', '/lookat/update')
  @summary('update lookat')
  @description('update a lookat')
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
    //     result = await dbClient.update('lookat',condition,postData)
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
  @request('get', '/lookat/find')
  @summary('lookat list / query by condition')
  @query(queryConditions)
  @tag
  static async getAll(ctx) {
    const params = ctx.request.query;
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
          'lookat',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('lookat', paramsData, filterConditions);
    ctx.body = result;
  }
}
