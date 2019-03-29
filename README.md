# koa + swagger + mongodb api开发框架
 实现后端api开发封装，调用autoGenerate 接口可自动创建数据集合及对应增、删、改、查接口

 ## **项目使用**
 ``` bash
 # 安装项目依赖
 npm install

 # 开启本地服务，默认为localhost:3000/api/swagger-ui
 npm run start

# 使用步骤

1、调用接口 "/api/autoGenerate/add"
  params = {
    collectionName: '集合名称',
    jsonStr: {"name":"test", "sex": 1, "address": "地址"}  // 添加一条数据的json字符串 （暂时弃用，可根据需求修改）
  }
2、刷新页面即可看到刚添加的集合 api接口
