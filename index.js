function getFlags(searchString){
    const search = searchString.toLowerCase();
    return {
        useCPU: search.includes('cpu'),
        useDD: search.includes('dd')
    };
}
if (typeof module !== 'undefined'){
    module.exports.getFlags = getFlags;
}

if (typeof window !== 'undefined'){
window.addEventListener("load",async () => {
    /**
     * 
     * @param {WebGLRenderingContextBase} gl 
     */
    async function drawWebGL(gl, useDD = false){
        const VERTEX_SHADER = await (await fetch("./index.vert")).text()
        const FRAGMENT_SHADER = await (await fetch(useDD ? "./index64.frag" : "./index.frag")).text()
        const vShader = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vShader,VERTEX_SHADER)
        gl.compileShader(vShader)
        const fShader = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fShader,FRAGMENT_SHADER)
        gl.compileShader(fShader)
        const program = gl.createProgram()
        gl.attachShader(program,vShader)
        gl.attachShader(program,fShader)
        gl.linkProgram(program)
        if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.useProgram(program);
        }else {
            console.log (gl.getProgramInfoLog(program));
            return;
        }
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        var position = [
            -1, 1, 0,
            -1, -1, 0,
            1 ,-1, 0,
            -1, 1, 0,
            1 ,-1, 0,
            1, 1, 0
        ];
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array (position), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        let frames = 0
        let lastFrameTime = new Date()
        let time = new Date()
        let pointerX = -1
        let pointerY = -1
        let clickX = 0
        let clickY = 0
        let nowX = 0
        let nowY = 0
        let clicking = false
        let zoom = 1
        const INITIAL_S = 1000/60 * 6
        let s = INITIAL_S
        let _iter = 100
        function render(){
            gl.uniform1f(gl.getUniformLocation(program,"t"),(new Date() - time) / 1000)
            gl.uniform2f(gl.getUniformLocation(program,"r"),w,h)
            gl.uniform1f(gl.getUniformLocation(program,"_iter"),_iter)
            gl.uniform1f(gl.getUniformLocation(program,"zoom"),zoom)
            if (useDD){
                const hx = Math.fround(nowX);
                const hxlo = nowX - hx;
                const hy = Math.fround(nowY);
                const hylo = nowY - hy;
                gl.uniform2f(gl.getUniformLocation(program,"positionX"), hx, hxlo)
                gl.uniform2f(gl.getUniformLocation(program,"positionY"), hy, hylo)
            }else{
                gl.uniform2f(gl.getUniformLocation(program,"position"),nowX, nowY)
            }
            gl.clearColor (0.8, 0.8, 0.8, 1.0);
            gl.clear (gl.COLOR_BUFFER_BIT);
            gl.viewport(0, 0, w, h);
            gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
            var positionAddress = gl.getAttribLocation(program, "position");
            gl.enableVertexAttribArray(positionAddress);
            gl.vertexAttribPointer(positionAddress, 3, gl.FLOAT, false, 0,0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            ctx.clearRect(0,0, MainCanvas.width, MainCanvas.height);
            ctx.drawImage(canvas, 0, 0);
            if (ctrlKey){
                ctx.fillStyle = "yellow"
                ctx.strokeStyle = "gray"
                ctx.beginPath();
                ctx.fill()
                ctx.beginPath();
                ctx.arc(_X,_Y,5,0,Math.PI * 2)
                ctx.fill()
                let zr = 0
                let zi = 0
                let cr = (_X-w/2.0)/zoom/(h/3.0)+nowX
                let ci = (_Y-h/2.0)/zoom/(h/3.0)+nowY
                ctx.beginPath();
                ctx.arc((zr - nowX) * zoom * (h/3)+w/2.0,(zi-nowY) * zoom * (h/3)+h/2.0,5,0,Math.PI * 2)
                ctx.fill()
                for (let i = 0;i < _iter;++i){
                    ctx.beginPath();
                    ctx.moveTo((zr - nowX) * zoom * (h/3)+w/2.0,(zi-nowY) * zoom * (h/3)+h/2.0)
                    let temp = zr
                    zr = zr ** 2 - zi ** 2 + cr
                    zi = 2 * temp * zi + ci
                    ctx.lineTo((zr - nowX) * zoom * (h/3)+w/2.0,(zi-nowY) * zoom * (h/3)+h/2.0)
                    ctx.stroke()
                    ctx.beginPath();
                    ctx.arc((zr - nowX) * zoom * (h/3)+w/2.0,(zi-nowY) * zoom * (h/3)+h/2.0,5,0,Math.PI * 2)
                    ctx.fill()
                }
            }
            frames += 1
            if (new Date() - lastFrameTime >= 1000){
                document.getElementById("FPS").innerText = "FPS:" + frames
                frames = 0
                lastFrameTime = new Date()
            }
            requestAnimationFrame(render)
            time -= s
            if (a > 1){
                a *= 1/1.01
                zoom *= a
                if (Math.abs(a-1) < 0.01){
                    a = 1
                }
            }else if (Math.abs(a-1) > 0.001){
                a *= 1.02
                zoom *= a
                if (Math.abs(a-1) < 0.01){
                    a = 1
                }
            }else{
                a = 1
            }
        }
        window.addEventListener("contextmenu",(e) => {
            e.preventDefault()
        })
        window.addEventListener("mousedown",(e) => {
            if (e.button == 0){
                clickX = e.clientX
                clickY = e.clientY
                pointerX = nowX
                pointerY = nowY
                clicking = true
                s = 0
            }else if (e.button == 2){
                nowX = (_X-w/2.0)/zoom/(h/3.0)+nowX
                nowY = (_Y-h/2.0)/zoom/(h/3.0)+nowY
            }
            console.log(nowX,nowY);
        })
        window.addEventListener("mouseup",(e) => {
            clicking = false
            s = INITIAL_S
        })
        window.addEventListener("mousemove",(e) => {
            if(clicking){
                nowX = (clickX-e.clientX)/zoom/(h/3.0) + pointerX
                nowY = (e.clientY-clickY)/zoom/(h/3.0) + pointerY
            }
            _X = e.clientX
            _Y = e.clientY
        })
        window.addEventListener("wheel",(e) => {
            if(e.deltaY > 0){
                a *= 1/1.05
                if (a > 1/1.2){
                    a = 1/1.2
                }
            }else{
                a *= 1.05
                if (a > 1.2){
                    a = 1.2
                }
            }
            if (ctrlKey){
                e.preventDefault()
    }
 })

        let touchStartDist = 0
        let touchStartZoom = 1
        window.addEventListener("touchstart", (e) => {
            if(e.touches.length === 1){
                const t = e.touches[0]
                clickX = t.clientX
                clickY = t.clientY
                pointerX = nowX
                pointerY = nowY
                clicking = true
                s = 0
            }else if (e.touches.length === 2){
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                touchStartDist = Math.hypot(dx, dy)
                touchStartZoom = zoom
            }
        }, {passive: false})

        window.addEventListener("touchmove", (e) => {
            if(e.touches.length === 1 && clicking){
                const t = e.touches[0]
                nowX = (clickX - t.clientX)/zoom/(h/3.0) + pointerX
                nowY = (t.clientY - clickY)/zoom/(h/3.0) + pointerY
                _X = t.clientX
                _Y = t.clientY
            }else if(e.touches.length === 2){
                const dx = e.touches[0].clientX - e.touches[1].clientX
                const dy = e.touches[0].clientY - e.touches[1].clientY
                const dist = Math.hypot(dx, dy)
                const ratio = dist / touchStartDist
                zoom = touchStartZoom * ratio
                a = 1
                e.preventDefault()
            }
        }, {passive: false})

        window.addEventListener("touchend", (e) => {
            if(e.touches.length === 0){
                clicking = false
                s = INITIAL_S
                a = 1
            }
        })


        window.addEventListener("resize",() => {
            w = window.innerWidth
            h = window.innerHeight
            canvas.width = w
            canvas.height = h
            MainCanvas.width = w
            MainCanvas.height = h
        })
        let ctrlKey = false
        let _X = 0
        let _Y = 0
        window.addEventListener("keydown",(e) => {
            if (e.key == "a"){
                _iter += 1
            }
            if (e.key == "d"){
                _iter -= 1
            }
            if (e.key == "A"){
                _iter += 100
            }
            if (e.key == "D"){
                _iter -= 100
            }
            if (_iter <= 0){
                _iter = 1
            }
            if (e.key == "Control"){
                ctrlKey = true
            }
            document.getElementById("Iteration").innerText = "Iteration:" + _iter
        })
        window.addEventListener("keyup",(e) => {
            if (e.key == "Control"){
                ctrlKey = false
            }
        })
        document.getElementById("incIter").addEventListener("click", () => {
            _iter += 1
            document.getElementById("Iteration").innerText = "Iteration:" + _iter
        })
        render()
    }

    async function drawWebGPU(canvas, useDD = false){
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.error('Failed to get GPU adapter');
            return;
        }
        const device = await adapter.requestDevice();
        const context = canvas.getContext('webgpu');
        if (!context) {
            console.error('Failed to get WebGPU context');
            drawWebGL(canvas.getContext('webgl'));
            return;
        }
        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: 'opaque' });

        const shaderCode = await (await fetch(useDD ? './index64.wgsl' : './index.wgsl')).text();
        const shaderModule = device.createShaderModule({ code: shaderCode });
        const pipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vs_main',
                buffers: [{
                    arrayStride: 8,
                    attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x2' }]
                }]
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fs_main',
                targets: [{ format }]
            },
            primitive: { topology: 'triangle-list' }
        });

        const vertices = new Float32Array([
            -1, 1, -1, -1, 1, -1, -1, 1, 1, -1, 1, 1
        ]);
        const vertexBuffer = device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true
        });
        new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
        vertexBuffer.unmap();

        const uniformBufferSize = useDD ? 4 * 16 : 4 * 8;
        const uniformBuffer = device.createBuffer({
            size: uniformBufferSize,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        const bindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
        });

        let frames = 0;
        let lastFrameTime = new Date();
        let time = new Date();
        let pointerX = -1;
        let pointerY = -1;
        let clickX = 0;
        let clickY = 0;
        let nowX = 0;
        let nowY = 0;
        let clicking = false;
        let zoom = 1;
        let s = 1000 / 60 * 6;
        let _iter = 100;

        function render(){
            const t = (new Date() - time) / 1000;
            let uniformData;
            if (useDD){
                const hx = Math.fround(nowX);
                const hxlo = nowX - hx;
                const hy = Math.fround(nowY);
                const hylo = nowY - hy;
                uniformData = new Float32Array([t, zoom, w, h, hx, hxlo, hy, hylo, _iter, 0, 0, 0]);
            }else{
                uniformData = new Float32Array([t, zoom, w, h, nowX, nowY, _iter, 0]);
            }
            device.queue.writeBuffer(uniformBuffer, 0, uniformData);

            const encoder = device.createCommandEncoder();
            const view = context.getCurrentTexture().createView();
            const pass = encoder.beginRenderPass({
                colorAttachments: [{
                    view,
                    clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store'
                }]
            });
            pass.setPipeline(pipeline);
            pass.setVertexBuffer(0, vertexBuffer);
            pass.setBindGroup(0, bindGroup);
            pass.draw(6, 1, 0, 0);
            pass.end();
            device.queue.submit([encoder.finish()]);

            ctx.clearRect(0, 0, MainCanvas.width, MainCanvas.height);
            ctx.drawImage(canvas, 0, 0);

            frames += 1;
            if (new Date() - lastFrameTime >= 1000){
                console.log(frames);
                frames = 0;
                lastFrameTime = new Date();
            }
            requestAnimationFrame(render);
            time -= s;
            if (a > 1){
                a *= 1/1.01;
                zoom *= a;
                if (Math.abs(a-1) < 0.01){
                    a = 1;
                }
            }else if (Math.abs(a-1) > 0.001){
                a *= 1.02;
                zoom *= a;
                if (Math.abs(a-1) < 0.01){
                    a = 1;
                }
            }else{
                a = 1;
            }
        }

        window.addEventListener('contextmenu', e => { e.preventDefault(); });
        window.addEventListener('mousedown', e => {
            if (e.button == 0){
                clickX = e.clientX;
                clickY = e.clientY;
                pointerX = nowX;
                pointerY = nowY;
                clicking = true;
                s = 0;
            } else if (e.button == 2){
                nowX = (_X-w/2.0)/zoom/(h/3.0)+nowX;
                nowY = (_Y-h/2.0)/zoom/(h/3.0)+nowY;
            }
            console.log(nowX, nowY);
        });
        window.addEventListener('mouseup', () => { clicking = false; });
        window.addEventListener('mousemove', e => {
            if (clicking){
                nowX = (clickX-e.clientX)/zoom/(h/3.0) + pointerX;
                nowY = (e.clientY-clickY)/zoom/(h/3.0) + pointerY;
            }
            _X = e.clientX;
            _Y = e.clientY;
        });
        window.addEventListener('wheel', e => {
            if(e.deltaY > 0){
                a *= 1/1.05;
                if (a > 1/1.2){ a = 1/1.2; }
            }else{
                a *= 1.05;
                if (a > 1.2){ a = 1.2; }
            }
            if (shiftKey){ e.preventDefault(); }
        });

        let touchStartDist = 0;
        let touchStartZoom = 1;
        window.addEventListener('touchstart', e => {
            if(e.touches.length === 1){
                const t = e.touches[0];
                clickX = t.clientX;
                clickY = t.clientY;
                pointerX = nowX;
                pointerY = nowY;
                clicking = true;
                s = 0;
            }else if(e.touches.length === 2){
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDist = Math.hypot(dx, dy);
                touchStartZoom = zoom;
            }
        }, {passive: false});

        window.addEventListener('touchmove', e => {
            if(e.touches.length === 1 && clicking){
                const t = e.touches[0];
                nowX = (clickX - t.clientX)/zoom/(h/3.0) + pointerX;
                nowY = (t.clientY - clickY)/zoom/(h/3.0) + pointerY;
                _X = t.clientX;
                _Y = t.clientY;
            }else if(e.touches.length === 2){
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const ratio = dist / touchStartDist;
                zoom = touchStartZoom * ratio;
                a = 1;
                e.preventDefault();
            }
        }, {passive: false});

        window.addEventListener('touchend', e => {
            if(e.touches.length === 0){
                clicking = false;
                s = 1000 / 60 * 6;
                a = 1;
            }
        });
        window.addEventListener('resize', () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
            MainCanvas.width = w;
            MainCanvas.height = h;
            context.configure({ device, format, alphaMode: 'opaque' });
        });
        let shiftKey = false;
        let _X = 0;
        let _Y = 0;
        window.addEventListener('keydown', e => {
            if (e.key == 'a'){ _iter += 1; }
            if (e.key == 'd'){ _iter -= 1; }
            if (e.key == 'A'){ _iter += 100; }
            if (e.key == 'D'){ _iter -= 100; }
            if (_iter <= 0){ _iter = 1; }
            if (e.key == 'Control'){ shiftKey = true; }
            document.getElementById('Iteration').innerText = 'Iteration:' + _iter;
        });
        window.addEventListener('keyup', e => { if (e.key == 'Control'){ shiftKey = false; } });
        document.getElementById('incIter').addEventListener('click', () => {
            _iter += 1;
            document.getElementById('Iteration').innerText = 'Iteration:' + _iter;
        });
        render();
    }

    async function drawCPU(canvas){
        const ctx2d = canvas.getContext("2d");
        let frames = 0;
        let lastFrameTime = new Date();
        let time = new Date();
        let pointerX = -1;
        let pointerY = -1;
        let clickX = 0;
        let clickY = 0;
        let nowX = 0;
        let nowY = 0;
        let clicking = false;
        let zoom = 1;
        const INITIAL_S = 1000/60 * 6;
        let s = INITIAL_S;
        let _iter = 100;

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
            return hsvToRgb(230.0 + ii * 167.0, 1.0, Math.sin(ii * Math.PI * 2.0 - Math.PI / 2.0) * 0.5 + 0.5);
        }

        function drawFractal(){
            const img = ctx2d.createImageData(w, h);
            const data = img.data;
            for(let py = 0; py < h; ++py){
                for(let px = 0; px < w; ++px){
                    let zr = 0.0;
                    let zi = 0.0;
                    const cr = (px - w/2.0)/zoom/(h/3.0) + nowX;
                    const ci = (h/2.0 - py)/zoom/(h/3.0) + nowY;
                    let i = 0;
                    for(i = 0; i < _iter; ++i){
                        const temp = zr;
                        zr = zr * zr - zi * zi + cr;
                        zi = 2.0 * temp * zi + ci;
                        if (zr * zr + zi * zi > 4.0){
                            break;
                        }
                    }
                    let r = 0, g = 0, b = 0;
                    if (i < _iter){
                        [r, g, b] = colorMap(i);
                    }
                    const idx = (py * w + px) * 4;
                    data[idx] = r;
                    data[idx+1] = g;
                    data[idx+2] = b;
                    data[idx+3] = 255;
                }
            }
            ctx2d.putImageData(img, 0, 0);
        }

        function render(){
            drawFractal();
            frames += 1;
            if (new Date() - lastFrameTime >= 1000){
                document.getElementById("FPS").innerText = "FPS:" + frames;
                frames = 0;
                lastFrameTime = new Date();
            }
            requestAnimationFrame(render);
            time -= s;
        }

        window.addEventListener('contextmenu', e => { e.preventDefault(); });
        window.addEventListener('mousedown', e => {
            if (e.button == 0){
                clickX = e.clientX;
                clickY = e.clientY;
                pointerX = nowX;
                pointerY = nowY;
                clicking = true;
                s = 0;
            } else if (e.button == 2){
                nowX = (_X-w/2.0)/zoom/(h/3.0)+nowX;
                nowY = (_Y-h/2.0)/zoom/(h/3.0)+nowY;
            }
        });
        window.addEventListener('mouseup', () => { clicking = false; s = INITIAL_S; });
        window.addEventListener('mousemove', e => {
            if (clicking){
                nowX = (clickX-e.clientX)/zoom/(h/3.0) + pointerX;
                nowY = (e.clientY-clickY)/zoom/(h/3.0) + pointerY;
            }
            _X = e.clientX;
            _Y = e.clientY;
        });
        window.addEventListener('wheel', e => {
            if(e.deltaY > 0){
                a *= 1/1.05;
                if (a > 1/1.2){ a = 1/1.2; }
            }else{
                a *= 1.05;
                if (a > 1.2){ a = 1.2; }
            }
        });

        let touchStartDist = 0;
        let touchStartZoom = 1;
        window.addEventListener('touchstart', e => {
            if(e.touches.length === 1){
                const t = e.touches[0];
                clickX = t.clientX;
                clickY = t.clientY;
                pointerX = nowX;
                pointerY = nowY;
                clicking = true;
                s = 0;
            }else if(e.touches.length === 2){
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                touchStartDist = Math.hypot(dx, dy);
                touchStartZoom = zoom;
            }
        }, {passive: false});

        window.addEventListener('touchmove', e => {
            if(e.touches.length === 1 && clicking){
                const t = e.touches[0];
                nowX = (clickX - t.clientX)/zoom/(h/3.0) + pointerX;
                nowY = (t.clientY - clickY)/zoom/(h/3.0) + pointerY;
                _X = t.clientX;
                _Y = t.clientY;
            }else if(e.touches.length === 2){
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const ratio = dist / touchStartDist;
                zoom = touchStartZoom * ratio;
                a = 1;
                e.preventDefault();
            }
        }, {passive: false});

        window.addEventListener('touchend', e => {
            if(e.touches.length === 0){
                clicking = false;
                s = INITIAL_S;
                a = 1;
            }
        });
        window.addEventListener('resize', () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
            MainCanvas.width = w;
            MainCanvas.height = h;
        });
        let _X = 0;
        let _Y = 0;
        document.getElementById('incIter').addEventListener('click', () => {
            _iter += 1;
            document.getElementById('Iteration').innerText = 'Iteration:' + _iter;
        });
        render();
    }

    let a = 1
    const canvas = document.getElementById("glcanvas")
    const MainCanvas = document.getElementById("MainCanvas")
    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h
    MainCanvas.width = w
    MainCanvas.height = h
    var ctx = MainCanvas.getContext("2d")
    let element = document.createElement("div")
    element.id = "FPS"
    document.body.appendChild(element)
    document.getElementById("FPS").style.position = "fixed"
    document.getElementById("FPS").style.top = "0px"
    document.getElementById("FPS").style.left = "0px"
    document.getElementById("FPS").style.backgroundColor = "rgba(0,0,0,0.7)"
    document.getElementById("FPS").style.color = "greenyellow"
    document.getElementById("FPS").style.fontSize = "15pt"
    document.getElementById("FPS").style.zIndex = "9".repeat(999)
    document.getElementById("FPS").style.userSelect = "none"
    document.getElementById("FPS").style.textShadow = ""
    document.getElementById("FPS").style.fontFamily = 'BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;'
    document.getElementById("FPS").innerText = "FPS:60"
    element = document.createElement("div")
    element.id = "Iteration"
    document.body.appendChild(element)
    document.getElementById("Iteration").style.position = "fixed"
    document.getElementById("Iteration").style.top = "29px"
    document.getElementById("Iteration").style.left = "0px"
    document.getElementById("Iteration").style.backgroundColor = "rgba(0,0,0,0.7)"
    document.getElementById("Iteration").style.color = "greenyellow"
    document.getElementById("Iteration").style.fontSize = "15pt"
    document.getElementById("Iteration").style.zIndex = "9".repeat(999)
    document.getElementById("Iteration").style.userSelect = "none"
    document.getElementById("Iteration").style.textShadow = ""
    document.getElementById("Iteration").style.fontFamily = 'BlinkMacSystemFont,"Segoe UI","Roboto","Oxygen","Ubuntu","Cantarell","Fira Sans","Droid Sans","Helvetica Neue",sans-serif;'
    document.getElementById("Iteration").innerText = "Iteration:100"
    const { useCPU, useDD } = getFlags(window.location.search);
    if (useCPU){
        drawCPU(MainCanvas);
    } else if (navigator.gpu){
        drawWebGPU(canvas, useDD);
    } else {
        drawWebGL(canvas.getContext("webgl"), useDD);
    }
})
}
