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
  'house'
    .toLowerCase()
    .replace('house'.charAt(0), 'house'.charAt(0).toUpperCase())
]);
const formartParams = (params) => {
  const post_params = {};
  Object.keys(params).map((key) => {
    switch (key) {
      case 'price':
      case 'area':
      case 'station':
      case 'partment':
      case 'floor':
      case 'price_total':
        const _values = params[key].split('-');
        if (params.isNew && (key == 'price' || key == 'area')) {
          const maxKey = `max${key.replace(
            key.slice(0, 1),
            key.slice(0, 1).toUpperCase()
          )}`;
          const obj1 = {};
          const obj2 = {};
          if (_values[1]) {
            obj1[key] = {
              $gte: parseInt(_values[0]),
              $lte: parseInt(_values[1])
            };
            obj2[maxKey] = {
              $gte: parseInt(_values[0]),
              $lte: parseInt(_values[1])
            };
          } else {
            obj1[key] = {
              $gte: parseInt(_values[0])
            };
            obj2[maxKey] = {
              $gte: parseInt(_values[0])
            };
          }

          post_params.$or = [obj1, obj2];
        } else if (_values[1]) {
          post_params[key] = {
            $gte: parseInt(_values[0]),
            $lte: parseInt(_values[1])
          };
        } else {
          post_params[key] = {
            $gte: parseInt(_values[0].replace('>', ''))
          };
        }

        break;
      case 'pic':
      case 'key':
      case 'addPrice':
      case 'updown':
      case 'jumplayer':
      case 'lease':
        if (params[key].length) {
          post_params[key] = {
            $in: params[key]
          };
        }
        break;
      case 'region':
        if (!params[key][1]) {
          post_params[`buildinfo.${key}.0`] = params[key][0];
        } else {
          post_params[`buildinfo.${key}`] = params[key];
        }
        break;
      case 'page':
      case 'pageSize':
        break;
      case 'floorName':
        post_params.floor = params[key];
        break;
      case 'keyword':
        post_params['buildinfo.name'] = new RegExp(params[key]);
        break;
      case 'sort':
        // sort = params[key];
        break;
      case 'status':
        post_params.$or = [
          {
            status: params[key]
          },
          {
            'audit.status': params[key]
          }
        ];
        break;
      case 'isShop':
        break;
      case 'industry':
      case 'shoptype':
        const _indexKey =
          parseInt(params[key]) !== 'NaN' ? parseInt(params[key]) : params[key];
        if (_indexKey) {
          post_params[key] = {
            $in: [_indexKey]
          };
        }
        break;
      default:
        post_params[key] = params[key];
    }
  });
  if (params.isShop && params.price_total) {
    post_params.price = post_params.price_total;
    delete post_params.price_total;
  }
  return post_params;
};

export default class house {
  @request('post', '/house/createNewHouse')
  @summary('添加新房')
  @description('新房接口')
  @tag
  @body({})
  static async createNewHose(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: ' 缺少必要参数'
      };
      return;
    }

    const result = await dbClient.insert('house', params);
    ctx.body = {
      code: result.code,
      message: result.message
    };
  }
  @request('post', '/house/addResidence')
  @summary('发布住宅房源')
  @description('住宅房源')
  @tag
  @body({})
  static async addresidence(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length) {
      ctx.body = {
        code: 400,
        message: '缺少必填参数'
      };
      return;
    }
    const postParams = {};
    Object.keys(params).map((el) => {
      if (params[el] !== '') {
        postParams[el] = params[el];
      }
    });
    // if (params.buildinfo._id) {
    //   postParams['buildinfo._id'] = dbClient.getObjectId(params['buildinfo._id']);
    // }

    const { residenceBuild } = postParams;
    const _getBuild = await dbClient.find('builds', {
      _id: dbClient.getObjectId(residenceBuild.curBuildId)
    });
    let curBuild = {};
    if (_getBuild && _getBuild.data) {
      curBuild = _getBuild.data[0];
    }
    const curRoom =
      curBuild.builds[residenceBuild.build].units[residenceBuild.unit].floor[
        residenceBuild.floor
      ].room[residenceBuild.room];
    if (curRoom.selected || curRoom.locked) {
      ctx.body = {
        code: 500,
        message: '该房源已被锁定'
      };
    } else {
      const upRoom = {};
      const roomKey = `builds.${residenceBuild.build}.units.${residenceBuild.unit}.floor.${residenceBuild.floor}.room.${residenceBuild.room}`;
      upRoom[`${roomKey}.selected`] = upRoom[`${roomKey}.locked`] = true;
      await dbClient.update(
        'builds',
        {
          _id: dbClient.getObjectId(curBuild._id)
        },
        upRoom
      );
      postParams.buildinfo._id = dbClient.getObjectId(postParams.buildinfo._id);

      const result = await dbClient.insert('house', postParams);

      ctx.body = {
        code: 200,
        id: result.data.ops[0]._id
      };
    }

    // console.log(_getBuild, '/_getBuild');
  }
  // 增
  @request('POST', '/house/add')
  @summary('add house')
  @description('add a house')
  @tag
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
        const dbFloor = dbBuildsData.builds[build.index].floor[build.key];
        // 返回楼层是否有被锁定的房号 true 有 false  无

        return dbFloor.room.some(room => room.selected && room.locked);
      }
      if (build.rindex === undefined && !build.key && build.key !== 0) {
        // 整栋
        const dbBuild = dbBuildsData.builds[build.index];
        return dbBuild.floor.some((_floor) => {
          // console.log(_floor.name, '_floor');

          if (_floor.selected && _floor.locked) {
            return _floor.selected && _floor.locked;
          }
          _floor.room.some(_room => _room.selected && _room.locked);
        });
      }
    });
    // console.log(haslocked, '/haslocked');

    if (!haslocked) {
      // false 没有被锁住的房号/楼层/楼栋
      // todo 加锁，更新数据
      const lockedBlooean = true;
      const updateHandler = async (updateData) => {
        await dbClient.update(
          'builds',
          {
            _id: dbClient.getObjectId(buildInfo._id)
          },
          updateData
        );
      };

      //  锁定选择的房源
      builds.forEach(async (build) => {
        if (
          build.rindex !== undefined &&
          build.key !== undefined &&
          build.key !== '' &&
          build.index !== undefined
        ) {
          // 房号
          const dbRoom =
            dbBuildsData.builds[build.index].floor[build.key].room[
              build.rindex
            ];
          // console.log(dbRoom, '/dbRoom');
          // const lockRoom = dbRoom.map((_room) => {
          //   _room.selected = lockedBlooean;
          //   _room.locked = lockedBlooean;
          //   return _room;
          // });
          dbRoom.selected = lockedBlooean;
          dbRoom.locked = lockedBlooean;
          const updateData = {};
          const _floorName = dbBuildsData.builds[build.index].floor
            ? dbBuildsData.builds[build.index].floor[build.key].name
            : '';
          params.floor =
            _floorName && parseInt(_floorName).toString !== 'NaN'
              ? parseInt(_floorName)
              : _floorName;

          updateData[
            `builds.${build.index}.floor.${build.key}.room.${build.rindex}`
          ] = dbRoom;
          updateHandler(updateData);
        }
        if (
          build.rindex === undefined &&
          build.key !== undefined &&
          build.key !== ''
        ) {
          // 整层
          const dbFloor = dbBuildsData.builds[build.index].floor[build.key];
          // console.log(dbFloor, '/floor');
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
          params.tag = '整层';
          params.floor =
            dbFloor.name && parseInt(dbFloor.name).toString !== 'NaN'
              ? parseInt(dbFloor.name)
              : dbFloor.name;
          updateData[`builds.${build.index}.floor.${build.key}`] = dbFloor;
          updateHandler(updateData);
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
          params.tag = '整栋';
          const _floorName = dbBuild.floor ? dbBuild.floor[build.key].name : '';
          params.floor =
            _floorName && parseInt(_floorName).toString !== 'NaN'
              ? parseInt(_floorName)
              : _floorName;
          updateData[`builds.${build.index}`] = dbBuild;
          updateHandler(updateData);
        }
      });
      params.buildinfo._id = dbClient.getObjectId(params.buildinfo._id);

      const result = await dbClient.insert('house', params);
      ctx.body = {
        code: result.code,
        message: result.message,
        id: result.data.ops[0]._id
      };

      // if (result.result)

      // ctx.body = tip;
    } else {
      ctx.body = {
        code: 400,
        message: '已有部分房号被锁定，请重新选择房号信息'
      };
    }

    // console.log(buildInfo, builds);

    // const result = await dbClient.insert('house', params);
    // ctx.body = result;
  }
  // 改
  @request('Put', '/house/update')
  @summary('update house')
  @description('update a house')
  @tag
  @body({})
  static async updateData(ctx) {
    const params = ctx.request.body;
    if (!Object.keys(params).length || !params._id) {
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
      if (key !== '_id') {
        json[key] = params[key];
      }
    });

    const result = await dbClient.update('house', condition, json);
    ctx.body = {
      data: result.result,
      message: result.result.nModified >= 1 ? '修改成功' : '修改失败'
    };
    // if (params.json !== undefined && params.condition !== undefined) {
    //   try {
    //     if (params.json._id) delete params.json._id;
    //     condition._id = dbClient.getObjectId(params.condition._id);
    //     result = await dbClient.update('house', condition, params.json);
    //   } catch (e) {
    //     throw Error('jsonStr is not a json string ');
    //   }
    // }
  }
  @request('get', '/house/findNoAdvHouse')
  @summary('查找有图片，没实勘人的房源')
  @query({})
  @tag
  static async findNoAdvHouse(ctx) {
    const params = {
      advAuthor: null
    };
    const result = await dbClient.find('house', params);

    result.data.map(async (item, index) => {
      const advAuthor = {};
      if (item.author) {
        Object.keys(item.author).map((key) => {
          if (key !== '_id') advAuthor[key] = item.author[key];
          else advAuthor.token = item.author[key];
        });

        if (Object.keys(advAuthor).length) {
          const condition = {
            _id: dbClient.getObjectId(item._id)
          };
          await dbClient.update('house', condition, {
            advAuthor
          });
        }
      }
    });
    ctx.body = result;
  }
  // 查询房源详情by id
  @request('post', '/house/detail')
  @summary('根据房源id 查询房源详情')
  @body({})
  @tag
  static async getdetail(ctx) {
    const params = ctx.request.body;
    if (!params._id) {
      ctx.body = {
        code: 400,
        message: '缺少房源_id， 必传参数'
      };
      return;
    }
    if (params._id) {
      params._id = dbClient.getObjectId(params._id);
    }
    const aggregate = [
      {
        $match: params
      },
      {
        $lookup: {
          from: 'builds',
          localField: 'buildinfo._id',
          foreignField: '_id',
          as: 'buildDetail'
        }
      }
    ];
    const result = await dbClient.aggregate('house', aggregate);
    ctx.body = result;
  }
  // 查新房
  @request('post', '/house/searchNewHouse')
  @summary('搜索新房房源')
  @body({})
  @tag
  static async searchNewHouse(ctx) {
    const params = ctx.request.body;
    const paramsData = formartParams(params);
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    const aggregate = [
      {
        $match: paramsData
      },
      {
        $skip: (page - 1) * pageSize
      },
      {
        $limit: pageSize
      },
      {
        $lookup: {
          from: 'builds',
          localField: 'buildinfo._id',
          foreignField: '_id',
          as: 'parentBuild'
        }
      },
      {
        $sort: params.sort || {
          time: -1
        }
      }
    ];
    const result = await dbClient.aggregate('house', aggregate);

    ctx.body = result;
  }
  // search
  @request('post', '/house/search')
  @summary('录入带看时 搜索房源api')
  @body({})
  @tag
  static async search(ctx) {
    const params = ctx.request.body;
    const sort = {
      time: -1
    };

    const result = await dbClient.find('house', params, {}, 1, 20, sort);
    ctx.body = result;
  }

  // 查
  @request('post', '/house/find')
  @summary('house list / query by condition')
  @body({})
  @tag
  static async getAll(ctx) {
    const params = ctx.request.body;
    const post_params = formartParams(params);
    const sort = {
      time: -1
    };
    const result =
      params.page && params.pageSize
        ? await dbClient.find(
          'house',
          post_params,
          {},
          params.page,
          params.pageSize,
          sort
        )
        : await dbClient.find('house', post_params, {}, null, null, sort);

    if (result.code === 200 && result.data) {
      ctx.body = {
        code: result.code,
        count: result.count,
        data: result.data.map(item => ({
          _id: item._id,
          nature: item.nature,
          // build: item.build,
          type: item.type,
          area: item.area,
          price: item.price,
          station: item.station,
          partment: item.partment,
          decorate: item.decorate,
          aspect: item.aspect,
          addPrice: item.addPrice,
          jumplayer: item.jumplayer,
          status: item.status,
          undown: item.undown,
          imgs: item.imgs,
          keyImg: !!item.keyImg,
          buildinfo: item.buildinfo,
          tag: item.tag || item.tags || '',
          time: item.time,
          key: item.key,
          tranFee: item.tranFee,
          pic: item.pic,
          maxPrice: item.maxPrice || '',
          maxArea: item.maxArea || '',
          price_total: item.price_total,
          isNew: item.isNew || false
        }))
      };
    } else {
      ctx.body = result;
    }
  }
}
