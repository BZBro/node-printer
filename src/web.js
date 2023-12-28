const Koa = require('koa');
const Router = require('@koa/router');
const { bodyParser } = require("@koa/bodyparser");
const fs = require('fs');
const { util, DotNumbers } = require('./util');
const { printer } = require('./Printer')

class Web {


  static fontSize = 13;

  static fontWeight = 500;

  static autoPrintImage = false;

  static start() {

    const config = util.getConfig();

    this.fontSize = config.server.image.fontSize;
    this.fontWeight = config.server.image.fontWeight;
    this.autoPrintImage = config.server.auto.printImage;

    const app = new Koa()
    const router = new Router();

    // 获取最新的打印机 状态， 服务器配置
    router.get('/status', (ctx, next) => {
      // isConnected 打印机是否连接

    });

    // 更新配置
    router.post('/update-config', async (ctx, next) => {
      const { config } = ctx.request.body;
      util.setConfigValue(config.key, config.value);
      ctx.body = util.getConfig();
      next()
    })


    // 测试打印
    router.post('/test', async (ctx, next) => {
      const deviceId = 'WISQO TEST LABEL';
      await util.genImage(deviceId, DotNumbers['24MM'], parseInt(fontSize), parseInt(fontWeight))
      const res = await printer.printDeviceId(deviceId);
      ctx.body = {
        success: true,
        data: res
      }
      return next()
    })

    //
    router.post('/print', async (ctx, next) => {
      const { deviceId } = ctx.request.body;
      await util.genImage(deviceId, DotNumbers['24MM'], parseInt(fontSize), parseInt(fontWeight))
      const res = await printer.printDeviceId(deviceId);
      ctx.body = {
        success: true,
        data: res
      }
      return next()
    })


    //

    // 获取图片
    router.get('/static/images', async (ctx, next) => {
      let { deviceId, fontSize, fontWeight } = ctx.request.query;
      if (!deviceId) {
        ctx.body = {
          success: false,
          error: 'Please specify deviceId'
        }
        return next()
      }
      if (!fontSize) {
        fontSize = util.getConfigValue('server.image.fontSize');
      }
      if (!fontWeight) {
        fontWeight = util.getConfigValue('server.image.fontWeight');
      }
      await util.genImage(deviceId, DotNumbers['24MM'], parseInt(fontSize), parseInt(fontWeight))
      const d = fs.createReadStream(util.getPreviewPath(deviceId));
      ctx.response.set("content-type", "image/png");
      ctx.body = d;
      return next()
    })

    app.use(router.routes())
      .use(router.allowedMethods())
      .use(bodyParser());

    app.listen(config.http.port, config.http.host, () => {
      console.log(`Http listening : ${config.http.host}:${config.http.port}`);
    })
  }
}

module.exports = {
  Web
}