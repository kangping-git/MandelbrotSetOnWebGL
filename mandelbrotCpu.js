function hsvToRgb(h, s, v){
    h = h % 360;
    const c = s;
    const h2 = h / 60.0;
    const x = c * (1.0 - Math.abs((h2 % 2.0) - 1.0));
    let rgb = [v - c, v - c, v - c];
    if (0.0 <= h2 && h2 < 1.0){
        rgb = [rgb[0] + c, rgb[1] + x, rgb[2]];
    } else if (1.0 <= h2 && h2 < 2.0){
        rgb = [rgb[0] + x, rgb[1] + c, rgb[2]];
    } else if (2.0 <= h2 && h2 < 3.0){
        rgb = [rgb[0], rgb[1] + c, rgb[2] + x];
    } else if (3.0 <= h2 && h2 < 4.0){
        rgb = [rgb[0], rgb[1] + x, rgb[2] + c];
    } else if (4.0 <= h2 && h2 < 5.0){
        rgb = [rgb[0] + x, rgb[1], rgb[2] + c];
    } else if (5.0 <= h2 && h2 < 6.0){
        rgb = [rgb[0] + c, rgb[1], rgb[2] + x];
    }
    return rgb.map(v => Math.round(Math.min(1, Math.max(0, v)) * 255));
}

function colorMap(i){
    const ii = i % 50.0;
    return hsvToRgb(230.0 + ii * 167.0, 1.0,
        Math.sin(ii * Math.PI * 2.0 - Math.PI / 2.0) * 0.5 + 0.5);
}

function drawMandelbrotCPU(ctx, w, h, iter=100, centerX=0, centerY=0, zoom=1){
    const img = ctx.createImageData(w, h);
    const data = img.data;
    for(let py = 0; py < h; ++py){
        for(let px = 0; px < w; ++px){
            let zr = 0.0;
            let zi = 0.0;
            const cr = (px - w/2.0)/zoom/(h/3.0) + centerX;
            const ci = (h/2.0 - py)/zoom/(h/3.0) + centerY;
            let i = 0;
            for(i = 0; i < iter; ++i){
                const temp = zr;
                zr = zr * zr - zi * zi + cr;
                zi = 2.0 * temp * zi + ci;
                if (zr * zr + zi * zi > 4.0){
                    break;
                }
            }
            let r = 0, g = 0, b = 0;
            if (i < iter){
                [r, g, b] = colorMap(i);
            }
            const idx = (py * w + px) * 4;
            data[idx] = r;
            data[idx+1] = g;
            data[idx+2] = b;
            data[idx+3] = 255;
        }
    }
    ctx.putImageData(img, 0, 0);
    return img;
}

module.exports = { drawMandelbrotCPU };
