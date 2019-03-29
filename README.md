#用途
  1、为了方便前端开发，简化前端工作量，想做一款前后端自动生成框架，根据自动类型 自动生成相应的组件、页面。
  2、前端实现API 开发， 轻松管理数据库数据。
  3、同时也是为了自己做项目时 不用每个项目都从零开始配置。
  4、希望有兴趣的朋友可以加入我，一起丰富框架功能，有时间会持续开发不定期更新。

## koa + swagger + mongodb api开发框架
 实现后端api开发封装，调用autoGenerate 接口可自动创建数据集合及对应增、删、改、查接口


 ## **项目使用**
 ``` bash
 ## 安装项目依赖
 npm install

 ## 修改数据库连接配置
  src/middleware/db/config.js
  修改数据库地址（dbUrl）、数据库名称(dbName)
  如：
    dbUrl: 'mongodb://localhost:27017/'
    dbName: 'test'
 ## 开启本地服务，默认为localhost:3000/api/swagger-ui
 npm run start

## 使用步骤

1、调用接口 "/api/autoGenerate/add"
  params = {
    collectionName: '集合名称',
    jsonStr: {"name":"test", "sex": 1, "address": "地址"}  // 添加一条数据的json字符串 （暂时弃用，可根据需求修改）
  }
2、刷新页面即可看到刚添加的集合 api接口

## 相关技术文档
  koa https://koa.bootcss.com
  swagger https://swagger.io

#赞助TA

![](https://github.com/xiaolinFang/koa-swagger-mongodb/tree/master/src/public/images/sponsorship.png)
