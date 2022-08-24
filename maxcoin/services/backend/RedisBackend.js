/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty-function */
const CoinAPI = require('../CoinAPI');
const Redis = require('ioredis');

class RedisBackend {

  constructor() {
    this.coinAPI = new CoinAPI();
    this.client = null
  }

  async connect() {
    this.client = new Redis(7379);
    return this.client;
  }

  async disconnect() {
    return this.client.disconnect();
  }

  async insert() {
    const data = await this.coinAPI.fetch();
    const values = [];
    Object.entries(data.bpi).forEach((entries) => {
      values.push(entries[1]);
      values.push(entries[0]);
    });
    return this.client.zadd('maxcoin:values', values);
  }

  async getMax() {
    return this.client.zrange('maxcoin:values', -1, -1, 'WITHSCORES');
  }

  async max() {
    console.info("Connection to redis");
    console.time("redis-connect");
    const client = this.connect();
    if (client) {
      console.info("Successfully connected to redis");
    } else {
      throw new Error("Connecting to redis failed");
    }
    console.timeEnd("redis-connect");

    console.info("Inserting into redis");
    console.time("redis-insert");
    const insertResult = await this.insert();
    console.timeEnd("redis-insert");
    console.info(`Inserted ${insertResult.result} documents in redis `);

    console.info("Querying redis");
    console.time("redis-find");
    const result = await this.getMax();
    console.timeEnd("redis-find")

    console.info("Disconnecting from redis");
    console.time("redis-disconnect");

    await this.disconnect();
    console.timeEnd("redis-disconnect");
    return result;
  }
}

module.exports = RedisBackend;