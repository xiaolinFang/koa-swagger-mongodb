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
  'builds'
    .toLowerCase()
    .replace('builds'.charAt(0), 'builds'.charAt(0).toUpperCase())
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

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};
export default class builds {
  // 增
  @request('POST', '/builds/add')
  @summary('add builds')
  @description('add a builds')
  @tag
  //  @middlewares([logTime()])
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
    const result = await dbClient.insert('builds', params);
    ctx.body = result;
  }
  // 删
  @request('DELETE', '/builds/delete')
  @summary('delete builds by condition')
  @tag
  @body({})
  // @path({ id: { type: 'string', required: true } })
  static async deleteMany(ctx) {
    const params = ctx.request.body;
    if (!params._id) {
      ctx.body = {
        code: 400,
        message: '缺少必要参数'
      };
      return;
    }

    const _postParams = {
      _id: dbClient.getObjectId(params._id)
    };
    const result = await dbClient.remove('builds', _postParams);
    ctx.body = result;
  }
  // 改
  @request('Put', '/builds/update')
  @summary('update builds')
  @description('update a builds')
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
    }
    const condition = {
      _id: dbClient.getObjectId(params._id)
    };
    const json = {};

    Object.keys(params).map((key) => {
      if (key !== '_id' && params[key]) {
        json[key] = params[key];
      }
    });
    const result = await dbClient.update('builds', condition, json);
    ctx.body = {
      code: result.code,
      data: result.result,
      message: result.result.nModified >= 1 ? '上传成功' : '上传失败'
    };

    // if (params.json !== undefined && params.condition !== undefined) {
    //   try {
    //     delete params.json._id;
    //     condition._id = dbClient.getObjectId(params.condition._id);
    //     result = await dbClient.update('config', condition, params.json);
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
  // search
  @request('post', '/builds/search')
  @summary('新建楼盘时校验')
  @body({})
  @tag
  static async search(ctx) {
    const params = ctx.request.body;
    const sort = {
      time: -1
    };

    const result = await dbClient.find('builds', params, {}, 1, 20, sort);
    ctx.body = result;
  }
  // 查
  @request('post', '/builds/find')
  @summary('builds list / query by condition')
  @body({})
  @tag
  static async find(ctx) {
    const params = ctx.request.body;
    const filterConditions = {};
    const paramsData = {};

    if (params.keyword) {
      paramsData.name = new RegExp(params.keyword);
    }
    if (params.region && params.region.length) {
      if (params.region[0] && !params.region[1]) {
        paramsData.area = params.region[0];
      }
      if (params.region[0] && params.region[1]) {
        paramsData.region = params.region;
        // paramsData.area = params.region[0];
        // paramsData.county = params.region[1];
      }
    }
    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'builds',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('builds', paramsData, filterConditions);
    result.data = result.data.reverse();

    // result.data.sort(-1);
    ctx.body = result;
  }
  @request('post', '/builds/detail')
  @summary('楼盘详情')
  @body({})
  @tag
  static async detail(ctx) {
    const params = ctx.request.body;
    if (!params._id) {
      ctx.body = {
        code: 400,
        message: '确实必要参数'
      };
      return;
    }
    params._id = dbClient.getObjectId(params._id);
    const aggregate = [
      {
        $match: params
      },
      {
        $lookup: {
          from: 'house',
          localField: '_id',
          foreignField: 'buildinfo._id',
          as: 'houses'
        }
      }
    ];
    const result = await dbClient.aggregate('builds', aggregate);
    ctx.body = result;
  }
  // 列表关联查询房源信息
  @request('post', '/builds/list')
  @summary('builds list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const _params = ctx.request.body;
    const paramsData = {};

    const page = _params.page || 1;
    const pageSize = _params.pageSize || 10;
    Object.keys(_params).map((key) => {
      if (key !== 'page' && key !== 'pageSize') {
        if (_params[key] && _params[key].length && key !== 'region') {
          paramsData[key] =
            key === 'keywrod' ? new RegExp(_params[key]) : _params[key];
        }
        if (_params.region && _params.region.length) {
          if (_params.region[0] && !_params.region[1]) {
            paramsData['region.0'] = _params.region[0];
          }
          if (_params.region[0] && _params.region[1]) {
            paramsData.region = _params.region;
          }
        }
      }
    });
    const postAggregate = [
      {
        $skip: (page - 1) * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $match: paramsData
      },
      {
        $lookup: {
          from: 'house',
          localField: '_id',
          foreignField: 'buildinfo._id',
          as: 'houses'
        }
      },
      {
        $sort: {
          time: -1
        }
      }
    ];
    // console.log(requestCount);
    const result = await dbClient.aggregate('builds', postAggregate);

    const data = result.data.map((_item) => {
      if (_item.houses.length) {
        _item.houses = _item.houses.map(_house => ({
          _id: _house._id,
          area: _house.area,
          imgs: _house.imgs
        }));
      }
      return _item;
    });
    ctx.body = {
      code: result.code,
      data,
      count: result.count,
      message: result.message
    };
  }
}
