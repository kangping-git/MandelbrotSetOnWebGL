// Vertex and fragment shader for WebGPU
struct Uniforms {
    t : f32;
    zoom : f32;
    r : vec2<f32>;
    position : vec2<f32>;
    iter : f32;
};
@group(0) @binding(0) var<uniform> uniforms : Uniforms;

struct VSOut {
    @builtin(position) Position : vec4<f32>;
};

@vertex
fn vs_main(@location(0) position : vec2<f32>) -> VSOut {
    var out : VSOut;
    out.Position = vec4<f32>(position, 0.0, 1.0);
    return out;
}

const PI : f32 = 3.141592653589793;

fn hsvToRgb(h: f32, s: f32, v: f32) -> vec3<f32> {
    let c: f32 = s;
    let h2: f32 = h / 60.0;
    let x: f32 = c * (1.0 - abs((h2 % 2.0) - 1.0));
    var rgb: vec3<f32> = vec3<f32>(v - c);
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

fn ColorMap(iteration: f32) -> vec3<f32> {
    let i: f32 = iteration % 50.0;
    return hsvToRgb(230.0 + i * 167.0, 1.0, sin(i * PI * 2.0 - PI/2.0) * 0.5 + 0.5);
}

@fragment
fn fs_main(@builtin(position) FragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    var zr: f32 = 0.0;
    var zi: f32 = 0.0;
    let cr: f32 = (FragCoord.x - uniforms.r.x / 2.0) / uniforms.zoom / (uniforms.r.y/3.0) + uniforms.position.x;
    let ci: f32 = (uniforms.r.y / 2.0 - FragCoord.y) / uniforms.zoom / (uniforms.r.y/3.0) + uniforms.position.y;
    let q: f32 = (cr - 0.25) * (cr - 0.25) + ci * ci;
    var color: vec3<f32> = vec3<f32>(0.0);
    if (q * (q + (cr - 0.25)) < 0.25 * ci * ci) {
        return vec4<f32>(color, 1.0);
    }
    var iter: f32 = uniforms.iter;
    if (iter == 0.0) {
        iter = 100.0;
    }
    var i: f32 = 0.0;
    loop {
        let temp: f32 = zr;
        zr = zr * zr - zi * zi + cr;
        zi = 2.0 * temp * zi + ci;
        if (zr * zr + zi * zi > 4.0) {
            color = ColorMap((i / iter - log(log(zr * zr + zi * zi) / log(2.0))));
            break;
        }
        if (i > iter) {
            break;
        }
        i = i + 1.0;
    }
    return vec4<f32>(color, 1.0);
}
