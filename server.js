var express = require("express")
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('.'));

io.on('connection', function(socket){
    socket.on('join', function(user, room){
        console.log("join user:",user,"room:",room)
        socket.username = user;
        socket.room = room;
        socket.join(room);
        socket.broadcast.to(socket.room).emit('chat message', user+' ha entrado en la sala');
    });

    socket.on('invite', function(sdp){
        console.log("invite")
        socket.broadcast.to(socket.room).emit('invite', socket.username+" requestOffer");
    });

    socket.on('OK', function(sdp){
        console.log("OK")
        socket.broadcast.to(socket.room).emit('chat message', socket.username, 'OK '+sdp);
    });

    socket.on('chat message', function(msg){
        socket.broadcast.to(socket.room).emit('chat message', socket.username, msg);
    });

    socket.on('candidate', function(candidate, pc){
        console.log("candidate");
        socket.broadcast.to(socket.room).emit('receiveCandidate', candidate);
    });

    socket.on('description', function(desc){
        console.log("description");
        socket.broadcast.to(socket.room).emit('receiveDesciption', desc);
    });

    socket.on('answer', function(desc){
        console.log("answer");
        socket.broadcast.to(socket.room).emit('receiveAnswer', desc);
    });

    socket.on('game', function(move, racket){
        console.log("game");
        socket.broadcast.to(socket.room).emit('receiveGame', move, racket);
    });

    socket.on('gameBall', function(game){
        console.log("game ball");
        socket.broadcast.to(socket.room).emit('receiveGameBall', game);
    });

    socket.on('point', function(point){
        console.log("point");
        socket.broadcast.to(socket.room).emit('receivePoint', point);
    });

    socket.on('hangup', function(msg){
        console.log("hangup");
        socket.broadcast.to(socket.room).emit('receiveHangup', msg);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
