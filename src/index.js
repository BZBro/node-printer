
const Printer = require('./Printer');
const { Web } = require('./web');
const path = require('path')

run();

async function run() {

    Web.start();

    const connected = await Printer.printer.isConnected();
    if (connected) {
        console.log('Printer connected.');
    } else {
        return '无法连接到打印机'
    }
}