const rawPrinter = require('@woovi/node-printer')
const nodeThermalPrinter = require("node-thermal-printer")
const { util, DotNumbers } = require('./util');
const { raster, BnadWidth } = require('./raster');


// 1mm => 6 lines, each line has 16 bytes, 
// 4

const name = rawPrinter.getDefaultPrinterName()

let printer = new nodeThermalPrinter.ThermalPrinter({
    type: nodeThermalPrinter.types.BROTHER,
    interface: `printer:${name}`,
    width: 24,
    // characterSet: 'WISQO',
    removeSpecialCharacters: false,
    options: {                                                 // Additional options
        timeout: 5000                                           // Connection timeout (ms) [applicable only for network printers] - default: 3000
    },
    driver: rawPrinter
});


run();

async function run() {
    const connected = await printer.isPrinterConnected();
    if (connected) {

        const deviceId = 'FF888888';

        await util.genImage(deviceId, DotNumbers['24MM'])

        // const filePath = path.join(process.cwd(), "/src/tmp.png");
        const filePath = util.getCombinedPath(deviceId);
        // const filePath = util.getQrCodePath(deviceId)
        
        const imageRawData = await new raster(filePath, BnadWidth['24MM']).getData();

        // rawPrinter.printDirect({
        //     data: imageRawData,
        //     type: "RAW",
        //     success: function (jobId) {
        //         console.log("SUCCESS", jobId)
        //     },
        //     error: function (err) {
        //         console.log("ERROR", err)
        //     }
        // });
        console.log('exit');
    }
}