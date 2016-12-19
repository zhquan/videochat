'use strict';

var videoLocal = document.getElementById("localVideo");
var videoRemote = document.getElementById("remoteVideo");

var pc;
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

var sendChannel;
var receiveChannel;
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var sendButton = document.querySelector('button#sendButton');
var socket = io();
var ballControl = false;
var localPoint = 0;
var remotePoint = 0;
var startButton = document.getElementById('startButton');
var callButton = document.getElementById('callButton');
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

socket.emit('join', prompt('nickname'), prompt('room'));

socket.on('chat message', function(name, msg){
    if (msg != undefined){
        dataChannelReceive.value += name+": "+msg+"\n";
    } else {
        dataChannelReceive.value += name+"\n";
    }

});

sendButton.onclick = sendData;

function sendData() {
    socket.emit('chat message', $('#dataChannelSend').val());
    var data = dataChannelSend.value;
    dataChannelReceive.value += "Me: "+data+"\n";
    dataChannelSend.value = "";
    //sendChannel.send(data);
    trace('Sent Data: ' + data);
}

function receiveChannelCallback(event) {
    trace('Receive Channel Callback');
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
    trace('Received Message');
    dataChannelReceive.value = event.data;
}

function onReceiveChannelStateChange() {
    var readyState = receiveChannel.readyState;
    trace('Receive channel state is: ' + readyState);
}

function onSendChannelStateChange() {
    var readyState = sendChannel.readyState;
    trace('Send channel state is: ' + readyState);
    if (readyState === 'open') {
        //dataChannelSend.disabled = false;
        dataChannelSend.focus();
        //sendButton.disabled = false;
    } else {
        console.log("ok");
        //dataChannelSend.disabled = true;
        //sendButton.disabled = true;
    }
}

function trace(text) {
    if (text[text.length - 1] === '\n') {
        text = text.substring(0, text.length - 1);
    }
    if (window.performance) {
        var now = (window.performance.now() / 1000).toFixed(3);
        //console.log(now + ': ' + text);
    } else {
        console.log(text);
    }
}
function getUserMedia(){
    var constraints = window.constraints = {
        audio: false,
        video: {
            width: {max: 400},
            height: {max: 400},
        }
    };
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
        var videoTracks = stream.getVideoTracks();
        console.log('Got stream with constraints:');
        console.log('Using video device: ' + videoTracks[0].label);
        stream.onended = function() {
            console.log('Stream ended');
        };
        window.stream = stream; // make variable available to browser console
        videoLocal.srcObject = stream;
        pc.addStream(stream);
    })
    .catch(function(error) {
        if (error.name === 'ConstraintNotSatisfiedError') {
            errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
            constraints.video.width.exact + ' px is not supported by your device.');
        } else if (error.name === 'PermissionDeniedError') {
            errorMsg('Permissions have not been granted to use your camera and ' +
            'microphone, you need to allow the page access to your devices in ' +
            'order for the demo to work.');
        }
        errorMsg('getUserMedia error: ' + error.name, error);
    });
}
function onStart() {
    pc = new RTCPeerConnection(null);
    pc.onaddstream = function(e) {
        videoRemote.srcObject = e.stream;
    }
    getUserMedia();
    startButton.disabled = true;
    callButton.disabled = false;
}
function onCall(){
    ballControl = true;
    console.log("onCall");
    trace('Requesting local stream');
    trace('Create local peer connection objec pc');
    pc.onicecandidate = function(e) {
        onIceCandidate(e);
    };
    pc.createOffer(
        offerOptions
    ).then(
        onCreateOfferSuccess,
        onCreateSessionDescriptionError
    );
    callButton.disabled = true;
    hangupButton.disabled = false;
}
function hangup() {
    pc.close();
    result();
    socket.emit("hangup", "hangup");
    startButton.disabled = false;
    callButton.disabled = true;
    hangupButton.disabled = true;
}
function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}

function onCreateOfferSuccess(desc) {
    trace('pc setLocalDescription start');
    pc.setLocalDescription(desc);
    socket.emit('description', desc);
    trace('pc setRemoteDescription start');
}

function onSetLocalSuccess(pc) {
    trace('setLocalDescription complete');
}

function onSetRemoteSuccess(pc) {
    trace('setRemoteDescription complete');
}

function onSetSessionDescriptionError(error) {
    trace('Failed to set session description: ' + error.toString());
}

function gotRemoteStream(e) {
    window.videoRemote = videoRemote.srcObject = e.stream;
    trace('pc remote received remote stream');
}

function onCreateAnswerSuccess(desc) {
    trace('pc remote setLocalDescription start');
    console.log("answer");
    pc.setLocalDescription(desc)
    .then(
        function() {
            onSetLocalSuccess(pc);
        },
        onSetSessionDescriptionError
    );
    socket.emit('answer', desc);
}

function onIceCandidate(event) {
    console.log("onIceCandidate");
    if (event.candidate) {
        var candidate = event.candidate.candidate;
        var candidate = {
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
        }
        socket.emit('candidate', candidate);
    }
}

function onAddIceCandidateSuccess(pc) {
  trace(' addIceCandidate success');
}

function onAddIceCandidateError(pc, error) {
  trace(' failed to add ICE Candidate: ' + error.toString());
}

socket.on('receiveCandidate', function(msg){
    console.log("receiveCandidate");
    var candidate = new RTCIceCandidate(msg);
    pc.addIceCandidate(candidate)
    .then(
        function() {
            onAddIceCandidateSuccess(pc);
        },
        function(err) {
            onAddIceCandidateError(pc, err);
        }
    );
});

socket.on('receiveDesciption', function(desc){
    console.log("receiveDesciption", pc);
    var session = new RTCSessionDescription(desc);
    pc.setRemoteDescription(session).then(function () {
        pc.createAnswer().then(
            onCreateAnswerSuccess,
            onCreateSessionDescriptionError
        );
    });
});

socket.on('receiveAnswer', function(desc){
    var session = new RTCSessionDescription(desc);
    pc.setRemoteDescription(session);
});

socket.on('receiveHangup', function(desc){
    result();
});

function result() {
    ballControl = false;
    if (localPoint > remotePoint) {
        $("#result").html("<h1>WIN</h1>");
    } else if (localPoint == remotePoint) {
        $("#result").html("<h1>DRAW</h1>");
    } else {
        $("#result").html("<h1>LOSE</h1>");
    }
}
