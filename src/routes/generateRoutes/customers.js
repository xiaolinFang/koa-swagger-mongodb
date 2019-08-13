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
  'customers'
    .toLowerCase()
    .replace('customers'.charAt(0), 'customers'.charAt(0).toUpperCase())
]);

const bodyConditions = {
  // jsonStr 是一条数据记录json 字符串对象，用于对数据集合的增、删、改、查时，分别作为，插入数据、删除条件、修改条件、查询条件json字符串对象传入
  // JsonStr is a data record json string object, which is used to add, delete, change, and check the data set, respectively as, insert data, delete condition, modify condition, and query condition json string object passed in
  jsonStr: {
    type: 'object',
    description: 'json 字符串'
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
export default class customers {
  // 增
  @request('POST', '/customers/add')
  @summary('add customers')
  @description('add a customers')
  @tag
  @middlewares([logTime()])
  static async add(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少添加数据'
      };
      return;
    }
    const result = await dbClient.insert('customers', params);
    ctx.body = result;
  }
  // 删
  @request('DELETE', '/customers/delete')
  @summary('delete customers by condition')
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
        const result = await dbClient.remove('customers', paramsData);
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
  @request('Put', '/customers/updatefollow')
  @summary('update customers')
  @description('update a customers')
  @tag
  @middlewares([logTime()])
  @body({})
  static async updateData(ctx) {
    const params = ctx.request.body;
    // const condition = {};

    // let result = {};
    if (!Object.keys(params).length || !params._id) {
      ctx.body = {
        code: 400,
        message: '缺少必要参数'
      };
      return;
    }
    const upJson = {
      $addToSet: {
        follows: {
          author: params.author,
          desc: params.desc
        }
      }
    };

    const result = await dbClient.upCustomers(
      'customers',
      {
        _id: dbClient.getObjectId(params._id)
      },
      upJson
    );
    ctx.body = result.result;
  }
  // 查
  @request('post', '/customers/find')
  @summary('customers list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    const filterConditions = {};
    const paramsData = {};

    if (params._id) {
      paramsData._id = dbClient.getObjectId(params._id);
    }
    Object.keys(params).map((key) => {
      if (
        key !== '_id' &&
        key !== 'page' &&
        key !== 'pageSize' &&
        params[key]
      ) {
        paramsData[key] = params[key];
      }
    });

    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'customers',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('customers', paramsData, filterConditions);

    ctx.body = result;
  }
}
