import {
  request,
  summary,
  body,
  tags,
  query,
  middlewares,
  path,
  description
} from '../../dist'
import dbClient from '../middleware/db'
import fsReadWrite from '../public/js/createRouter'

const tag = tags(['autoGenerate'])
const collectionParams = {
  collectionName: { type: 'string', require: true, description : 'Collection name', default: '' },
  jsonStr: { type: 'object', require: true, description: 'Data set field names and display names such as key:value json string' }
}
const CollectName = {
  collectionName: { type: 'string', require: true, description: 'collection name' }
}

const logTime = () => async (ctx, next) => {
  console.time('start')
  await next()
  console.timeEnd('start')
}

export default class autoGenerate {
  @request('POST', '/autoGenerate/add')
  @summary('Automatically add collections and data, and automatically generate apis')
  @description('创建数据集合及定义字段，字段名称与显示名称将存放在collectConfig 集合中，用作后期显示，程序将自动在数据库中添加该集合，')
  @tag
  @middlewares([logTime()])
  @body(collectionParams)
  static async add (ctx,next){
    let params = ctx.request.body
    let postData = params.jsonStr
    let result = {}
    // console.log(postData, postData === {}, typeof postData, '/////')
    if(Object.keys(postData).length == 0){
      throw Error('jsonStr does not allow null')
      return
    }
    let collectionObj = {
      name: params.collectionName,
      fields: postData
    }
    let checkCollectionByName = await dbClient.find('collectConfig',{ name: params.collectionName })

    if(checkCollectionByName.data.length){
      throw Error(`The data set '${params.collectionName}' already exists`)
      return
    }
    if(params.collectionName == 'collectConfig'){
      throw Error('The collection  "collectConfig" keeps the name for the system; use another name')
      return
    }

    let wirteSuccess = await fsReadWrite.createRouter(params.collectionName)

    if(wirteSuccess){
      result = await dbClient.insert('collectConfig',collectionObj)
    }
    ctx.body = result

  }
  // 改
  @request('Put', '/autoGenerate/update')
  @summary('update the collection fields')
  @description('更新集合字段')
  @tag
  @middlewares([logTime()])
  @body(collectionParams)
  static async updateCollection(ctx){

    let params = ctx.request.body
    let postData = params.jsonStr
    let result = {}
    // console.log(postData, postData === {}, typeof postData, '/////')
    if(Object.keys(postData).length == 0){
      throw Error('jsonStr does not allow null')
      return
    }
    let collectionObj = {
      name: params.collectionName,
      fields: postData
    }
    let checkCollectionByName = await dbClient.find('collectConfig',{ name: params.collectionName })

    if(!checkCollectionByName.data.length){
      throw Error(`The collection '${params.collectionName}' does not exist`)
      return
    }
    result = await dbClient.update('collectConfig', {name: params.collectionName }, {fields: postData})
    ctx.body = result
  }
  // 删
  @request('Delete', '/autoGenerate/delete')
  @summary('delete the collection')
  @description('删除集合')
  @tag
  @middlewares([logTime()])
  @body(CollectName)
  static async deleteCollection(ctx){

    let params = ctx.request.body
    let result = {}

    let checkCollectionByName = await dbClient.find('collectConfig',{ name: params.collectionName })

    if(!checkCollectionByName.data.length){
      throw Error(`The collection '${params.collectionName}' does not exist`)
      return
    }
    result = await dbClient.remove('collectConfig', {name: params.collectionName })
    // 删除router文件
    fsReadWrite.removeFile(`src/routes/generateRoutes/${params.collectionName}.js`)

     ctx.body = result
  }
  // 查询
  @request('get', '/autoGenerate/find')
  @summary('find the collections')
  @description('根据条件查询集合')
  @tag
  @middlewares([logTime()])
  @query(CollectName)
  static async findCollection(ctx){

    let params = ctx.request.query
    let filterConditions = {}
    let paramsData = {}
    let result = {}
    if(params['collectionName'] && params['collectionName'] !== undefined){
      try {
        paramsData = JSON.parse(params.collectionName)
      } catch (e) {
        throw Error('Jsonstr is not a json string')
        return
      }
    }

    let checkCollectionByName = await dbClient.find('collectConfig',{ name: params.collectionName })

    if(checkCollectionByName.data.length){
      paramsData = {name: params.collectionName }
    }
    result = await dbClient.find('collectConfig', paramsData)

    ctx.body = result
  }

}
