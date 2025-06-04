precision highp float;
uniform float t;
uniform float zoom;
uniform vec2 r;
uniform vec2 positionX;
uniform vec2 positionY;
uniform float _iter;

float PI = 3.14159265358979;

vec3 hsvToRgb(float h, float s, float v){
    h = mod(h,360.0);
    float c = s;
    float h2 = h / 60.0;
    float x = c * (1.0 - abs(mod(h2, 2.0) - 1.0));
    vec3 rgb = (v - c) * vec3(1.0, 1.0, 1.0);
    if (0.0 <= h2 && h2 < 1.0){
        rgb += vec3(c, x, 0.0);
    } else if (1.0 <= h2 && h2 < 2.0){
        rgb += vec3(x, c, 0.0);
    } else if (2.0 <= h2 && h2 < 3.0){
        rgb += vec3(0.0, c, x);
    } else if (3.0 <= h2 && h2 < 4.0){
        rgb += vec3(0.0, x, c);
    } else if (4.0 <= h2 && h2 < 5.0){
        rgb += vec3(x, 0.0, c);
    } else if (5.0 <= h2 && h2 < 6.0){
        rgb += vec3(c, 0.0, x);
    }
    return rgb;
}

vec3 ColorMap(float iteration){
    float i = mod(iteration,50.0);
    return hsvToRgb(230.0 + i*167.0, 1.0, sin(i*PI*2.0-PI/2.0)*0.5+0.5);
}

const float SPLIT = 4097.0;

vec2 twoSum(float a, float b){
    float s = a + b;
    float bb = s - a;
    float err = (a - (s - bb)) + (b - bb);
    return vec2(s, err);
}

vec2 twoProd(float a, float b){
    float p = a * b;
    float a1 = SPLIT * a;
    float a_hi = a1 - (a1 - a);
    float a_lo = a - a_hi;
    float b1 = SPLIT * b;
    float b_hi = b1 - (b1 - b);
    float b_lo = b - b_hi;
    float err = ((a_hi*b_hi - p) + a_hi*b_lo + a_lo*b_hi) + a_lo*b_lo;
    return vec2(p, err);
}

vec2 dd_add(vec2 a, vec2 b){
    vec2 s = twoSum(a.x, b.x);
    float e = a.y + b.y + s.y;
    return twoSum(s.x, e);
}

vec2 dd_sub(vec2 a, vec2 b){
    return dd_add(a, vec2(-b.x, -b.y));
}

vec2 dd_mul(vec2 a, vec2 b){
    vec2 p = twoProd(a.x, b.x);
    p.y += a.x*b.y + a.y*b.x;
    return twoSum(p.x, p.y);
}

vec2 dd_set(float a){
    return vec2(a, 0.0);
}

void main(void){
    vec2 zr = dd_set(0.0);
    vec2 zi = dd_set(0.0);
    vec2 cr = dd_add(dd_set((gl_FragCoord.x - r.x/2.0)/zoom/(r.y/3.0)), positionX);
    vec2 ci = dd_add(dd_set((r.y/2.0 - gl_FragCoord.y)/zoom/(r.y/3.0)), positionY);
    float iter = _iter > 0.0 ? _iter : 100.0;
    vec3 Color = vec3(0.0);
    for(float i = 0.0; i < 10000.0; i++){
        vec2 zr_old = zr;
        vec2 zi_old = zi;
        vec2 zr2 = dd_mul(zr_old, zr_old);
        vec2 zi2 = dd_mul(zi_old, zi_old);
        zr = dd_add(dd_sub(zr2, zi2), cr);
        vec2 prod = dd_mul(zr_old, zi_old);
        zi = dd_add(dd_mul(dd_set(2.0), prod), ci);
        float mag = zr.x*zr.x + zi.x*zi.x;
        if(mag > 4.0){
            Color = ColorMap(i/iter - log(log(mag)/log(2.0)));
            break;
        }
        if(i > iter){
            break;
        }
    }
    gl_FragColor = vec4(Color, 1.0);
}
