import cheerio from 'cheerio';
import superagent from 'superagent';
import charset from 'superagent-charset';
import {
  request,
  summary,
  body,
  tags,
  middlewares,
  path,
  description,
  query
} from '../../dist';
import dbClient from '../middleware/db';

const tag = tags(['Spider']);
const Adjust = 1.35;
let TYPE = null;

let currPage = 1;
let allData = [];
let $ = null;

const go2Domain = 'http://www.go2.cn';

const logTime = () => async (ctx, next) => {
  console.time('start');
  await next();
  console.timeEnd('start');
};

/**
 * request url
 * @type {Object}
 */
const getPageData = (url, callback) =>
  new Promise((resolve) => {
    superagent
      .get(url)
      // .charset(charSet) //当前页面编码格式
      .end(async (err, sres) => {
        // 页面获取到的数据
        const html = sres.text;
        $ = cheerio.load(html, { decodeEntities: false });
        // console.log('正在抓取页面：','第',currPage ,'页: url= ', url);
        allData = await callback();
        resolve(allData);
      });
  });

/**
 * 格式化go2.cn 数据格式化
 * @type {[type]}
 */
const formatGo2Data = async () => {
  // 下面类似于jquery的操作，前端的小伙伴们肯定很熟悉啦
  $('.search-result-list ul li').each((index, element) => {
    const itemUrl =
      go2Domain +
      $(element)
        .find('.product-img-box a')
        .attr('href');
    const imgUrl = $(element)
      .find('.product-img-box img')
      .attr('src');
    const price = $(element)
      .find('.product-normal-info .price')
      .text();
    const name = $(element)
      .find('.product-normal-info a .name')
      .attr('title');
    const num = $(element)
      .find('.product-normal-info .product-number')
      .text();
    const allowExpress = $(element)
      .find('.product-hover-info .allow-express')
      .text();
    const itemInfo = [];
    itemInfo.push(allowExpress);
    // 商品属性
    $(element)
      .find('.product-hover-info .item')
      .each((index, item) => {
        if (index !== 2 && index !== 4 && index !== 5) {
          const proptype =
            index === 3 ? $(item).text() : formatString($(item).text());
          itemInfo.push(proptype);
        }
      });
    // 商家信息
    const merchant_name = $(element)
      .find('.product-hover-info .merchant-info .item .merchant-name')
      .text();
    const merchant_phone = $(element)
      .find('.product-hover-info .merchant-info .item .merchant-phone')
      .text();
    const merchant_address = $(element)
      .find('.product-hover-info .merchant-info .merchant-address')
      .attr('title');
    const sellPice = Math.ceil(parseFloat(price.trim()) * Adjust).toFixed(2);
    const onitemData = {
      itemUrl,
      imgUrl,
      price: price.trim(),
      sellPice,
      adjustProp: Adjust,
      name: formatString(name),
      tag: formatString(num),
      productInfo: itemInfo,
      type: TYPE,
      merchantInfo: {
        name: formatString(merchant_name),
        phone: merchant_phone,
        address: merchant_address
      }
    };
    if (formatString(merchant_name) && merchant_phone && merchant_address) {
      allData.push(onitemData);
    }
  });
  // 分页 同时抓取多页数据
  let pageUrl = $('.changepage')
    .find('a')
    .attr('href');
  const pages = $('.changepage')
    .find('#pageCount')
    .attr('all');

  currPage++;
  if (currPage <= pages) {
    pageUrl = pageUrl.slice(0, pageUrl.indexOf('page'));
    const newUrl = `${go2Domain + pageUrl}page${currPage}.html`;
    const pageData = await getPageData(newUrl, formatGo2Data);
    allData.concat(pageData);
  } else {
    currPage = 1;
    console.log('抓取完成');
  }
  return Promise.resolve(allData);
};

/**
 * 解析产品详情
 * @param  {[type]} str [description]
 * @return {[type]}     [description]
 */
const formatDetailInfo = () =>
  new Promise((resolve, reject) => {
    try {
      const imgArr = [];
      const size = [];
      const color = [];
      const detailTag = [];
      const detailImgs = [];

      const videoSrc =
        $('.product-img-box')
          .find('#video-flv')
          .attr('data-url') || '';
      $('.product-img-box .small-img-list li').each((index, element) => {
        const imgUrl = $(element)
          .find('img')
          .attr('big');
        // 220缩略图 450 中图  750 大图
        imgArr.push(imgUrl);
      });

      $('.product-details')
        .find('.properties-box .more-c-c li')
        .each((index, element) => {
          const item = $(element).attr('title');
          size.push(item);
        });

      $('.product-details')
        .find('.properties-box-c .more-c-c li')
        .each((index, element) => {
          const onColor = $(element).attr('title');
          color.push(onColor);
        });

      $('.product-center-box')
        .find('.details-attribute-list li')
        .each((index, element) => {
          let tags;
          if ($(element).text()) {
            tags = $(element).text() || '';
            const tag = formatString(tags);
            detailTag.push(tag);
          }
        });

      $('.product-center-box')
        .find('.product-details-content img')
        .each((index, element) => {
          if (index < 8) {
            const imgsrc = $(element).attr('data-url');
            detailImgs.push(imgsrc);
          }
        });
      const itemDetail = {
        videoSrc,
        imgs: imgArr,
        size,
        color,
        detailTag,
        detailImgs
      };
      allData.push(itemDetail);
      resolve(allData);
    } catch (e) {
      reject(e);
    }
  });

const formatString = (str) => {
  str = str.replace(/[\s{2,}\b\r\n\t]/g, '');
  return str;
};
const randomString = (len) => {
  len = len || 32;
  const $chars =
    'abcdefhijkmnprstwxyz1234567890'; /** **默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1*** */
  const maxPos = $chars.length;
  let pwd = '';
  for (let i = 0; i < len; i++) {
    pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return pwd;
};
const getItemDetail = async (items, next) => {
  const list = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = item._id;
    const url = item.itemUrl;
    if (
      item.merchantInfo.name &&
      item.merchantInfo.phone &&
      item.merchantInfo.address
    ) {
      const itemInfo = await getPageData(url, formatDetailInfo);
      const finallData = itemInfo[0];
      const date = new Date();
      const timeString32 = date.getTime().toString(12);
      const newId = dbClient.getObjectId(timeString32);
      // console.log(newId);
      finallData.list_id = item._id;
      finallData.name = item.name;
      finallData.price = item.price;
      finallData.sellPice = item.sellPice;
      finallData._id = newId;
      list.push(finallData);
      // console.log(finallData, '///');
      console.log(`第${i + 1}页`);
      dbClient.connect().then((db) => {
        db.collection('product_detail').insertOne(
          finallData,
          (error, result) => {
            if (error) {
              console.log('数据插入失败', error);
            }
            if (result) {
              console.log('数据插入成功');
            }
          }
        );
      });
      allData = [];
    }
  }
};

const arrayUniQue = (arr) => {
  let result = [],
    hash = {};
  for (let i = 0; i < arr.length; i++) {
    if (!hash[arr[i]]) {
      result.push(arr[i]);
      hash[arr[i]] = true;
    }
  }
  return result;
};
const getMerchantInfo = (data) => {
  const merchants = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    merchants.push(item.merchantInfo);
  }
  return merchants;
};

export default class spider {
  @request('get', '/Spider/done')
  @summary('爬取网页内容')
  @description('基于nodeJs 的网页爬虫')
  @middlewares([logTime()])
  @tag
  @query({
    url: { type: 'string', require: 'true' },
    charSet: { type: 'string', require: 'true' },
    type: { type: 'string', require: true, description: '分类' }
  })
  // @middlewares([logTime()])
  static async done(ctx) {
    const getQuery = ctx.request.query;
    const url = getQuery.url;
    const charSet = getQuery.charSet || 'utf-8';
    const collectionName = getQuery.collection;
    TYPE = getQuery.type;
    const result = {};
    let insertStatus = null;
    if (!url) {
      result.message =
        'Error taking parameter, please check! All parameters are required';
      result.code = 400;
    } else {
      result.data = await getPageData(url, formatGo2Data);
      result.message = 'success';
      result.code = 200;
      console.log(result.data.length, '///get all data length');
      insertStatus = await dbClient.insertMany('product_list', result.data);
    }
    ctx.body = insertStatus;
    allData = [];
  }
  @request('get', '/Spider/getlist')
  @summary('获取列表，根据url 获取详细信息')
  @middlewares([logTime()])
  @tag
  static async getList(ctx, next) {
    const products = await dbClient.find('product_list', {});
    const list = [];
    const details = await getItemDetail(products.data, next);
    ctx.body = details;
  }
  @request('get', '/Spider/export')
  @summary('导出数据保存为Excel')
  @middlewares([logTime()])
  @tag
  static async exportExcelByJson(ctx) {
    const result = await dbClient.find('product_list', {});
    let merchants = getMerchantInfo(result.data);
    merchants = arrayUniQue(merchants);
    // let res = exportExcelByJson(merchants)
    ctx.body = merchants;
  }
}
