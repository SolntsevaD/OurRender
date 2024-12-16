function convertImageDataToBitmap(imageData, width, height) {
    const res = new Bitmap(width, height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const r = imageData.data[(x + y * width) * 4];
            const g = imageData.data[(x + y * width) * 4 + 1];
            const b = imageData.data[(x + y * width) * 4 + 2];
            res.pixels[x + y * width] = (r << 16) | (g << 8) | b;
        }
    }
    return res;
}

function convertBitmapToImageData(bitmap, scale) {
    const res = new ImageData(bitmap.width * scale, bitmap.height * scale);
    for (let y = 0; y < bitmap.height; y++) {
        for (let x = 0; x < bitmap.width; x++) {
            const bitmapPixel = bitmap.pixels[x + y * bitmap.width]
            const r = (bitmapPixel >> 16) & 0xff;
            const g = (bitmapPixel >> 8) & 0xff;
            const b = bitmapPixel & 0xff;
            for (let ys = 0; ys < scale; ys++) {
                for (let xs = 0; xs < scale; xs++) {
                    const ptr = ((x * scale) + xs + ((y * scale) + ys) * res.width) * 4;
                    res.data[ptr] = r;
                    res.data[ptr + 1] = g;
                    res.data[ptr + 2] = b;
                    res.data[ptr + 3] = globalAlpha;
                }
            }
        }
    }
    return res;
}

function int(a) {
    return Math.ceil(a);
}

function clamp(v, min, max) {
    return (v < min) ? min : (max < v) ? max : v;
}

function lerp(a, b, per) {
    return a * (1.0 - per) + b * per;
}

function lerpVector2(a, b, per) {
    return a.mul(1 - per).add(b.mul(per));
}

function lerpVector3(a, b, c, w0, w1, w2) {
    const wa = a.mul(w0);
    const wb = b.mul(w1);
    const wc = c.mul(w2);
    return new Vector3(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y, wa.z + wb.z + wc.z);
}

function lerp2AttributeVec3(a, b, w0, w1, z0, z1, z) {
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    return new Vector3(wa.x + wb.x, wa.y + wb.y, wa.z + wb.z);
}

function lerp3AttributeVec2(a, b, c, w0, w1, w2, z0, z1, z2, z) {
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    const wc = c.mul(w2 / z2 * z);
    return new Vector2(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y);
}

function lerp3AttributeVec3(a, b, c, w0, w1, w2, z0, z1, z2, z) {
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    const wc = c.mul(w2 / z2 * z);
    return new Vector3(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y, wa.z + wb.z + wc.z);
}

function convertColor(v) {
    return (v.x << 16) | (v.y << 8) | v.z;
}

function mulColor(c, v) {
    const r = clamp(((c >> 16) & 0xff) * v, 0, 255);
    const g = clamp(((c >> 8) & 0xff) * v, 0, 255);
    const b = clamp((c & 0xff) * v, 0, 255);
    return int((r << 16)) | int(g << 8) | int(b);
}
