import {  request,  summary,  body,  tags,  middlewares,  path,  description, query } from '../../../../dist'
import dbClient from '../../../middleware/db'
import requestObj from 'request'
// .toUpperCase()
const tag = tags(['case_list'.toLowerCase().replace('case_list'.charAt(0),'case_list'.charAt(0).toUpperCase())])

const bodyConditions = {
  // jsonStr 是一条数据记录json 字符串对象，用于对数据集合的增、删、改、查时，分别作为，插入数据、删除条件、修改条件、查询条件json字符串对象传入
  // JsonStr is a data record json string object, which is used to add, delete, change, and check the data set, respectively as, insert data, delete condition, modify condition, and query condition json string object passed in
  jsonStr : { type: 'object', description: 'json 字符串' }
}
const upDateJson = {
  condition: { type: 'object', require: 'true', description: 'Update the conditional json string'},
  json: {  type: 'object', require: 'true', description: 'Update the data json string'}
}
const queryConditions = {
  page: { type: 'number', description: 'The current page number "Not set to query all"' },
  num: { type: 'number', description: 'Number of data bars per page "Not set to show all"' },
  tid: { type: 'string', description: 'the case class id'}
}

const logTime = () => async (ctx, next) => {
  console.time('start')
  await next()
  console.timeEnd('start')
}
const getCaseDetial = (id) =>{
  let url = 'http://toogu2019.toogu.com.cn/index.php/Api/Index/toogu_case_details?id=' + id
  console.log(url);
  requestObj.get(url, (error, response, body)=>{
    let data = JSON.parse( response.body)
    // let params = {
    //   id: data.case_details.id
    //   case_details: data.case_details,
    //   page: data.case_details.page
    // }
    // addItems(params)
    // console.log(data, '/////');
    downfiles(data.case_details,data)
    // console.log(data.case_details, '////');
  })
}
const downfiles = (json, data) =>{
  let url = 'http://localhost:3000/api/downfiles/getDown'
  let imgarr = json.case_xplb
    imgarr.push(json.case_xpytu)
    imgarr.push(json.case_fengmian)
  let params = {
    collectionInfo:{
      name: 'case_details',
      urlField: 'case_fengmian'
    },
    forDetail: true,
    data:{
      items: imgarr,
      json: data
    }
  }
  // console.log(params, '///');
  requestObj.post({
    url,
    body: params,
    method: "POST",
    json: true,
  }, (error, response, body)=>{
    // console.log('post data');
    // console.log(response, '/////');
  })
}
const addItems = (item) =>{
  let url = 'http://localhost:3000/api/case_details/add'
  requestObj.post({
    url,
    body: item,
    method: "POST",
    json: true,
  },(error, response)=>{
    // console.log(response, '///');
  })
}
export default class case_list{
  // 增
  @request('POST', '/case_list/add')
  @summary('add case_list')
  @description('add a case_list')
  @tag
  @middlewares([logTime()])
  // @body({})
  static async register(ctx, next) {
    let params = ctx.request.body
    // let postData = {}
    console.log(params, '///get data');
    let result = {}
    if(params !== {}){
      if(params['jsonStr']){
        delete params.jsonStr
      }
      result = await dbClient.insert('case_list',params)
      ctx.body = result
    }else{
      ctx.body = {
        code: 500,
        message: 'jsonStr undefined'
      }
    }
    // if(params.jsonStr !== undefined){
    //   try {
    //     postData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
    //     result = await dbClient.insert('case_list',postData)
    //   } catch (e) {
    //     console.log(e);
    //     throw Error('Jsonstr is not a json string')
    //   }
    //   ctx.body = result
    // }

  }
  // 删
  @request('DELETE', '/case_list/delete')
  @summary('delete case_list by condition')
  @tag
  @body(bodyConditions)
  // @path({ id: { type: 'string', required: true } })
  static async deleteMany(ctx) {
    let params = ctx.request.body
    let paramsData = {}
    if(params.jsonStr !== undefined){
      try {
        paramsData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
        if(paramsData['_id']){
          paramsData._id = dbClient.getObjectId(paramsData['_id'])
        }
        let result = await dbClient.remove('case_list',paramsData)
        ctx.body = result

      } catch (e) {
        // console.log('Jsonstr is not a json string',e)
        throw Error('Jsonstr is not a json string')
        return
      }
    }else {
      ctx.body = {
        code: 500,
        message: 'Jsonstr is undefined'
      }
    }
  }
// 改
  @request('Put', '/case_list/update')
  @summary('update case_list')
  @description('update a case_list')
  @tag
  @middlewares([logTime()])
  @body(upDateJson)
  static async updateData(ctx, next) {
    let params = ctx.request.body
    let condition = {}
    let postData = {}
    let result = {}
    // if(params.condition !== undefined && params.jsonStr !== undefined){
    //   try {
    //     condition = typeof params.condition === 'string' ? JSON.parse(params.condition) : params.condition
    //     postData = typeof params.jsonStr === 'string' ? JSON.parse(params.jsonStr) : params.jsonStr
    //     result = await dbClient.update('case_list',condition,postData)
    //   } catch (e) {
    //     console.log(e);
    //     throw Error('Jsonstr is not a json string')
    //   }
    //   ctx.body = result
    // }
    if(params.json !== undefined && params.condition !== undefined){
       try{
         delete params.json['_id']
         condition._id = dbClient.getObjectId(params.condition._id)
         result = await dbClient.update('config',condition, params.json)
       }catch (e) {
        // console.log(e);
        throw Error('jsonStr is not a json string ')
      }
    }else{
    ctx.body = {
      code: 500,
      message: params.condition ? 'jsonStr undefined' : (params.json ? 'condition json string undefined' : ' condition and jsonStr json string all undefined or {}')
    }
    return
  }
  }
// 查
  @request('get', '/case_list/find')
  @summary('case_list list / query by condition')
  @query(queryConditions)
  @tag
  static async getAll(ctx) {
    // console.log('come here');

    let params = ctx.request.query
    let tid = params.tid
    let page = params.page
    let num = params.num
    // console.log(params, '///get query');
    let paramsData = {}
    if(!tid){
      delete params.tid
    }else{
      paramsData.case_id = tid
    }
    // console.log(params);
    let result = await dbClient.find('case_list', paramsData, page, num)
    let count = await dbClient.getCount('case_list')
    let items = result.data
    //  获取案例详情信息
    // for(let i = 0; i< items.length; i++){
    //   let id = items[i].id
    //    getCaseDetial(id)
    // }
    let pageInfo = {
      pagenum: Math.ceil(count/ num),
      page,
      num,
      tid,
      ks: (page -1)* num,
      end: page * num
    }
    let formatData = {
      case_list: result.data,
      page: pageInfo
    }
    ctx.body = formatData
  }
}
