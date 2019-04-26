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
import dbClient from '../middleware/db/'
import requestObj from 'request'
import fs from 'fs'
import pathd from 'path'

const dirname = 'uploads'
const hostdir = "./public/uploads/"
const tag = tags(['downfiles'])

const params = {
  data: { type: 'object', require: true, description: 'data object like data:{ items:[{},{},...], {},...}' }
}

let getImgUrls = (arr, collectionInfo) =>{
 arr.forEach((item)=>{
   let url = item[collectionInfo.urlField]
   let name = url.slice(url.lastIndexOf('/'),url.length)
   let date = new Date()
   let year = date.getFullYear()
   let monuth = (date.getMonth() + 1)  < 10 ? "0" + ( date.getMonth() + 1) : date.getMonth() + 1
   let day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate()
   let dir = year + monuth + day

   const dstpath = hostdir +  dir + '/' + name
   if (name.length && dir.length && !fs.existsSync(dstpath)) {
     if (mkdirSync(hostdir  + dir)) {
       // console.log(dstpath)
       requestObj(url).pipe(fs.createWriteStream(dstpath))
     }
   }
   item[collectionInfo.urlField] = dstpath.slice(1, dstpath.length)
   // 删除原json 指定字段
   if(collectionInfo.deleteFields){
     let removeFields = collectionInfo.deleteFields
     for(let i = 0; i< removeFields.length; i++){
       let field = removeFields[i]
       if(item[field]){
         delete item[field]
       }
     }
   }
 })
 return arr
}

let mkdirSync = (dirname) => {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirSync(pathd.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
    return false
}

export default class Downloads {

  @request('post', '/downfiles/getDown')
  @summary('Download and save files')
  @description(`
    Specifies the URL of the network resource based on the object download
    {
      collectionInfo: { // must be
        name: "collectionName",
        urlField: 'the file\'s url in object field', // like data.items[0].url
        deleteFields: [
          'need to delete from obj fields',
          ...
          like data.items[0].desc use 'desc'
        ]
      },
      data:{ // must be
        items: [ // must be
          url: '', // must be
          ...,
          desc: ''
        ]
      }
    }
    `)
  @tag
  // @middlewares([logTime()])
  @body(params)
  static async getDown(ctx){
    let params = ctx.request.body
    let arr = params.data.items
    // 操作集合信息
    let collectionName = params.collectionInfo.name
    let urlField = params.collectionInfo.urlField
    let deleteFields = params.collectionInfo.deleteFields

    if(!collectionName || !urlField){
      ctx.body = {
        code: 400,
        message: 'collectionInfo\'s collectionName or urlField error ',
        data: {
          collectionName,
          urlField
        }
      }
      return
    }
    let result = null
    try {
      params.data.items = getImgUrls(arr, params.collectionInfo)
      result = await dbClient.insert(params.collectionInfo.name, params.data)
    } catch (e) {
      console.error(e)
    } finally {
      ctx.body = result
    }
  }
}
