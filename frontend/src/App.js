import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import React, { useEffect, useRef, useState} from "react";
import ReactDom from 'react-dom';
import { CopyToClipboard } from "react-copy-to-clipboard";
import companyLogo from "./styles/vwooshLogo.png";
import Peer from "simple-peer";
import io from "socket.io-client";

import './styles/App.css';

// Connects to backend server
const socket = io.connect("http://localhost:5000")

function App() {
    // All State Initializations
    const [ me, setMe ] = useState("")
    const [ stream, setStream ] = useState()
    const [ receivingCall, setReceivingCall ] = useState(false)
    const [ caller, setCaller ] = useState("")
    const [ callerSignal, setCallerSignal ] = useState()
    const [ callAccepted, setCallAccepted ] = useState(false)
    const [ idToCall, setIdToCall ] = useState("")
    const [ callEnded, setCallEnded ] = useState(false)
    const [ name, setName ] = useState("")
    //
  
    // Ref Setups
    const myVideo = useRef() // As displayed below line 119
    const userVideo = useRef() // As displayed below line 123
    const connectionRef = useRef()
    //  

    // Starts Hook
    useEffect(() => {
      navigator.mediaDevices.getUserMedia({video : true, audio: true}).then((stream) => {
        setStream(stream)
        myVideo.current.srcObject = stream
      })

      // Sets Me as Id in State
      socket.on("me", (id) => {
        setMe(id)
      })

      // Sets various states on callUser (triggered in callUser function)
      socket.on("callUser", (data) => {
        setReceivingCall(true)
        setCaller(data.from) // Sets Call to Calling User Id
        setName(data.name) // Sets name to calling user name
        setCallerSignal(data.signal) // sets caller signal to callers signal
      })
    }, [])
                // 3.) passes in idToCall
    const callUser = (id) => {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream // Sets current user stream (webcam and audio)
      })

      // Emits Call User to Server (With User Data Obeject)
      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: id, // User to call id
          signalData: data, // Sends Signal Data
          from: me, // From Me
          name: name // User Name
        })
      })
      //

      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream // Represents the webcam and/or audio of the opposite user your on call with
      })

      // Recieved From Server when call is answered (with answering user signal)
      socket.on("callAccepted", (signal) => {
        setCallAccepted(true)
        peer.signal(signal) // Takes Answering User Signal
      })
      //

      connectionRef.current = peer

    }

    const answerCall = () => {
      setCallAccepted(true)
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream // Sets Current User Stream (Webcam and audio)
      })

      // Emits Answer Call on Server Side (When Call Answered) With User Object
      peer.on("signal", (data) => {
        socket.emit("answerCall", {signal: data, to: caller}) // Passes answering (current) users signal and caller to callers id
      })

      
      peer.on("stream", (stream) => {
        userVideo.current.srcObject = stream // Represents the webcam and/or audio of the opposite user your on call with
      })

      peer.signal(callerSignal) // Takes Caller Signal
      connectionRef.current = peer
    }

    const leaveCall = () => {
      setCallEnded(true)
      connectionRef.current.destroy()
    }

    return (    
    <div className="container">
        <div className="video-container">
            <div className="videoContainer1">                                
              {stream &&  <video className="video video1" playsInline muted ref={myVideo} autoPlay />}
            </div>
            <div className="videoContainer2 d-flex flex-column">
              {callAccepted && !callEnded ?
              <video className="video video2" playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
              null}
            </div>
        </div>
			<div className="myId">
          <img className="companyLogoImg" src={companyLogo} alt="logo"></img>
          <TextField
            id="filled-basic"
            label="Name"
            variant="filled"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ marginBottom: "20px" }}
          />
          <CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
              <button className='copyIdButton'>
              <i class="fas fa-phone"></i> Copy ID
              </button>
          </CopyToClipboard>

          <TextField
            id="filled-basic"
            label="ID to call"
            variant="filled"
            value={idToCall} // 1.) Sets Id To Call
            onChange={(e) => setIdToCall(e.target.value)}
          />
          <div className="call-button">
            {callAccepted && !callEnded ? (
              <button className="endCallButton" onClick={leaveCall}>
                End Call
              </button>
            ) : (                                                       // 2.) passes id to Call up to call user function                  
              <button className="makeCallButton my-auto" onClick={() => callUser(idToCall) }>  
                <i class="fas fa-phone"></i>
              </button>
            )}
          </div>
			</div>
			<div>
          {receivingCall && !callAccepted ? (
            <div className="caller">
              <h2 className="primaryColor">{name} is calling...</h2>
              <button className="answerCallButton my-auto" onClick={answerCall}>
                Answer
              </button>
            </div>
          ) : null}
			</div>
		</div>
  );
  //
}

export default App;
