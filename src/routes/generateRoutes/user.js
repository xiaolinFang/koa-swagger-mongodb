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
  @body({})
  static async register(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少添加数据'
      };
      return;
    }
    // todo 验证 手机号 登陆账号是否存在

    const result = await dbClient.insert('user', params);
    let message = '';

    if (result.code === 200) {
      message = '添加成功';
    } else {
      message = '添加失败';
    }
    ctx.body = {
      code: result.code,
      message
    };
  }
  // 删
  @request('DELETE', '/user/delete')
  @summary('delete user by condition')
  @tag
  @body(bodyConditions)
  // @path({ id: { type: 'string', required: true } })
  static async deleteMany(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少必要参数'
      };
      return;
    }

    if (params._id) {
      params._id = dbClient.getObjectId(params._id);
    }
    const result = await dbClient.remove('user', params);
    ctx.body = result;
  }
  // 改
  @request('Put', '/user/update')
  @summary('update user')
  @description('update a user')
  @tag
  @middlewares([logTime()])
  @body(upDateJson)
  static async updateData(ctx) {
    const params = ctx.request.body;
    if (!params.condition || !params.json) {
      ctx.body = {
        code: 400,
        message: '缺少必传参数'
      };
      return;
    }

    params.condition._id = dbClient.getObjectId(params.condition._id);
    const result = await dbClient.update('user', params.condition, params.json);
    if (result.result && result.result.nModified && result.result.ok) {
      ctx.body = {
        code: 200,
        message: '保存成功'
      };
    } else {
      ctx.body = {
        code: 500,
        message: '更新失败'
      };
    }
  }
  @request('post', '/user/list')
  @summary('查询用户列表')
  @body({})
  @tag
  static async getlist(ctx) {
    const params = ctx.request.body;

    const paramsData = {};
    Object.keys(params).map((el) => {
      if (el === '_id') paramsData[el] = dbClient.getObjectId(params[el]);
      else if (el !== 'page' && el !== 'pageSize') paramsData[el] = params[el];
    });
    // if (params._id) params._id = dbClient.getObjectId(params._id);
    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'user',
          paramsData,
          {},
          params.page,
          params.pageSize
        )
        : await dbClient.find('user', paramsData, {});
    // ctx.body = result;
    // 过滤 返回字段
    const data = [];
    result.data.map((user) => {
      if (user.status === 1) {
        data.push({
          called: user.called,
          name: user.name,
          phone: user.phone,
          status: user.status,
          _id: user._id,
          avatar: user.avatar || '',
          time: user.time || '',
          introduction: user.introduction
        });
      }
    });
    ctx.body = {
      code: result.code,
      data
    };
  }
  // 查
  @request('post', '/user/find')
  @summary('user list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    const filterConditions = {};
    const paramsData = {};
    Object.keys(params).map((el) => {
      if (el !== 'page' && el !== 'pageSize' && params[el]) {
        paramsData[el] = params[el];
      }
    });

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
  @body({})
  @tag
  static async login(ctx) {
    const params = ctx.request.body;

    if (params.name && params.password) {
      const result = await dbClient.find('user', params);
      if (result.data.length && result.data[0].status !== 1) {
        ctx.body = {
          code: 500,
          message: '账号状态异常，请联系管理员'
        };
        return;
      }
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
