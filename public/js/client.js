
const socket = io();

var params = null;
var targetUsername =null;
var myPeerConnection = null;
var target = null;
var mediaConstraints = {
    audio: true, // We want an audio track
    video: true // ...and we want a video track
};


const data =  Qs.parse(location.search, {
    ignoreQueryPrefix: true
})
// console.log(data.usrName);
let usrName = data.usrName;
let textarea = document.getElementById('textarea');

let messageArea = document.querySelector('.message_area');


textarea.addEventListener('keyup', (e)=>{
    const keyCode = e.which || e.keyCode;
    if(keyCode === 13 && !e.shiftKey){
        sendMessage(e.target.value);
    }
})

// Join Chat Room
socket.emit('joinRoom', data);


function myFunction() {
    var x = document.getElementById("user_lisr");
    if (x.style.display === "none") {
        x.style.display = "block";
    } 
    else {
        x.style.display = "none";
    }
}
function myFunctionChat() {
    var x = document.getElementById("chat_section");
    if (x.style.display === "none") {
        x.style.display = "block";
    } 
    else {
        x.style.display = "none";
    }
}

function sendMessage(msgs){

    var tm =  new Date();

    let msg = {
        user: usrName,
        message: msgs.trim(),
        Hours: tm.getHours(),
        Minutes: tm.getMinutes()
    }
    // console.log(msg.message);
    appendMessage(msg, 'outgoing');
    textarea.value = '';
    scrollToBottom();

    // sending to server
    socket.emit('chat', msg);
}
window.onload = function(){
    textarea.focus();
}

function appendMessage(msg ,type){
    // console.log(msg.message);
    let mainDiv = document.createElement('div');
    let className = type;
    mainDiv.classList.add(className, 'message');
    let tme = document.createElement('code');
    tme.classList.add(className,'time');
    let tt = `${msg.Hours}:${msg.Minutes}`;
    tme.innerHTML = tt;

    let markup = `
        <h6>${msg.user} <code>${msg.Hours}:${msg.Minutes}</code></h6>
        <p style="white-space: pre-wrap;" class="paraMessage">${msg.message}</p>
    `
    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
}

function scrollToBottom(){
    messageArea.scrollTop = messageArea.scrollHeight;
}

socket.on('video-offer', (msg)=>{
    // console.log('client JS 95');

    var localStream = null;
    targetUsername = msg.name;
    createPeerConnection();
    // console.log('client js 100, peer connection created');

    var desc = new RTCSessionDescription(msg.sdp);

    myPeerConnection.setRemoteDescription(desc)
    .then(()=>{
        // console.log('Client js 106');
        return navigator.mediaDevices.getUserMedia(mediaConstraints);
    })
    .then((stream)=>{
        localStream = stream;
        document.getElementById('local_video').srcObject = localStream;
        localStream.getTracks().forEach(track=> myPeerConnection.addTrack(track, localStream));
    })
    .then(function () {  
        return myPeerConnection.createAnswer();
    })
    .then((answer)=>{
        return myPeerConnection.setLocalDescription(answer);
    })
    .then(()=>{
    //    myPeerConnection.setLocalDescription(answer)
        // console.log(myPeerConnection.localDescription);
        var msg = {
            name: usrName,
            target: targetUsername,
            type: 'video-answer',
            sdp: myPeerConnection.localDescription,
            room: data.room
        };
        // console.log('client js 122 video answer');
        // console.log(msg);
        socket.emit('video-answer', msg);
    })
    .catch(handleGetUserMediaError);

});

socket.on('new-ice-candidate', msg=>{

    // console.log('recieved newIce Candidate');
    // console.log(myPeerConnection);
    // console.log(msg.candidate);
    
    var candidate = new RTCIceCandidate(msg.candidate);

    myPeerConnection.addIceCandidate(candidate)
        .catch(reportError);
})


// recieve message
socket.on('chat', (msg)=>{
    appendMessage(msg, 'incoming');
    scrollToBottom();
});

socket.on('UserJoinedToAll', (msg, Uname)=>{
    let mainDiv = document.createElement('div');

    mainDiv.classList.add('joined');
    let markup = `
        <p>${msg}</p>
    `
    var li = document.createElement('li');
    var x = document.getElementById('user_list');
    li.setAttribute('id', Uname);
    li.append(Uname);
    x.appendChild(li);

    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
    scrollToBottom();
})

socket.on('UserJoinedTONew', (msg, users)=>{
    let mainDiv = document.createElement('div');

    mainDiv.classList.add('joined');
    let markup = `
        <p>${msg}</p>
    `

    users.forEach(user=> {
        var li = document.createElement('li');
        var x = document.getElementById('user_list');
        li.setAttribute('id', user.userName);
        li.append(user.userName);
        x.appendChild(li);
    });

    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
    scrollToBottom();
})

socket.on('userLeft', (msg, user)=>{
    let mainDiv = document.createElement('div');

    mainDiv.classList.add('joined');
    let markup = `
        <p>${msg}</p>
    `
    var x = document.getElementById('user_list');
    var item = document.getElementById(String(user.userName));
    
    x.removeChild(item);

    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
    scrollToBottom();
})


//Prompt the user before leave chat room
document.getElementById('leave-btn').addEventListener('click', () => {
    const leaveRoom = confirm('Are you sure you want to leave the chatroom?');
    if (leaveRoom) {
      window.location = '../index.html';
    } else {
}
});


