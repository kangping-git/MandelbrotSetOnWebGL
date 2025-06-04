// WebGPU shader implementing double-double arithmetic
struct Uniforms {
    t : f32,
    zoom : f32,
    r : vec2<f32>,
    positionX : vec2<f32>,
    positionY : vec2<f32>,
    iter : f32,
    pad : vec3<f32>,
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VSOut {
    @builtin(position) Position : vec4<f32>,
};

@vertex
fn vs_main(@location(0) position : vec2<f32>) -> VSOut {
    var out : VSOut;
    out.Position = vec4<f32>(position, 0.0, 1.0);
    return out;
}

const PI : f32 = 3.141592653589793;

fn hsvToRgb(h: f32, s: f32, v: f32) -> vec3<f32> {
    var hh = h % 360.0;
    let c = s;
    let h2 = hh / 60.0;
    let x = c * (1.0 - abs((h2 % 2.0) - 1.0));
    var rgb = vec3<f32>(v - c);
    if (0.0 <= h2 && h2 < 1.0) {
        rgb = rgb + vec3<f32>(c, x, 0.0);
    } else if (1.0 <= h2 && h2 < 2.0) {
        rgb = rgb + vec3<f32>(x, c, 0.0);
    } else if (2.0 <= h2 && h2 < 3.0) {
        rgb = rgb + vec3<f32>(0.0, c, x);
    } else if (3.0 <= h2 && h2 < 4.0) {
        rgb = rgb + vec3<f32>(0.0, x, c);
    } else if (4.0 <= h2 && h2 < 5.0) {
        rgb = rgb + vec3<f32>(x, 0.0, c);
    } else if (5.0 <= h2 && h2 < 6.0) {
        rgb = rgb + vec3<f32>(c, 0.0, x);
    }
    return rgb;
}

fn ColorMap(i: f32) -> vec3<f32> {
    let ii = i % 50.0;
    return hsvToRgb(230.0 + ii * 167.0, 1.0, sin(ii * PI * 2.0 - PI / 2.0) * 0.5 + 0.5);
}

const SPLIT : f32 = 4097.0;

fn twoSum(a: f32, b: f32) -> vec2<f32> {
    let s = a + b;
    let bb = s - a;
    let err = (a - (s - bb)) + (b - bb);
    return vec2<f32>(s, err);
}

fn twoProd(a: f32, b: f32) -> vec2<f32> {
    let p = a * b;
    let a1 = SPLIT * a;
    let a_hi = a1 - (a1 - a);
    let a_lo = a - a_hi;
    let b1 = SPLIT * b;
    let b_hi = b1 - (b1 - b);
    let b_lo = b - b_hi;
    let err = ((a_hi * b_hi - p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
    return vec2<f32>(p, err);
}

fn dd_add(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    let s = twoSum(a.x, b.x);
    let e = a.y + b.y + s.y;
    return twoSum(s.x, e);
}

fn dd_sub(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    return dd_add(a, vec2<f32>(-b.x, -b.y));
}

fn dd_mul(a: vec2<f32>, b: vec2<f32>) -> vec2<f32> {
    var p = twoProd(a.x, b.x);
    p.y = p.y + a.x * b.y + a.y * b.x;
    return twoSum(p.x, p.y);
}

fn dd_set(a: f32) -> vec2<f32> {
    return vec2<f32>(a, 0.0);
}

@fragment
fn fs_main(@builtin(position) FragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    var zr = dd_set(0.0);
    var zi = dd_set(0.0);
    let cr = dd_add(dd_set((FragCoord.x - uniforms.r.x / 2.0) / uniforms.zoom / (uniforms.r.y / 3.0)), uniforms.positionX);
    let ci = dd_add(dd_set((uniforms.r.y / 2.0 - FragCoord.y) / uniforms.zoom / (uniforms.r.y / 3.0)), uniforms.positionY);
    var iter = uniforms.iter;
    if (iter == 0.0) {
        iter = 100.0;
    }
    var color = vec3<f32>(0.0);
    var i: i32 = 0;
    loop {
        let zr_old = zr;
        let zi_old = zi;
        let zr2 = dd_mul(zr_old, zr_old);
        let zi2 = dd_mul(zi_old, zi_old);
        zr = dd_add(dd_sub(zr2, zi2), cr);
        let prod = dd_mul(zr_old, zi_old);
        zi = dd_add(dd_mul(dd_set(2.0), prod), ci);
        let mag = zr.x * zr.x + zi.x * zi.x;
        if (mag > 4.0) {
            color = ColorMap(f32(i) / iter - log(log(mag) / log(2.0)));
            break;
        }
        if (f32(i) > iter) {
            break;
        }
        i = i + 1;
        if (i >= 10000) {
            break;
        }
    }
    return vec4<f32>(color, 1.0);
}
