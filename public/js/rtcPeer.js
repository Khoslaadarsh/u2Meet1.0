document.getElementById('user_list').addEventListener('click', (e)=>{
    // console.log(e.target);
    invite(e.target);
})

// Inviting user
function invite(target) {
    // console.log(target.innerHTML);
    // alert(target.innerHTML);
    if(myPeerConnection){
        alert('You can\'t start a call because you are already have one open! ');
    }else{
        var clickedUsername = target.innerHTML;
        if(clickedUsername === usrName){
            alert(" I'm afraid I can't let you talk to yourself. That would be weird.");
            return;
        }

        targetUsername = clickedUsername;
        createPeerConnection();

        navigator.mediaDevices.getUserMedia(mediaConstraints)
            .then((localStream)=>{
                document.querySelector('#local_video').srcObject = localStream;
                localStream.getTracks().forEach(track => myPeerConnection.addTrack(track, localStream));
            })
            .catch(handleGetUserMediaError);
    }
};


// // Handling getUserMedia() errors
function handleGetUserMediaError(e) {
    switch(e.name) {
      case "NotFoundError":
        alert("Unable to open your call because no camera and/or microphone" +
              "were found.");
        break;
      case "SecurityError":
      case "PermissionDeniedError":
        // Do nothing; this is the same as the user canceling the call.
        break;
      default:
        alert("Error opening your camera and/or microphone: " + e.message);
        break;
    }
  
    closeVideoCall();
};

// Creating peer connection
function createPeerConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [     // Information about ICE servers - Use your own!
          {
            urls: ['stun:stun01.sipphone.com', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302'
                  , 'stun:stun4.l.google.com:19302', 'stun:stun.l.google.com:19302', 'stun:stun.ekiga.net', 'stun:stun.fwdnet.net'
          ]
          }
        ],
        iceCandidatePoolSize: 10
    });

    // console.log("rtc peer 61");

    myPeerConnection.onnegotiationneeded = handleNegotiationNeededEvent;
    myPeerConnection.onicecandidate = handleICECandidateEvent;
    myPeerConnection.ontrack = handleTrackEvent;
    myPeerConnection.onremovetrack = handleRemoveTrackEvent;
    myPeerConnection.onconnectionstatechange = ()=>{

        console.log('CONNECTION ESTABLISHED......................', myPeerConnection.iceConnectionState);
        
        
    }
    myPeerConnection.oniceconnectionstatechange = handleICEConnectionStateChangeEvent;
    myPeerConnection.onicegatheringstatechange = handleICEGatheringStateChangeEvent;
    myPeerConnection.onsignalingstatechange = handleSignalingStateChangeEvent;
};



// REPORTING ERROR
function reportError() {  
    console.log('something wrong');
}

  
  
// NEGOTIATION

// handleNegotiationNeededEvent
function handleNegotiationNeededEvent() {
    // console.log('myPeerConnection-> at handleNegotiationNeededEvent:  ');
    // console.log(myPeerConnection);


    socket.on('video-answer', async msg=>{
        if(msg.type){
            // console.log('recieving video-answer');
            // console.log(msg.sdp);
            
            const remoteDesc = new RTCSessionDescription(msg.sdp);
            // console.log(remoteDesc);
            await myPeerConnection.setRemoteDescription(remoteDesc);
        }
        
    });
    



    myPeerConnection.createOffer().then(function(offer) {
      return myPeerConnection.setLocalDescription(offer);
    })
    .then(function() {
        // console.log('1.sending video-offer');
        socket.emit('video-offer', {
            name: usrName,
            target: targetUsername,
            type: "video-offer",
            sdp: myPeerConnection.localDescription,
            room: data.room
        })
    })
    .catch(reportError);
  }

function handleICECandidateEvent(event) {
    // console.log('myPeerConnection from handleICECandidateEvent')
  
  if (event.candidate) {
      socket.emit('new-ice-candidate', {
          type: "new-ice-candidate",
          target: targetUsername,
          candidate: event.candidate,
          myPeerConnection: myPeerConnection,
          room: data.room
      })
  }
}


function handleTrackEvent(event) {
    // console.log('settingup REMOTE video', event);

    document.getElementById("received_video").srcObject = event.streams[0];
    
    console.log(document.getElementById("received_video").srcObject);
    document.getElementById("hangup").disabled = false;
  }





  function handleRemoveTrackEvent(event) {
    var stream = document.getElementById("received_video").srcObject;
    var trackList = stream.getTracks();
   
    if (trackList.length == 0) {
      closeVideoCall();
    }
}


// Closevideo Ending the call
function closeVideoCall() {
    var remoteVideo = document.getElementById("received_video");
    var localVideo = document.getElementById("local_video");
    console.log('closing the call');
    console.log(remoteVideo.srcObject);
    console.log(localVideo.srcObject);

    if (myPeerConnection) {
      myPeerConnection.ontrack = null;
      myPeerConnection.onremovetrack = null;
      myPeerConnection.onremovestream = null;
      myPeerConnection.onicecandidate = null;
      myPeerConnection.oniceconnectionstatechange = null;
      myPeerConnection.onsignalingstatechange = null;
      myPeerConnection.onicegatheringstatechange = null;
      myPeerConnection.onnegotiationneeded = null;
  
      if (remoteVideo.srcObject) {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      if (localVideo.srcObject) {
        localVideo.srcObject.getTracks().forEach(track => track.stop());
      }
  
      myPeerConnection.close();
      myPeerConnection = null;
    }
  
    remoteVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
    localVideo.removeAttribute("src");
    remoteVideo.removeAttribute("srcObject");
  
    document.getElementById("hangup").disabled = true;
    targetUsername = null;
  }
//   IceConnectionStagechange
function handleICEConnectionStateChangeEvent(event) {
    console.log("I am at handleICEConnectionStateChaneEvent", myPeerConnection.iceConnectionState);
    switch(myPeerConnection.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        closeVideoCall();
        break;
    }
  }

// ICE signaling state
function handleSignalingStateChangeEvent(event) {
  console.log("I am at handleSignalingStateChangeEvent", myPeerConnection.iceConnectionState);
    switch(myPeerConnection.signalingState) {
      case "closed":
        closeVideoCall();
        break;
    }
};
// Ice gathering event
function handleICEGatheringStateChangeEvent(event) {
    // console.log('event');

  }

//   HANGUP THE CALL

function hangUpCall() {
  console.log('hangup button clicked');
    closeVideoCall();
    socket.emit('hangup-Call', {
        name: usrName,
        target: targetUsername,
        type: "hang-up"
    })
}

document.getElementById('hangup').addEventListener('click', hangUpCall);




