import cheerio from 'cheerio'
import superagent from 'superagent'
import charset from 'superagent-charset'
import {  request,  summary,  body,  tags,  middlewares,  path,  description, query } from '../../dist'
import dbClient from '../middleware/db'
let currPage = 1
let allData = []
let $ = null
let go2Domain = 'http://www.go2.cn'

const tag = tags(['Spider'])

/**
 * request url
 * @type {Object}
 */
const getPageData = (url, callback) => {

  return new Promise((resolve)=>{
    superagent.get(url)
      // .charset(charSet) //当前页面编码格式
      .end(async (err, sres) => { //页面获取到的数据
          let html = sres.text
          $ = cheerio.load(html, { decodeEntities: false })
          console.log('正在抓取页面：','第',currPage ,'页: url= ', url);
         allData = await callback()
          resolve(allData)
      })
  })
}
/**
 * 格式化go2.cn 数据格式化
 * @type {[type]}
 */
const formatGo2Data = async () =>{
  // 下面类似于jquery的操作，前端的小伙伴们肯定很熟悉啦
  let tempArr = []
  $('.search-result-list ul li').each((index, element) => {
    let itemUrl = go2Domain + $(element).find('.product-img-box a').attr('href')
    let imgUrl = $(element).find('.product-img-box img').attr('src')
    let price =  $(element).find('.product-normal-info .price').text()
    let name = $(element).find('.product-normal-info a .name').attr('title')
    let num = $(element).find('.product-normal-info .product-number').text()
    let allowExpress = $(element).find('.product-hover-info .allow-express').text()
    let itemInfo = []
    itemInfo.push(allowExpress)
    // 商品属性
    $(element).find('.product-hover-info .item').each((index, item)=>{
      if(index !== 2 && index !== 4 && index !== 5){
        let proptype = index === 3 ? $(item).text() : formatString($(item).text())
        itemInfo.push(proptype)
      }
    })
    // 商家信息
    let merchant_name = $(element).find('.product-hover-info .merchant-info .item .merchant-name').text()
    let merchant_phone = $(element).find('.product-hover-info .merchant-info .item .merchant-phone').text()
    let merchant_address = $(element).find('.product-hover-info .merchant-info .merchant-address').attr('title')
    let onitemData = {
      itemUrl,
      imgUrl,
      price: price.trim(),
      name: formatString(name),
      tag: formatString(num),
      productInfo: itemInfo,
      merchantInfo: {
        name: formatString(merchant_name),
        phone: merchant_phone,
        address: merchant_address
      }

    }
      tempArr.push(onitemData)

  })
  // 分页 同时抓取多页数据
  let pageUrl = $('.changepage').find('a').attr('href')
  let pages = $('.changepage').find('#pageCount').attr('all')

  currPage ++
  if(currPage <= pages){
    pageUrl = pageUrl.slice(0,pageUrl.indexOf('page'))
    let newUrl = go2Domain + pageUrl + 'page' + currPage + '.html'
    let pageData = await getPageData(newUrl, formatGo2Data)
    tempArr.concat(pageData)
  }else{
    currPage = 1
    console.log('抓取完成');
  }
  return Promise.resolve(tempArr)
}
/**
 * 格式化58 商业地产内容
 * @type {[type]}
 */
const format58Offices = async () =>{
  let tempArr = []
  console.log('come here////////////////');
  $('.content-side-left .house-list-wrap li').each((index, element) =>{
    console.log(index);
    tempArr.push(index)
    //  tempArr.push(element)
    // let elementUrl = $(element).find("a").attr('href')
    // console.log('58.com Office item url', elementUrl);

  })
  return Promise.resolve(tempArr)
}
/**
 * 格式化字符串 去除制表符
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
const formatString = (str) =>{
  str = str.replace(/[\s{2,}\b\r\n\t]/g, "");
  return str
}
export default class spider{

  @request('get', '/Spider/done')
  @summary('go2.cn网页内容')
  @description('基于nodeJs 的网页爬虫')
  @tag
  @query({url: { type: 'string',  require: 'true'} , charSet: { type: 'string',  require: 'true' } })
  // @middlewares([logTime()])
  static async done(ctx){
    let getQuery = ctx.request.query
    let url = getQuery.url
    let charSet = getQuery.charSet || 'utf-8'
    let result = {}
    if(!url){
      result.message = 'Error taking parameter, please check! All parameters are required'
      result.code = 400
    }else{
     result.data = await getPageData(url, formatGo2Data)
     result.message = 'success'
     result.code = 200
     console.log(result.data.length, '///get all data length');
    }
    let insert = dbClient.insertMany('shoes_7new_list', result.data)
    ctx.body = insert
  }

  @request('get', '/Spider/offices')
  @summary('58同城写字楼网页内容')
  @description('基于nodeJs 的网页爬虫')
  @tag
  @query({url: { type: 'string',  require: 'true'} , charSet: { type: 'string',  require: 'true' }, pgtid: { type: 'string', require: 'true', description: '区域Id' } })
  static async offices(ctx){
    let getQuery = ctx.request.query
    let url = getQuery.url
    let charSet = getQuery.charSet || 'utf-8'
    let pgtid = getQuery.pgtid
    let result = {}
    if(!url || !pgtid){
      result.message = 'Error taking parameter, please check! All parameters are required'
      result.code = 400
    }else{
      // url = url + '?PGTID=' + pgtid + '&ClickID=1'
      result.data = await getPageData(url, format58Offices)
      result.code = 200
    }
    ctx.body = result
  }
}
