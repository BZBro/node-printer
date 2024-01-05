const Koa = require('koa');
const Router = require('@koa/router');
const { bodyParser } = require("@koa/bodyparser");
// const { bodyParser } = require('koa-body');
const cors = require('@koa/cors');
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
      const { autoPrint, fontSize, fontWeight } = ctx.request.body;
      if (typeof autoPrint === 'boolean') {
        util.setConfigValue(`server.auto.printImage`, autoPrint);
      }
      if (fontSize) {
        util.setConfigValue(`server.image.fontSize`, fontSize);
      }
      if (fontWeight) {
        util.setConfigValue(`server.image.fontWeight`, fontWeight);
      }
      
      ctx.body = {
        success: true,
        data: util.getConfig()
      }
      next()
    })

    //
    router.post('/print', async (ctx, next) => {
      let { deviceId, fontSize, fontWeight } = ctx.request.body;
      if (!fontSize) {
        fontSize = util.getConfigValue('server.image.fontSize');
      }
      if (!fontWeight) {
        fontWeight = util.getConfigValue('server.image.fontWeight');
      }
      await util.genImage(deviceId, DotNumbers['24MM'], fontSize, fontWeight)
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
      // const file = fs.existsSync(util.getPreviewPath(deviceId));
      const file = false;
      if (file) {
        const d = fs.createReadStream(util.getPreviewPath(deviceId));
        ctx.response.set("content-type", "image/png");
        ctx.body = d;
        return next()
      }
      await util.genImage(deviceId, DotNumbers['24MM'], parseInt(fontSize), parseInt(fontWeight))
      const d = fs.createReadStream(util.getPreviewPath(deviceId));
      ctx.response.set("content-type", "image/png");
      ctx.body = d;
      return next()
    })

    app.use(bodyParser())
      .use(cors())
      .use(router.allowedMethods())
      .use(router.routes())
      

    app.listen(config.http.port, config.http.host, () => {
      console.log(`Http listening : ${config.http.host}:${config.http.port}`);
    })
  }
}

module.exports = {
  Web
}