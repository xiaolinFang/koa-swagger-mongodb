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
  'offices'
    .toLowerCase()
    .replace('offices'.charAt(0), 'offices'.charAt(0).toUpperCase())
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

const _checkFloorLocked = dbData =>
  dbData.some((floor) => {
    if (floor.selected && floor.locked) {
      return true;
    }
    return floor.room.some(room => room.selected && room.locked);
  });
export default class offices {
  // 增
  @request('POST', '/offices/add')
  @summary('add offices')
  @description('add a offices')
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
    const buildInfo = params.buildinfo;
    const builds = params.build;
    const getBuilds = await dbClient.find('builds', {
      _id: dbClient.getObjectId(buildInfo._id)
    });
    const dbBuildsData = getBuilds.data[0];

    // const checkHasLock = getBuilds.builds[]
    let haslocked = false;
    const _dbData = [];
    builds.map((build) => {
      console.log(build, '/build map');

      if (
        build.rindex !== undefined &&
        build.key !== undefined &&
        build.index !== undefined
      ) {
        // 房号
        const dbRoom = dbBuildsData.builds[build.index].floor[build.key].room;
        console.log(dbRoom, 'dbRoom');
      }
      if (
        build.rindex === undefined &&
        build.key !== undefined &&
        build.key !== ''
      ) {
        // 整层
        const dbFloor = dbBuildsData.builds[build.index].floor;
        haslocked = _checkFloorLocked(dbFloor);

        console.log(dbFloor, 'dbFloor');
      }
      if (build.rindex === undefined && build.key === undefined) {
        // 整栋
        const dbBuild = dbBuildsData.builds[build.index];
        console.log(dbBuild, 'dbBuild');
      }
    });

    if (!haslocked) {
      // false 没有被锁住的房号/楼层
      // todo
    }

    console.log(buildInfo, builds);

    // const result = await dbClient.insert('offices', params);
    // ctx.body = result;
  }
  // 删
  @request('DELETE', '/offices/delete')
  @summary('delete offices by condition')
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
        const result = await dbClient.remove('offices', paramsData);
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
  @request('Put', '/offices/update')
  @summary('update offices')
  @description('update a offices')
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
    //     result = await dbClient.update('offices',condition,postData)
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
  @request('get', '/offices/find')
  @summary('offices list / query by condition')
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
          'offices',
          paramsData,
          filterConditions,
          params.page,
          params.pageSize
        )
        : await dbClient.find('offices', paramsData, filterConditions);
    ctx.body = result;
  }
}
