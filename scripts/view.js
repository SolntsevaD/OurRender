class View extends Bitmap {
    constructor(width, height) {
        super(width, height);
        this.zBuffer = new Float32Array(width * height);
        this.sunIntensity = 3.0;
        this.sunPosRelativeToZero = new Vector3(1, 1, 1).normalized();
        this.ambient = 0.2;
    }

    update(delta) {
        let matrix = new Matrix4().rotate(0, delta, 0);
        this.sunPosRelativeToZero = matrix.mulVector(this.sunPosRelativeToZero, 0);
        this.sunDirVS = player.cameraTransform.mulVector(this.sunPosRelativeToZero.mul(-1), 0);
    }

    renderView() {
        for (let i = 0; i < this.zBuffer.length; i++)
            this.zBuffer[i] = 100000;

        const r = new Random(123);
        const s = 30.0;
        let tex;

        renderFlag = 0;
        for (let i = 0; i < 100; i++) {
            if (i % 2 == 0) tex = textures.pepe;
            else tex = textures.dulri;

            const pos = new Vector3(r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0);
            this.drawCube(pos, new Vector3(1, 1, 1), tex, false, true);
        }

        renderFlag = RENDER_FACE_NORMAL;
        this.drawLine(new Vertex(this.sunPosRelativeToZero.mul(3).add(new Vector3(0, 0, -3)), 0xff0000), new Vertex(new Vector3(0, 0, -3), 0x00ff00));
        this.drawCube(new Vector3(0, 0, -3), new Vector3(1, 1, 1), textures.pepe, true);
        this.drawSkyBox(time / 100.0);
    }

    drawPoint(v) {
        v = this.playerTransform(v);
        if (v.pos.z < zClipNear) return;
        const sx = int((v.pos.x / v.pos.z * FOV + WIDTH / 2.0));
        const sy = int((v.pos.y / v.pos.z * FOV + HEIGHT / 2.0));
        this.renderPixel(new Vector3(sx, sy, v.pos.z), v.color);
    }

    drawLine(v0, v1) {
        v0 = this.playerTransform(v0);
        v1 = this.playerTransform(v1);
        if (v0.pos.z < zClipNear && v1.pos.z < zClipNear) return undefined;
        if (v0.pos.z < zClipNear) {
            let per = (zClipNear - v0.pos.z) / (v1.pos.z - v0.pos.z);
            v0.pos = v0.pos.add(v1.pos.sub(v0.pos).mul(per));
            v0.color = lerpVector2(v0.color, v1.color, per);
        }
        if (v1.pos.z < zClipNear) {
            let per = (zClipNear - v1.pos.z) / (v0.pos.z - v1.pos.z);
            v1.pos = v1.pos.add(v0.pos.sub(v1.pos).mul(per));
            v1.color = lerpVector2(v1.color, v0.color, per);
        }
        let p0 = new Vector2(v0.pos.x / v0.pos.z * FOV + WIDTH / 2.0 - 0.5, v0.pos.y / v0.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        let p1 = new Vector2(v1.pos.x / v1.pos.z * FOV + WIDTH / 2.0 - 0.5, v1.pos.y / v1.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        if (p1.x < p0.x) {
            let tmp = p0;
            p0 = p1;
            p1 = tmp;
            tmp = v0;
            v0 = v1;
            v1 = tmp;
        }
        let x0 = Math.ceil(p0.x);
        let y0 = Math.ceil(p0.y);
        let x1 = Math.ceil(p1.x);
        let y1 = Math.ceil(p1.y);
        if (x0 < 0) x0 = 0;
        if (x1 > WIDTH) x1 = WIDTH;
        if (y0 < 0) y0 = 0;
        if (y1 > HEIGHT) y1 = HEIGHT;
        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;
        let m = Math.abs(dy / dx);
        if (m <= 1) {
            for (let x = x0; x < x1; x++) {
                let per = (x - p0.x) / (p1.x - p0.x);
                let y = p0.y + (p1.y - p0.y) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);
                let c = lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);
                this.renderPixel(new Vector3(int(x), int(y), z), c);
            }
        } else {
            if (p1.y < p0.y) {
                let tmp = p0;
                p0 = p1;
                p1 = tmp;
                tmp = v0;
                v0 = v1;
                v1 = tmp;
            }
            x0 = Math.ceil(p0.x);
            y0 = Math.ceil(p0.y);
            x1 = Math.ceil(p1.x);
            y1 = Math.ceil(p1.y);
            if (x0 < 0) x0 = 0;
            if (x1 > WIDTH) x1 = WIDTH;
            if (y0 < 0) y0 = 0;
            if (y1 > HEIGHT) y1 = HEIGHT;
            for (let y = y0; y < y1; y++) {
                let per = (y - p0.y) / (p1.y - p0.y);
                let x = p0.x + (p1.x - p0.x) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);
                let c = lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);
                this.renderPixel(new Vector3(int(x), int(y), z), c);
            }
        }
        return { x0: x0, y0: y0, x1: x1, y1: y1 };
    }

    drawTriangle(v0, v1, v2, tex) {
        if (tex == undefined) tex = textures.sample0;
        if ((renderFlag & 1) == 1) {
            const tmp = v0;
            v0 = v1;
            v1 = tmp;
        }
        if (v0.normal == undefined || v1.normal == undefined || v2.normal == undefined) {
            const normal = v2.pos.sub(v0.pos).cross(v1.pos.sub(v0.pos)).normalized();
            v0.normal = normal;
            v1.normal = normal;
            v2.normal = normal;
        }
        if (((renderFlag >> 2) & 0xf) == 1) {
            const center = v0.pos.add(v1.pos.add(v2.pos)).div(3.0);
            this.drawLine(new Vertex(center, 0xffffff), new Vertex(center.add(v0.normal.mul(0.3)), 0xff00ff));
        }
        v0 = this.playerTransform(v0);
        v1 = this.playerTransform(v1);
        v2 = this.playerTransform(v2);
        if (v0.pos.z < zClipNear && v1.pos.z < zClipNear && v2.pos.z < zClipNear) return;
        else if (v0.pos.z > zClipNear && v1.pos.z > zClipNear && v2.pos.z > zClipNear) {
            this.drawTriangleVS(v0, v1, v2, tex);
            return;
        }
        const vps = [v0, v1, v2, v0];
        let drawVertices = [];
        for (let i = 0; i < 3; i++) {
            const cv = vps[i];
            const nv = vps[i + 1];
            const cvToNear = cv.pos.z - zClipNear;
            const nvToNear = nv.pos.z - zClipNear;
            if (cvToNear < 0 && nvToNear < 0) continue;
            if (cvToNear * nvToNear < 0) {
                const per = (zClipNear - cv.pos.z) / (nv.pos.z - cv.pos.z);
                const clippedPos = cv.pos.add(nv.pos.sub(cv.pos).mul(per));
                const clippedCol = cv.color.add(nv.color.sub(cv.color).mul(per));
                const clippedTxC = cv.texCoord.add(nv.texCoord.sub(cv.texCoord).mul(per));
                if (cvToNear > 0) drawVertices.push(cv);
                drawVertices.push(new Vertex(clippedPos, clippedCol, clippedTxC, cv.normal));
            } else {
                drawVertices.push(cv);
            }
        }
        switch (drawVertices.length) {
            case 3:
                this.drawTriangleVS(drawVertices[0], drawVertices[1], drawVertices[2], tex)
                break;
            case 4:
                this.drawTriangleVS(drawVertices[0], drawVertices[1], drawVertices[2], tex)
                this.drawTriangleVS(drawVertices[0], drawVertices[2], drawVertices[3], tex)
                break;
        }
    }

    drawTriangleVS(vp0, vp1, vp2, tex) {
        const z0 = vp0.pos.z;
        const z1 = vp1.pos.z;
        const z2 = vp2.pos.z;
        const p0 = new Vector2(vp0.pos.x / vp0.pos.z * FOV + WIDTH / 2.0 - 0.5, vp0.pos.y / vp0.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        const p1 = new Vector2(vp1.pos.x / vp1.pos.z * FOV + WIDTH / 2.0 - 0.5, vp1.pos.y / vp1.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        const p2 = new Vector2(vp2.pos.x / vp2.pos.z * FOV + WIDTH / 2.0 - 0.5, vp2.pos.y / vp2.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        let minX = Math.ceil(Math.min(p0.x, p1.x, p2.x));
        let maxX = Math.ceil(Math.max(p0.x, p1.x, p2.x));
        let minY = Math.ceil(Math.min(p0.y, p1.y, p2.y));
        let maxY = Math.ceil(Math.max(p0.y, p1.y, p2.y));
        if (minX < 0) minX = 0;
        if (minY < 0) minY = 0;
        if (maxX > WIDTH) maxX = WIDTH;
        if (maxY > HEIGHT) maxY = HEIGHT;
        const v10 = new Vector2(p1.x - p0.x, p1.y - p0.y);
        const v21 = new Vector2(p2.x - p1.x, p2.y - p1.y);
        const v02 = new Vector2(p0.x - p2.x, p0.y - p2.y);
        const v20 = new Vector2(p2.x - p0.x, p2.y - p0.y);
        const area = v10.cross(v20);
        if (area < 0) return;
        let depthMin = 0;
        let lightCalc = true;
        if (((renderFlag >> 1) & 1) == 1) depthMin = 9999;
        if (((renderFlag >> 3) & 1) == 1) lightCalc = false;
        for (let y = minY; y < maxY; y++) {
            for (let x = minX; x < maxX; x++) {
                let p = new Vector3(x, y);
                let w0 = v21.cross(p.sub(p1));
                let w1 = v02.cross(p.sub(p2));
                let w2 = v10.cross(p.sub(p0));
                if (w0 >= 0 && w1 >= 0 && w2 >= 0) {
                    w0 /= area;
                    w1 /= area;
                    w2 /= area;
                    const z = 1.0 / (w0 / z0 + w1 / z1 + w2 / z2);
                    const t = lerp3AttributeVec2(vp0.texCoord, vp1.texCoord, vp2.texCoord, w0, w1, w2, z0, z1, z2, z);
                    const n = lerp3AttributeVec3(vp0.normal, vp1.normal, vp2.normal, w0, w1, w2, z0, z1, z2, z);
                    let tx = Math.floor(tex.width * t.x);
                    let ty = Math.floor(tex.height * t.y);
                    if (tx < 0) tx = 0;
                    if (tx >= tex.width) tx = tex.width - 1;
                    if (ty < 0) ty = 0;
                    if (ty >= tex.height) ty = tex.height - 1;
                    let c = tex.pixels[tx + ty * tex.width];
                    if (lightCalc) {
                        let diffuse = this.sunDirVS.mul(-1).dot(n) * this.sunIntensity;
                        diffuse = clamp(diffuse, this.ambient, 1.0);
                        c = mulColor(c, diffuse);
                    }
                    this.renderPixel(new Vector3(x, y, z + depthMin), c);
                }
            }
        }
    }

    drawIndex(positions, normals, texCoords, indices) {
    }

    drawCube(pos, size, tex, centered) {
        if (centered == true) pos = pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
        const p000 = new Vector3(pos.x, pos.y, pos.z);
        const p100 = new Vector3(pos.x + size.x, pos.y, pos.z);
        const p110 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z);
        const p010 = new Vector3(pos.x, pos.y + size.y, pos.z);
        const p001 = new Vector3(pos.x, pos.y, pos.z - size.z);
        const p101 = new Vector3(pos.x + size.x, pos.y, pos.z - size.z);
        const p111 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z - size.z);
        const p011 = new Vector3(pos.x, pos.y + size.y, pos.z - size.z);
        const t00 = new Vector2(0, 0);
        const t10 = new Vector2(1, 0);
        const t11 = new Vector2(1, 1);
        const t01 = new Vector2(0, 1);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11), tex);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p111, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11), tex);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p011, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11), tex);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p010, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11), tex);
        this.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p110, 0xffffff, t11), tex);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p101, 0xffffff, t00), new Vertex(p001, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p001, 0xffffff, t10), new Vertex(p000, 0xffffff, t11), tex);
    }

    drawSkyBox(rotation) {
        renderFlag = SET_Z_9999 | EFFECT_NO_LIGHT;
        let size = new Vector3(1000, 1000, 1000);
        let pos = player.pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
        rotation = new Matrix4().rotate(0, rotation, 0);
        const p000 = rotation.mulVector(new Vector3(pos.x, pos.y, pos.z));
        const p100 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y, pos.z));
        const p110 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y + size.y, pos.z));
        const p010 = rotation.mulVector(new Vector3(pos.x, pos.y + size.y, pos.z));
        const p001 = rotation.mulVector(new Vector3(pos.x, pos.y, pos.z - size.z));
        const p101 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y, pos.z - size.z));
        const p111 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y + size.y, pos.z - size.z));
        const p011 = rotation.mulVector(new Vector3(pos.x, pos.y + size.y, pos.z - size.z));
        const t00 = new Vector2(0, 0);
        const t10 = new Vector2(1, 0);
        const t11 = new Vector2(1, 1);
        const t01 = new Vector2(0, 1);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10), textures.skybox_front);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11), textures.skybox_front);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10), textures.skybox_right);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11), textures.skybox_right);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10), textures.skybox_left);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11), textures.skybox_left);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10), textures.skybox_back);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11), textures.skybox_back);
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10), textures.skybox_top);
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11), textures.skybox_top);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10), textures.skybox_bottom);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11), textures.skybox_bottom);
        renderFlag = 0;
    }

    playerTransform(v) {
        const pos = player.cameraTransform.mulVector(new Vector3(v.pos.x, v.pos.y, -v.pos.z));
        let normal = undefined;
        if (v.normal != undefined) normal = player.cameraTransform.mulVector(new Vector3(v.normal.x, v.normal.y, v.normal.z), 0)
        return new Vertex(pos, v.color, v.texCoord, normal);
    }

    renderPixel(p, c) {
        if (!this.checkOutOfScreen(p) && p.z < this.zBuffer[p.x + (HEIGHT - 1 - p.y) * WIDTH]) {
            if (typeof c != "number") c = convertColor(c);
            this.pixels[p.x + (HEIGHT - 1 - p.y) * this.width] = c;
            this.zBuffer[p.x + (HEIGHT - 1 - p.y) * this.width] = p.z;
        }
    }

    checkOutOfScreen(p) {
        return p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height;
    }
}
