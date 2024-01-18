/* eslint-disable no-unused-vars */
import { useEffect, useRef } from 'react'
import './App.css'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'
import Webcam from 'react-webcam';
import { Camera } from '@mediapipe/camera_utils';


let video;
let faceDetector;
let runningMode = "VIDEO"
let children = [];
let lastVideoTime = -1;
const options = {
    baseOptions: {
      modelAssetPath: "../app/shared/models/blaze_face_short_range.tflite",
      delegate: "GPU"
    },
    runningMode: runningMode,
  }
function Detection() {

  const webcamRef = useRef(null)
  // Check if webcam access is supported.
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  
  // Keep a reference of all the child elements we create
  // so we can remove them easilly on each render.
  async function setUpFaceDetector() {

    if(!hasGetUserMedia()){
      return
    }

    const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm")
    faceDetector = await FaceDetector.createFromOptions(vision, options)

    video = document.getElementById('webcam')
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    }).then((stream) => {
      video.srcObject = stream
      video.addEventListener("loadeddata", predictWebcam);
    })
    .catch((error) => {
      console.error("Error accessing webcam:", error);
    });
  }

  function predictWebcam() {
    let startTimeMs = performance.now();
      // Detect faces using detectForVideo
    if (video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;
      const detections = faceDetector
        .detectForVideo(
          video, 
          startTimeMs)
        .detections;
      displayVideoDetections(detections);
    }

    // Call this function again to keep predicting when the browser is ready
    window.requestAnimationFrame(predictWebcam);
  }
  function displayVideoDetections(detections) {
    // Remove any highlighting from previous frame.
    //console.log(detections)
    let liveView = document.getElementById('liveView')

    for (let child of children) {
      liveView.removeChild(child);
    }
    children.splice(0);
  
    // Iterate through predictions and draw them to the live view
    for (let detection of detections) {
      const p = document.createElement("p");
      p.innerText =
        "Confidence: " +
        Math.round(parseFloat(detection.categories[0].score) * 100) +
        "% .";
      p.style =
        "left: " +
        (video.offsetWidth -
          detection.boundingBox.width -
          detection.boundingBox.originX) +
        "px;" +
        "top: " +
        (detection.boundingBox.originY - 30) +
        "px; " +
        "width: " +
        (detection.boundingBox.width - 10) +
        "px;";
  
      const highlighter = document.createElement("div");
      highlighter.setAttribute("class", "highlighter");
      highlighter.style =
        "left: " +
        (video.offsetWidth -
          detection.boundingBox.width -
          detection.boundingBox.originX) +
        "px;" +
        "top: " +
        detection.boundingBox.originY +
        "px;" +
        "width: " +
        (detection.boundingBox.width - 10) +
        "px;" +
        "height: " +
        detection.boundingBox.height +
        "px;";
  
      liveView.appendChild(highlighter);
      liveView.appendChild(p);
  
      // Store drawn objects in memory so they are queued to delete at next call
      children.push(highlighter);
      children.push(p);
      for (let keypoint of detection.keypoints) {
        const keypointEl = document.createElement("spam");
        keypointEl.className = "key-point";
        keypointEl.style.top = `${keypoint.y * video.offsetHeight - 3}px`;
        keypointEl.style.left = `${
          video.offsetWidth - keypoint.x * video.offsetWidth - 3
        }px`;
        liveView.appendChild(keypointEl);
        children.push(keypointEl);
      }
    }
  }
  useEffect(() =>{
    setUpFaceDetector()
    // return () => {
    //   video = null
    //   video.removeEventListener("loadeddata", predictWebcam);
    // }
  }, [])


  return (
    <div id="liveView" className='videoView'>
      <Webcam id='webcam' ref={webcamRef} />
      {/* <canvas ref={canvasRef} width={640} height={480} /> */}
      {/* <video id='webcam' autoPlay playsInline src=""></video> */}
    </div>
  )
}

export default Detection
