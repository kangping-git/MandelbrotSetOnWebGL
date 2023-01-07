precision highp float;
uniform float t;
uniform float zoom;
uniform vec2  r;
uniform vec2  position;
uniform float _iter;
float PI = 3.14159265358979;
vec3 hsvToRgb(float h, float s, float v) {
    h = mod(h,360.0);
    float c = s; // float c = v * s;
    float h2 = h / 60.0;
    float x = c * (1.0 - abs(mod(h2, 2.0) - 1.0));
    vec3 rgb = (v - c) * vec3(1.0, 1.0, 1.0);

    if (0.0 <= h2 && h2 < 1.0) {
        rgb += vec3(c, x, 0.0);
    } else if (1.0 <= h2 && h2 < 2.0) {
        rgb += vec3(x, c, 0.0);
    } else if (2.0 <= h2 && h2 < 3.0) {
        rgb += vec3(0.0, c, x);
    } else if (3.0 <= h2 && h2 < 4.0) {
        rgb += vec3(0.0, x, c);
    } else if (4.0 <= h2 && h2 < 5.0) {
        rgb += vec3(x, 0.0, c);
    } else if (5.0 <= h2 && h2 < 6.0) {
        rgb += vec3(c, 0.0, x);
    }

    return rgb;
}
vec3 ColorMap(float iteration){
    float i = (mod(iteration,50.0))/50.0;
    return hsvToRgb(230.0+i*167.0,1.0,sin(i*PI*2.0-PI/2.0)*0.5+0.5);
}
void main(void){
    float zr = 0.0;
    float zi = 0.0;
    float cr = (gl_FragCoord.x-r[0]/2.0)/zoom/(r[1]/3.0)+position[0];
    float ci = (gl_FragCoord.y-r[1]/2.0)/zoom/(r[1]/3.0)+position[1];
    float q = (cr - 1.0/4.0) * (cr - 1.0/4.0) + ci * ci;
    vec3 Color = vec3(0.0);
    if (q * (q + (cr - 1.0/4.0)) < 1.0 / 4.0 * ci * ci){
        gl_FragColor = vec4(Color, 1.0);
        return;
    }
    float iter = 100.0;
    if (bool(_iter)){
        iter = _iter;
    }
    for (float i = 0.0;i < 10000.0;++i){
        float temp = zr;
        zr = zr * zr - zi * zi + cr;
        zi = 2.0 * temp * zi + ci;
        if (zr * zr + zi * zi > 4.0){
            Color = ColorMap(i);
            break;
        }
        if (i > iter){
            break;
        }
    }
    gl_FragColor = vec4(Color, 1.0);
}