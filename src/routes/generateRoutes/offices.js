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
import { resolve, reject } from '_any-promise@1.3.0@any-promise';
// .toUpperCase()
const tag = tags([
  'offices'
    .toLowerCase()
    .replace('offices'.charAt(0), 'offices'.charAt(0).toUpperCase())
]);

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};

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

    console.log(builds, '/builds');

    const dbBuildsData = getBuilds.data[0];
    // 检查是否存在锁定房号
    const haslocked = builds.some((build) => {
      if (
        build.rindex !== undefined &&
        build.key !== undefined &&
        build.key !== '' &&
        build.index !== undefined
      ) {
        // 房号
        const dbRoom = dbBuildsData.builds[build.index].floor[build.key].room;
        return dbRoom.some((_room, _key) =>
          _key === build.rindex && _room.selected && build.name === _room.name);
      }
      if (
        build.rindex === undefined &&
        build.key !== undefined &&
        build.key !== ''
      ) {
        // 整层
        const dbFloor = dbBuildsData.builds[build.index].floor;
        // 返回楼层是否有被锁定的房号 true 有 false  无
        return dbFloor.some((floor) => {
          if (floor.selected && floor.locked) {
            return true;
          }
          return floor.room.some(room => room.selected && room.locked);
        });
      }
      if (build.rindex === undefined && !build.key && build.key !== 0) {
        // 整栋
        const dbBuild = dbBuildsData.builds[build.index];
        return dbBuild.floor.some((_floor) => {
          console.log(_floor.name, '_floor');

          if (_floor.selected && _floor.locked) {
            return _floor.selected && _floor.locked;
          }
          _floor.room.some(_room => _room.selected && _room.locked);
        });
      }
    });
    console.log(haslocked, '/haslocked');

    if (!haslocked) {
      // false 没有被锁住的房号/楼层/楼栋
      // todo 加锁，更新数据
      const lockedBlooean = true;
      const updateHandler = async (updateData) => {
        const result = await dbClient.update(
          'offices',
          {
            _id: dbClient.getObjectId(buildInfo._id)
          },
          updateData
        );
        return Promise.resolve(result.result);
      };

      let message = '';
      for (let i = 0; i < builds.length; i++) {
        const build = builds[i];
        // builds.forEach(async (build) => {
        if (
          build.rindex !== undefined &&
          build.key !== undefined &&
          build.key !== '' &&
          build.index !== undefined
        ) {
          // 房号
          const dbRoom = dbBuildsData.builds[build.index].floor[build.key].room;
          console.log(dbRoom, '/dbRoom');
          const lockRoom = dbRoom.map((_room) => {
            _room.selected = lockedBlooean;
            _room.locked = lockedBlooean;
            return _room;
          });
          const updateData = {};
          updateData[
            `builds.${build.index}.floor.${build.key}.room.${build.rindex}`
          ] = lockRoom;
          const result = updateHandler(updateData);
          if (!result.nModified) {
            message = '锁定失败';
          }
        }
        if (
          build.rindex === undefined &&
          build.key !== undefined &&
          build.key !== ''
        ) {
          // 整层
          const dbFloor = dbBuildsData.builds[build.index].floor[build.key];
          console.log(dbFloor, '/floor');
          const lockRoom = dbFloor.room.map((_room) => {
            _room.selected = lockedBlooean;
            _room.locked = lockedBlooean;
            return _room;
          });
          dbFloor.room = lockRoom;
          dbFloor.selected = lockedBlooean;
          dbFloor.locked = lockedBlooean;
          dbFloor.roominput = '';
          const updateData = {};
          updateData[`builds.${build.index}.floor.${build.key}`] = dbFloor;
          const result = updateHandler(updateData);

          if (!result.nModified) {
            message = '锁定失败';
          }
        }
        if (build.rindex === undefined && !build.key && build.key !== 0) {
          // 整栋
          const dbBuild = dbBuildsData.builds[build.index];

          const lockedFloor = dbBuild.floor.map((_floor) => {
            _floor.selected = lockedBlooean;
            _floor.locked = lockedBlooean;
            _floor.room.map((_room) => {
              _room.selected = lockedBlooean;
              _room.locked = lockedBlooean;
              return _room;
            });
            return _floor;
          });
          dbBuild.selected = lockedBlooean;
          dbBuild.locked = lockedBlooean;
          dbBuild.floor = lockedFloor;
          dbBuild.inputfloor = '';
          const updateData = {};
          updateData[`builds.${build.index}`] = dbBuild;

          const result = updateHandler(updateData);
          if (!result.nModified) {
            message = '锁定失败';
          }
        }
      }
      let tip = {};
      console.log(message, '/message');

      if (message) {
        tip = {
          code: 500,
          message
        };
      } else {
        tip = {
          code: 200,
          message: '锁定成功'
        };
      }

      ctx.body = tip;
    } else {
      ctx.body = {
        code: 400,
        message: '已有部分房号被锁定，请重新选择房号信息'
      };
    }

    // console.log(buildInfo, builds);

    // const result = await dbClient.insert('offices', params);
    // ctx.body = result;
  }
  // 改
  @request('Put', '/offices/update')
  @summary('update offices')
  @description('update a offices')
  @tag
  @middlewares([logTime()])
  @body({})
  static async updateData(ctx, next) {
    const params = ctx.request.body;
    const condition = {};
    const postData = {};
    let result = {};

    if (params.json !== undefined && params.condition !== undefined) {
      try {
        delete params.json._id;
        condition._id = dbClient.getObjectId(params.condition._id);
        result = await dbClient.update('config', condition, params.json);
      } catch (e) {
        // console.log(e);
        throw Error('jsonStr is not a json string ');
      }
    }
  }
  // 查
  @request('get', '/offices/find')
  @summary('offices list / query by condition')
  @query('')
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
