/**

* http://mongodb.github.io/node-mongodb-native

* http://mongodb.github.io/node-mongodb-native/3.0/api/
*/

// DB 库
import MongoDB from 'mongodb';
import Config from './config.js';

const MongoClient = MongoDB.MongoClient;
const ObjectID = MongoDB.ObjectID;
const Client = new MongoClient(Config.dbUrl, {
  useNewUrlParser: true
});

class Db {
  static getInstance() {
    if (!Db.instance) {
      Db.instance = new Db();
    }
    return Db.instance;
  }

  constructor() {
    this.dbClient = '';
    this.connect();
  }

  connect() {
    const _that = this;
    return new Promise((resolve, reject) => {
      if (!_that.dbClient) {
        Client.connect((err, client) => {
          if (err) {
            reject(err);
          } else {
            _that.dbClient = client.db(Config.dbName);
            resolve(_that.dbClient);
          }
          // client.close()
        });
      } else {
        resolve(_that.dbClient);
      }
    });
  }

  find(collectionName, json, filterConditions, page, pageSize) {
    const self = this;
    page = page || 0;
    pageSize = pageSize || 0;

    return new Promise((resolve, reject) => {
      self.connect().then(async (db) => {
        // let result = db.collection(collectionName).find(json, filterConditions)
        // TODO: filterConditions 过滤字段显示状态不成功，待解决
        const count = await db
          .collection(collectionName)
          .find(json, filterConditions)
          .count();
        const result =
          page && pageSize
            ? db
              .collection(collectionName)
              .find(json, filterConditions)
              .limit(pageSize)
              .skip((page - 1) * pageSize)
            : db.collection(collectionName).find(json, filterConditions);

        result.toArray((err, docs) => {
          if (err) {
            reject(self.foramtResult(err, 'error'));
            return;
          }
          resolve(self.foramtResult(docs, 'success', null, null, count));
        });
      });
    });
  }
  update(collectionName, json1, json2) {
    return new Promise((resolve, reject) => {
      this.connect().then((db) => {
        db.collection(collectionName).updateMany(
          json1,
          {
            $set: json2
          },
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    });
  }
  upCustomers(collectionName, json1, json2) {
    return new Promise((resolve, reject) => {
      this.connect().then((db) => {
        db.collection(collectionName).updateOne(
          json1,
          json2,
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    });
  }

  insert(collectionName, json) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.connect().then((db) => {
        db.collection(collectionName).insertOne(json, (err, result) => {
          if (err) {
            reject(self.foramtResult(err, 'error'));
          } else {
            resolve(self.foramtResult(result, 'success'));
          }
        });
      });
    });
  }
  insertOneForSpilder(collectionName, json) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.connect().then((db) => {
        db.collection(collectionName).insertOne(json, (err, result) => {
          if (err) {
            reject('添加失败！');
            // console.log('err',err);
            // reject(self.foramtResult(err, 'error'))
          } else {
            resolve('添加成功！');
            // console.log('success',result);
            // resolve(self.foramtResult(result,'success'))
          }
        });
      });
    });
  }
  insertMany(collectionName, json) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.connect().then((db) => {
        db.collection(collectionName).insertMany(json, (err, result) => {
          if (err) {
            reject(self.foramtResult(err, 'error'));
          } else {
            resolve(self.foramtResult(result, 'success'));
          }
        });
      });
    });
  }

  remove(collectionName, json) {
    const self = this;
    return new Promise((resolve, reject) => {
      self.connect().then((db) => {
        db.collection(collectionName).deleteMany(json, (err, result) => {
          if (err) {
            reject(self.foramtResult(err, 'error'));
          } else if (parseInt(result.result.n) > 0) {
            const responseMessage = `success for delete user with ${JSON.stringify(json)}`;
            const response = self.foramtResult(result, 'success'); // ,responseMessage 添加返回消息，则不返回数据库结果数据
            resolve(response);
          } else {
            const message = `fail to delete user with ${JSON.stringify(json)}`;
            const response = self.foramtResult(result, 'error', message);
            resolve(response);
          }
        });
      });
    });
  }

  getObjectId(id) {
    return new ObjectID(id);
  }
  foramtResult(result, type, message, hideData, count) {
    const data = {
      code: type == 'success' ? 200 : 500,
      message: type,
      data: message || result
    };
    if (count) {
      data.count = count;
    }
    return data;
  }
}

module.exports = Db.getInstance();
