var gl = null,
canvas = null,
glProgram = null,
fragmentShader = null,
vertexShader = null;
var vertexPositionAttribute = null,
    trianglesVerticeBuffer = null;
var vertexColorAttribute = null,
    trianglesColorBuffer = null;
var mvMatrix = mat4.create();

function initWebGL() {
    canvas = document.getElementById("my-canvas");
    try {
        gl = canvas.getContext("webgl") ||
             canvas.getContext("experimental-webgl");
    } catch (e) {
    }
    if (gl) {
        initShaders();
        setupBuffers();
        getUniforms();
        document.onkeydown = handleKeyDown;
        document.onkeyup = handleKeyUp;
        (function animLoop() {
            setupWebGL();
            handleKeys();
            drawScene();
            requestAnimationFrame(animLoop, canvas);
        })();
    } else {
        alert("Error: Your browser does not appear to support WebGL.");
    }
}
function setupWebGL() {
    //set the clear color to a shade of green
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);
}
function initShaders() {
    //get shader source
    var fs_source = document.getElementById('shader-fs').innerHTML,
     vs_source = document.getElementById('shader-vs').innerHTML;
    //compile shaders
    vertexShader = makeShader(vs_source, gl.VERTEX_SHADER);
    fragmentShader = makeShader(fs_source, gl.FRAGMENT_SHADER);
    //create program
    glProgram = gl.createProgram();
    //attach and link shaders to the program
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, fragmentShader);
    gl.linkProgram(glProgram);
    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program.");
    }
    //use program
    gl.useProgram(glProgram);
}
function makeShader(src, type) {
    //compile the vertex shader
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Error compiling shader: " + gl.getShaderInfoLog(shader));
    }
    return shader;
}
function setupBuffers() {
    var triangleVertices = [
      -1.0,  1.0, 0.0,
       1.0, -1.0, 0.0,
      -1.0, -1.0, 0.0,
       1.0,  1.0, 0.0,
      -1.0,  1.0, 0.0,
       1.0, -1.0, 0.0,
    ];
    trianglesVerticeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);

    var triangleColors = [
                // triangle Colors
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
                1.0, 1.0, 1.0,
    ];
    trianglesColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleColors), gl.STATIC_DRAW);
}
function drawScene() {

    vertexPositionAttribute = gl.getAttribLocation(glProgram, "aVertexPosition");
    gl.enableVertexAttribArray(vertexPositionAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesVerticeBuffer);
    gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    vertexColorAttribute = gl.getAttribLocation(glProgram, "aVertexColor");
    gl.enableVertexAttribArray(vertexColorAttribute);
    gl.bindBuffer(gl.ARRAY_BUFFER, trianglesColorBuffer);
    gl.vertexAttribPointer(vertexColorAttribute, 3, gl.FLOAT, false, 0, 0);

    racket_left();
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    racket_right();
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    drawball();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function getUniforms() {
    glProgram.uMVMatrix = gl.getUniformLocation(glProgram, "uMVMatrix");
}

function racket_left() {
    mat4.identity(mvMatrix);
    mat4.scale(mvMatrix, [0.01, 0.1, 1]);
    mat4.translate(mvMatrix, [-90 , move_local, 0.0]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);

}

function racket_right() {
    mat4.identity(mvMatrix);
    mat4.scale(mvMatrix, [0.01, 0.1, 1]);
    mat4.translate(mvMatrix, [90, move_remote, 1]);
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);
}

var rkt_local = [10, -10];
var rkt_remote = [10, -10];
var angle_y = 0.1*Math.random();
var sum_y = Math.random() < 0.5 ? -1 : 1;;
var angle_x = 0.1*Math.random();
var sum_x = Math.random() < 0.5 ? -1 : 1;;
var ball = [angle_x, angle_y];
var move_local = 0.0;
var move_remote = 0.0;


function start() {
    angle_x = 0.0;
    angle_y = 0.0;
}

function drawball() {
    ball = [angle_x, angle_y];
    if(angle_y >= 95 || angle_y <= -95){
        sum_y = sum_y*(-1);
    }
    if(angle_x >= 100) {
        if(ballControl){
            console.log("ball",ballControl);
            console.log(typeof(localPoint));
            console.log(localPoint);
            localPoint += 1;
            console.log(localPoint);
            socket.emit("point", [localPoint, remotePoint]);
            $("#localPoint .point").html(localPoint.toString());
        }
        start();
    }

    if (angle_x <= -100) {
        if(ballControl){
            remotePoint += 1;
            socket.emit("point", [localPoint, remotePoint]);
            $("#remotePoint .point").html(remotePoint.toString());
        }
        start();
    }
    if ((ball[0] < -88 && ball[0] > -91) &&
        (ball[1] < rkt_local[0] && ball[1] > rkt_local[1])){
            sum_x = sum_x*(-1);
    }
    if ((ball[0] > 88 && ball[0] < 91) &&
        (ball[1] < rkt_remote[0] && ball[1] > rkt_remote[1])){
            sum_x = sum_x*(-1);
    }
    angle_y += (0.9*sum_y);
    angle_x += (0.7*sum_x);
    ball = [angle_x, angle_y];
    mat4.identity(mvMatrix);
    mat4.scale(mvMatrix, [0.01, 0.01, 1]);
    mat4.translate(mvMatrix, [angle_x , angle_y, 0.0]);
    if (ballControl){
        socket.emit('gameBall', ball);
    }
    gl.uniformMatrix4fv(glProgram.uMVMatrix, false, mvMatrix);
}

var currentlyPressedKeys = {};
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}
function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}
function handleKeys() {
    if (currentlyPressedKeys[38]) {
        // Up
        move_local += 0.2;
        rkt_local[0] += 2;
        rkt_local[1] = rkt_local[0]-20;

        if(move_local >= 9){
            move_local = 9;
            rkt_local[0] = 100;
            rkt_local[1] = rkt_local[0]-20;
        }
        socket.emit('game', move_local, rkt_local);
    }
    if (currentlyPressedKeys[40]) {
        // Down
        move_local -= 0.2;
        rkt_local[0] -= 2;
        rkt_local[1] = rkt_local[0]-20;
        if ( move_local <= -9){
            rkt_local[1] = -100;
            rkt_local[0] = rkt_local[1]+20;
            move_local = -9;
        }
        socket.emit('game', move_local, rkt_local);
    }
}
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if([38, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);


socket.on('receiveGame', function(moveRemote, racketRemote) {
    move_remote = moveRemote;
    rkt_remote = racketRemote;
})

socket.on('receiveGameBall', function(ball) {
    angle_x = ball[0]*-1;
    angle_y = ball[1];
})

socket.on('receivePoint', function(point) {
    localPoint = point[1];
    remotePoint = point[0];
    $("#remotePoint .point").html(remotePoint.toString());
    $("#localPoint .point").html(localPoint.toString());
})
