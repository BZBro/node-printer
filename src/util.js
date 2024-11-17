const path = require('path')
const fs = require('fs')
const bwipjs = require("bwip-js");
const textToImage = require('text-to-image');
const sharp = require("sharp");
const YAML = require('yaml');
const { config } = require('process');

const DotNumbers = {
    "18MM": 112,
    "24MM": 128
}

class Util {

    static async genImage(deviceId, dotNumbers = DotNumbers['24MM'], fontSize, fontWeight) {
        if (Number.isNaN(fontSize)) {
            fontSize = this.getConfigValue('server.image.fontSize');
        }
        if (Number.isNaN(fontWeight)) {
            fontWeight = this.getConfigValue('server.image.fontWeight');
        }
        await this.genDeviceIdImage(deviceId, dotNumbers, fontSize, fontWeight);
        await this.genQrCodeImage(deviceId, dotNumbers);
        const deviceSharp = sharp(this.getDeviceIdImage(deviceId));
        // await deviceSharp
        //     .composite([
        //         {
        //             input: this.getQrCodeImage(deviceId),
        //             top: 5,
        //             // left: ((DotNumbers['24MM'] - DotNumbers['18MM'])) / 2
        //             left: 0,
        //         }
        //     ])
        //     .toFile(this.getCombinedPath(deviceId))

        // // 这个是用于打印的图
        // await sharp(this.getCombinedImage(deviceId))
        //     .resize({
        //         position: 'bottom',
        //     })
        //     .toFile(this.getCombinedPath(deviceId))

        // // 生成用于预览的图
        // await sharp(this.getCombinedImage(deviceId))
        //     .flip()
        //     .rotate(270)
        //     .toFile(this.getPreviewPath(deviceId))
    }

    static async genSensorUUID(deviceId, dotNumbers = DotNumbers['24MM'], fontSize, fontWeight) {
        if (Number.isNaN(fontSize)) {
            fontSize = this.getConfigValue('server.image.fontSize');
        }
        if (Number.isNaN(fontWeight)) {
            fontWeight = this.getConfigValue('server.image.fontWeight');
        }
        await this.genSensorUUIDImage(deviceId, dotNumbers, fontSize, fontWeight);

        // // 这个是用于打印的图
        // await sharp(this.getSensorIdImage(deviceId))
        //     .resize({
        //         position: 'bottom',
        //     })
        //     .toFile(this.getCombinedPath(deviceId))

        // // 生成用于预览的图
        // await sharp(this.getCombinedImage(deviceId))
        //     .flip()
        //     .rotate(270)
        //     .toFile(this.getPreviewPath(deviceId))
    }

    static getPreviewImage(deviceId) {
        return fs.readFileSync(this.getPreviewPath(deviceId));
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

    static getSensorIdImage(deviceId) {
        return fs.readFileSync(this.getSensorIdPath(deviceId))
    }

    static getPreviewPath(deviceId) {
        return path.join(process.cwd(), `/images/preview/${deviceId.toLowerCase()}.png`)
    }

    static getCombinedPath(deviceId) {
        return path.join(process.cwd(), `/images/combined/${deviceId.toLowerCase()}.png`)
    }

    static getDeviceIdPath(deviceId) {
        return path.join(process.cwd(), `/images/devices/${deviceId.toLowerCase()}.png`)
    }

    static getSensorIdPath(deviceId) {
        return path.join(process.cwd(), `/images/sensors/${deviceId.toLowerCase()}.png`)
    }

    static getQrCodePath(deviceId) {
        return path.join(process.cwd(), `/images/qrcodes/${deviceId.toLowerCase()}.png`)
    }

    static async genQrCodeImage(deviceId, dotNumbers) {
        const dayStr = new Date().toISOString().substring(2, 10);
        const shortDayStr = dayStr.split('-').join('');
        const batchId = 'IDS'
        const IPremainder = parseInt(deviceId, 16) % 3;
        const defaultIp = '192.168.1.' + (IPremainder ? IPremainder + 100 : 103).toString()

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

    static async genSensorUUIDImage(deviceId, dotNumbers, fontSize, fontWeight) {
        await textToImage.generate(`ID: ${deviceId.toUpperCase()}`, {
            debug: true,
            textAlign: 'left',
            fontSize,
            fontWeight,
            debugFilename: this.getSensorIdPath(deviceId)
        });

        let deviceSharpHeight = 280;
        switch (fontSize) {
            case 10:
                deviceSharpHeight = 280;
                break;
            case 11:
                deviceSharpHeight = 292;
                break;
            case 12:
                deviceSharpHeight = 308;
                break;
            case 14:
                deviceSharpHeight = 340;
                break;
            case 15:
                deviceSharpHeight = 360;
                break;
            case 16:
                deviceSharpHeight = 370;
                break;
            case 17:
                deviceSharpHeight = 380;
                break;
            case 18:
                deviceSharpHeight = 398;
                break;
            case 19:
                deviceSharpHeight = 408;
                break;
            case 20:
                deviceSharpHeight = 424;
                break;
            default:
                break;
        }

        if (fontWeight < 600) {
            deviceSharpHeight -= 20;
        }

        await sharp(fs.readFileSync(this.getSensorIdPath(deviceId)))
            .rotate(270)
            .flip()
            .resize(dotNumbers, deviceSharpHeight, {
                position: 'bottom',
            })
            .extract({
                left: 0,
                top: 0,
                width: dotNumbers,
                height: deviceSharpHeight
            }) // 移除旁边的空白 10px
            .toFile(this.getSensorIdPath(deviceId))

        const deviceSharp = sharp(this.getSensorIdImage(deviceId) );
        await deviceSharp
            .png()
            // .composite([
            //     {
            //         input: fs.readFileSync(path.join(process.cwd(), `/images/others/rectangle.png`)),
            //         // top: 0,
            //         // left: ((DotNumbers['24MM'] - DotNumbers['18MM'])) / 2,
            //         blend: 'multiply'
            //     }
            // ])
            .toFile(this.getSensorIdPath(deviceId))

        //     | 'clear'
        // | 'source'
        // | 'over'
        // | 'in'
        // | 'out'
        // | 'atop'
        // | 'dest'
        // | 'dest-over'
        // | 'dest-in'
        // | 'dest-out'
        // | 'dest-atop'
        // | 'xor'
        // | 'add'
        // | 'saturate'
        // | 'multiply'
        // | 'screen'
        // | 'overlay'
        // | 'darken'
        // | 'lighten'
        // | 'color-dodge'
        // | 'colour-dodge'
        // | 'color-burn'
        // | 'colour-burn'
        // | 'hard-light'
        // | 'soft-light'
        // | 'difference'
        // | 'exclusion';

        return deviceSharp;

    }

    static async genDeviceIdImage(deviceId, dotNumbers, fontSize, fontWeight) {
        const IPremainder = parseInt(deviceId, 16) % 3;
        const defaultIp = '192.168.1.' + (IPremainder ? IPremainder + 100 : 103).toString()
        await textToImage.generate(`${deviceId.toUpperCase()}\n${defaultIp}`, {
            debug: true,
            textAlign: 'left',
            fontSize,
            fontWeight,
            margin: 2,
            // customHeight: 200,
            debugFilename: this.getDeviceIdPath(deviceId)
        });

        let deviceSharpHeight = 300;
        switch (fontSize) {
            case 10:
                deviceSharpHeight = 280;
                break;
            case 11:
                deviceSharpHeight = 292;
                break;
            case 12:
                deviceSharpHeight = 308;
                break;
            case 14:
                deviceSharpHeight = 340;
                break;
            case 15:
                deviceSharpHeight = 360;
                break;
            case 16:
                deviceSharpHeight = 370;
                break;
            case 17:
                deviceSharpHeight = 380;
                break;
            case 18:
                deviceSharpHeight = 398;
                break;
            case 19:
                deviceSharpHeight = 408;
                break;
            case 20:
                deviceSharpHeight = 424;
                break;
            default:
                break;
        }

        if (fontWeight < 600) {
            deviceSharpHeight -= 20;
        }

        const deviceSharp = await sharp(fs.readFileSync(this.getDeviceIdPath(deviceId)))
            .rotate(270)
            .flip()
            .resize(dotNumbers, 174, {
                position: 'bottom',
            })
            .extract({
                left: 0,
                top: 0,
                width: dotNumbers,
                height: 174
            }) // 移除旁边的空白 10px
            .toFile(this.getDeviceIdPath(deviceId))

        return deviceSharp;
    }


    static getConfig() {
        if (this.config) {
            return this.config
        }
        const config = YAML.parse(fs.readFileSync(path.join(process.cwd(), '/nodeprinter.yaml'), 'utf-8'));
        return config;
    }

    static getImpl(object, property) {
        let elems = Array.isArray(property) ? property : property.split('.')
        let name = elems[0]
        const value = object[name]
        if (elems.length <= 1) {
            return value;
        }
        // Note that typeof null === 'object'
        if (value === null || typeof value !== 'object') {
            return undefined;
        }
        return this.getImpl(value, elems.slice(1));
    };

    static getConfigValue(property) {
        if (property === null || property === undefined) {
            console.error("Calling config.get with null or undefined argument");
            return;
        }

        // Make configurations immutable after first get (unless disabled)
        const config = this.getConfig();
        const value = this.getImpl(config, property);

        // Produce an exception if the property doesn't exist
        if (value === undefined) {
            console.error('Configuration property "' + property + '" is not defined');
            return undefined;
        }

        // Return the value
        return value;
    };

    static setImpl(object, key, value) {
        let keys = Array.isArray(key) ? key : key.split('.')
        let name = keys[0]

        let evalString = 'object';
        for (let i = 0; i < keys.length; i++) {
            const element = keys[i];
            if (i === keys.length - 1) {
                evalString += `['${keys[i]}'] = ${JSON.stringify(value)}`;
                continue;
            } else {
                evalString += `['${keys[i]}']`;
            }
        }

        const res = eval(evalString)
        return object;
    };

    static setConfigValue(key, value) {
        if (key === null || key === undefined) {
            console.error("Calling config.get with null or undefined argument");
        }
        const config = this.getConfig();
        const newConfig = this.setImpl(config, key, value);
        if (newConfig) {
            fs.writeFileSync(path.join(process.cwd(), '/nodeprinter.yaml'), YAML.stringify(newConfig));
            this.resetConfig()
        }
        return true
    }

    static resetConfig() {
        this.config = null;
        return true;
    }
}


module.exports = {
    util: Util,
    DotNumbers
}