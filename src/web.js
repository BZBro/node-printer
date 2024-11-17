const Koa = require('koa');
const Router = require('@koa/router');
const { bodyParser } = require("@koa/bodyparser");
const serve = require('koa-static')
// const { bodyParser } = require('koa-body');
const cors = require('@koa/cors');
const fs = require('fs');
const { util, DotNumbers } = require('./util');
const { printer } = require('./Printer');
const path = require('path');

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

    router.get('/controller', (ctx, next) => {
      return ctx.redirect('/')
    })

    router.get('/sensor', (ctx, next) => {
      return ctx.redirect('/')
    })

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
    router.post('/print-sensor-uuid', async (ctx, next) => {
      let { deviceId, fontSize, fontWeight } = ctx.request.body;
      if (!fontSize) {
        fontSize = util.getConfigValue('server.sensor.fontSize');
      }
      if (!fontWeight) {
        fontWeight = util.getConfigValue('server.sensor.fontWeight');
      }
      await util.genSensorUUID(deviceId, DotNumbers['24MM'], fontSize, fontWeight)
      const res = await printer.printSensorUUID(deviceId);
      ctx.body = {
        success: true,
        data: res
      }
      return next()
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


    // 获取sensor 图片
    router.get('/static/sensors', async (ctx, next) => {
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
      const file = fs.existsSync(util.getSensorIdPath(deviceId));
      if (file) {
        const d = fs.createReadStream(util.getSensorIdPath(deviceId));
        ctx.response.set("content-type", "image/png");
        ctx.body = d;
        return next()
      }
      await util.genSensorUUID(deviceId, DotNumbers['24MM'], parseInt(fontSize), parseInt(fontWeight))
      const d = fs.createReadStream(util.getSensorIdPath(deviceId));
      ctx.response.set("content-type", "image/png");
      ctx.body = d;
      return next()
    })


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
    const staticOptions = {
      dir: 'public/dist',
      // Browser cache max-age in milliseconds. defaults to 0
      maxage: 0,
      // Allow transfer of hidden files. defaults to false
      hidden: false,
      // Default file name, defaults to 'index.html'
      index: 'index.html',
      // If true, serves after return next(), allowing any downstream middleware to respond first.
      defer: false,
      // Try to serve the gzipped version of a file automatically when gzip is supported by a client and if the requested file with .gz extension exists. defaults to true.
      gzip: true,
      // Try to serve the brotli version of a file automatically when brotli is supported by a client and if the requested file with .br extension exists (note, that brotli is only accepted over https). defaults to true.
      br: true,
      // Function to set custom headers on response.
      setHeaders: () => {},
      // Try to match extensions from passed array to search for file when no extension is sufficed in URL. First found is served. (defaults to false)
      extensions: false
    }


    app.use(cors())

    const a = path.join(process.cwd(), '/dist')
    app.use(serve(a, staticOptions))
    app.use(bodyParser())
    app.use(router.routes())
    app.use(router.allowedMethods())
    
    


    app.listen(config.http.port, () => {
      console.log(`Http listening : http://${config.http.host}:${config.http.port}`);
    })
  }
}

module.exports = {
  Web
}