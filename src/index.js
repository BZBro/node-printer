
const Printer = require('./Printer');
const { Web } = require('./web');

run();

async function run() {

    Web.start();

    const connected = await Printer.printer.isConnected();
    if (connected) {
        
    } else {
        return '无法连接到打印机'
    }
}