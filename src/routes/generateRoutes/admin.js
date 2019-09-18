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
  'admin'
    .toLowerCase()
    .replace('admin'.charAt(0), 'admin'.charAt(0).toUpperCase())
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
  jsonStr: {
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
const loginParams = {
  name: {
    type: 'string',
    description: 'user name'
  },
  password: {
    type: 'string',
    description: 'user password'
  }
};

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};
export default class admin {
  // 增
  @request('POST', '/admin/add')
  @summary('add admin')
  @description('add a admin')
  @tag
  //  @middlewares([logTime()])
  // @body(bodyConditions)
  static async register(ctx, next) {
    const params = ctx.request.body;
    const postData = {};
    let result = {};
    const check = await dbClient.find('admin', {
      name: params.name
    });
    if (check.data.length) {
      ctx.body = {
        code: 500,
        message: `管理员 ${params.name} 已存在`
      };
      return;
    }
    try {
      result = await dbClient.insert('admin', params);
    } catch (e) {
      throw Error(e);
    }
    console.log(result);
    ctx.body = result;
    // if(params.jsonStr !== undefined){
    //   try {
    //     postData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
    //     result = await dbClient.insert('admin',postData)
    //   } catch (e) {
    //     console.log(e);
    //     throw Error('Jsonstr is not a json string')
    //   }
    //   ctx.body = result
    // }else{
    //   ctx.body = {
    //     code: 500,
    //     message: 'jsonStr undefined'
    //   }
    //   return
    // }
  }
  // 删
  @request('DELETE', '/admin/delete')
  @summary('delete admin by ObjectId')
  @tag
  @body({})
  // @path({ id: { type: 'string', required: true } })
  static async deleteMany(ctx) {
    const params = ctx.request.body;
    const paramsData = {};
    if (params._id) {
      try {
        // paramsData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
        // if(paramsData['_id']){
        //   paramsData._id = dbClient.getObjectId(paramsData['_id'])
        // }
        paramsData._id = dbClient.getObjectId(params._id);
        const result = await dbClient.remove('admin', paramsData);
        ctx.body = result;
      } catch (e) {
        // console.log('Jsonstr is not a json string',e)
        throw Error(e);
      }
    } else {
      ctx.body = {
        code: 400,
        message: '_id is undefined'
      };
    }
  }
  // 改
  @request('Put', '/admin/update')
  @summary('update admin')
  @description('update a admin')
  @tag
  //  @middlewares([logTime()])
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
        result = await dbClient.update('admin', condition, postData);
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
  @request('get', '/admin/find')
  @summary('admin list / query by condition')
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
          'admin',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('admin', paramsData, filterConditions);
    ctx.body = result;
  }
  /**
   * 登陆
   */
  @request('post', '/admin/login')
  @summary('admins user login')
  @tag
  @body(loginParams)
  static async findOne(ctx) {
    const params = ctx.request.body;
    // console.log(ctx.request.header.Authorization, '///');
    const result = await dbClient.find('admin', params);
    let response = {
      login: false,
      message: '登陆失败，请检查账号/密码是否正确'
    };
    const data = result.data;
    if (data.length) {
      response = {
        name: data[0].name,
        login: true,
        uid: data[0]._id,
        token: data[0]._id,
        power: data[0].power
      };
    }
    ctx.body = response;
  }
}
