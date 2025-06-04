window.addEventListener("load",() => {
    /**
     * 
     * @param {WebGLRenderingContextBase} gl 
     */
    async function draw(gl){
        const VERTEX_SHADER = await (await fetch("./index.vert")).text()
        const FRAGMENT_SHADER = await (await fetch("./index.frag")).text()
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
        let s = 1000/60 * 6
        let _iter = 100
        function render(){
            gl.uniform1f(gl.getUniformLocation(program,"t"),(new Date() - time) / 1000)
            gl.uniform2f(gl.getUniformLocation(program,"r"),w,h)
            gl.uniform1f(gl.getUniformLocation(program,"_iter"),_iter)
            gl.uniform1f(gl.getUniformLocation(program,"zoom"),zoom)
            gl.uniform2f(gl.getUniformLocation(program,"position"),nowX, nowY)
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
                console.log(frames);
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
        })
        window.addEventListener("mousemove",(e) => {
            if(clicking){
                nowX = (clickX-e.clientX)/zoom/(h/3.0) + pointerX
                nowY = (clickY-e.clientY)/zoom/(h/3.0) + pointerY
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
        render()
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
    var gl = canvas.getContext("webgl")
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
    draw(gl)
})