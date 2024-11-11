const escpos = require('escpos');
const { encode } = require('@fiahfy/packbits');

const BnadWidth = {
    "18MM": 18,
    "24MM": 24
}

class RasterImage {
    constructor(url, bandwidth) {
        this.bandwidth = bandwidth;
        this.buffer = Buffer.alloc(0);
        this.url = url;
        return this;
    }

    async getData() {
        this.image = await this.loadImage(this.url);
        const rasterData = this.image.toRaster();
        const height = rasterData.height;
        // refer to https://download.brother.com/welcome/docp000771/cv_pth500p700e500_eng_raster_111.pdf
        // header
        this.append(Buffer.from([0x1B, 0x69, 0x61, 0x01]));
        // this.append(Buffer.from([0x1b, 0x69, 0x55, 0x4a, 0x00, 0x0c, 0x0c, 0x96, 0xe6, 0xb5, 0x66, 0xa0, 0x00, 0x00, 0x23, 0x00, 0x00, 0x00]));
        this.append(Buffer.from([0x1B, 0x69, 0x7A, 0x00, 0x00, this.bandwidth, 0x00, height, 0x00, 0x00, 0x00, 0x00, 0x00]));
        this.append(Buffer.from([0x1B, 0x69, 0x4D, 0x40]))
        this.append(Buffer.from([0x1B, 0x69, 0x4B, 0x00]))
        this.append(Buffer.from([0x1B, 0x69, 0x64, 0x0E, 0x00]))
        this.append(Buffer.from([0x4D, 0x02]))

        // body
        for (let i = 0; i < height; i++) {
            const header = Buffer.from([0x47]);
            const rasterLineData = Buffer.from(rasterData.data.slice(i * 16, i * 16 + 16))
            const packData = encode(rasterLineData);
            const lengthData = Buffer.from([packData.length, 0x00]);
            const lineData = Buffer.concat([header, lengthData, packData]);
            this.append(lineData)
        }

        // tail
        this.append(Buffer.from([0x1A]));
        return this.buffer;
    }

    async loadImage(url) {
        return new Promise((resolve) => {
            escpos.Image.load(url, (image, error) => {
                if (image) {
                    resolve(image);
                }
            })
        })
    };

    append(appendBuffer) {
        this.buffer = Buffer.concat([this.buffer, appendBuffer]);
    }
}

module.exports = {
    raster: RasterImage,
    BnadWidth
}