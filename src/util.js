const path = require('path')
const fs = require('fs')
const bwipjs = require("bwip-js");
const png = require('pngjs')
const textToImage = require('text-to-image');
const sharp = require("sharp")

const DotNumbers = {
    "18MM": 112,
    "24MM": 128
}

class Util {

    static async genImage(deviceId, dotNumbers, fontSize = 13, fontWeight = 500) {
        await this.genDeviceIdImage(deviceId, dotNumbers, fontSize, fontWeight);
        await this.genQrCodeImage(deviceId, dotNumbers);

        const qrSharp = sharp(this.getQrCodeImage(deviceId));
        const deviceSharp = sharp(this.getDeviceIdImage(deviceId));

        await deviceSharp
            .composite([
                {
                    input: this.getQrCodeImage(deviceId),
                    top: 225,
                    left: ((DotNumbers['24MM'] - DotNumbers['18MM'])) / 2
                }
            ])
            .toFile(this.getCombinedPath(deviceId))

        await sharp(this.getCombinedImage(deviceId))
        .resize(dotNumbers, 295, {
            position: 'bottom',
        })
        .toFile(this.getCombinedPath(deviceId))
    }

    static getQrCodeImage(deviceId) {
        return fs.readFileSync(this.getQrCodePath(deviceId));
    }

    static getDeviceIdImage(deviceId) {
        return fs.readFileSync(this.getDeviceIdPath(deviceId));
    }

    static getCombinedImage(deviceId) {
        return fs.readFileSync(this.getCombinedPath(deviceId))
    }

    static getCombinedPath(deviceId) {
        return path.join(process.cwd(), `/images/combined/${deviceId.toLowerCase()}.png`)
    }

    static getDeviceIdPath(deviceId) {
        return path.join(process.cwd(), `/images/devices/${deviceId.toLowerCase()}.png`)
    }

    static getQrCodePath(deviceId) {
        return path.join(process.cwd(), `/images/qrcodes/${deviceId.toLowerCase()}.png`)
    }

    static async genQrCodeImage(deviceId, dotNumbers) {
        const dayStr = new Date().toISOString().substring(2, 10);
        const shortDayStr = dayStr.split('-').join('');
        const batchId = 'IDS'
        const IPremainder = parseInt(deviceId, 16) % 3;
        const defaultIp = '192.168.100.' + (IPremainder ? IPremainder + 100 : 103).toString()

        const res = await bwipjs.toBuffer(
            {
                bcid: "qrcode", // Barcode type
                text: `${shortDayStr}/${batchId}/${defaultIp}/${deviceId}`, // Text to encode
                scale: 1, // 3x scaling factor
                width: 140 / 72 * 25.4,
                height: 140 / 72 * 25.4, // Bar height, in millimeters
            }
        );

        if (res instanceof Error) {
            throw res;
        }

        const filePath = this.getQrCodePath(deviceId);
        const qrSharp = sharp(res).resize(DotNumbers['18MM'], DotNumbers['18MM']).flip().flop().toFile(filePath);
        return qrSharp;
    }

    static async genDeviceIdImage(deviceId, dotNumbers, fontSize, fontWeight) {
        const IPremainder = parseInt(deviceId, 16) % 3;
        const defaultIp = '192.168.100.' + (IPremainder ? IPremainder + 100 : 103).toString()
        await textToImage.generate(`${deviceId.toUpperCase()}\n${defaultIp}`, {
            debug: true,
            textAlign: 'left',
            fontSize,
            fontWeight,
            debugFilename: this.getDeviceIdPath(deviceId)
        });

        const deviceSharp = await sharp(fs.readFileSync(this.getDeviceIdPath(deviceId)))
            .rotate(270)
            .flip()
            .resize(dotNumbers, 530, {
                position: 'bottom',
            })
            .extract({ 
                left: 0,
                top: 0 ,
                width: dotNumbers,
                height: 520
             })
            .toFile(this.getDeviceIdPath(deviceId))

        return deviceSharp;
    }
}


module.exports = {
    util: Util,
    DotNumbers
}