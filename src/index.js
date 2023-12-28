
const Printer = require('./Printer');
const { util } = require('./util');
const { Web } = require('./web');


// 1mm => 6 lines, each line has 16 bytes, 
// 4

run();

async function run() {

    Web.start();

    const connected = await Printer.printer.isConnected();
    if (connected) {
        
    } else {
        return '无法连接到打印机'
    }
}