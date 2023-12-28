const rawPrinter = require('@woovi/node-printer')
const nodeThermalPrinter = require("node-thermal-printer")
const { util, DotNumbers } = require('./util');
const { raster, BnadWidth } = require('./raster');

class Printer {

  static printer = null;

  static getPrinter() {

    if (this.printer) {
      return this.printer;
    }

    const name = rawPrinter.getDefaultPrinterName();

    let printer = new nodeThermalPrinter.ThermalPrinter({
      type: nodeThermalPrinter.types.BROTHER,
      interface: `printer:${name}`,
      width: 24,
      removeSpecialCharacters: false,
      options: {                                                 // Additional options
        timeout: 5000                                           // Connection timeout (ms) [applicable only for network printers] - default: 3000
      },
      driver: rawPrinter
    });

    this.printer = printer;

    return printer;
  }

  static async isConnected() {
    const connected = await this.getPrinter().isPrinterConnected();
    return connected;
  }

  static async printDeviceId(deviceId) {
    const filePath = util.getCombinedPath(deviceId);
    const imageRawData = await new raster(filePath, BnadWidth['24MM']).getData();
    this.printRawData(imageRawData);
  }

  static async printRawData(buffer) {
    const res = await this.getPrinter().raw(buffer);
    console.log(res);
    return res;
  }
}

module.exports = {
  printer: Printer
}