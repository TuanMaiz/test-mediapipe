/* eslint-disable no-unused-vars */
// debugger
import { useState, useEffect, useRef } from "react";
import "./App.css";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import Webcam from "react-webcam";
import { Camera } from "@mediapipe/camera_utils";

let video;
let faceDetector;
let runningMode = "VIDEO";

let lastVideoTime = -1;
const options = {
  baseOptions: {
    modelAssetPath: "../app/shared/models/blaze_face_short_range.tflite",
    delegate: "CPU",
  },
  runningMode: runningMode,
};
let detections;
const image_size = 150;
function Detection() {
  const [children, setChildren] = useState([]);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  // Check if webcam access is supported.
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

  // Keep a reference of all the child elements we create
  // so we can remove them easilly on each render.
  async function setUpFaceDetector() {

    if (!hasGetUserMedia()) {
      return;
    }

    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    faceDetector = await FaceDetector.createFromOptions(vision, options);

    video = document.getElementById("webcam");
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then(function (stream) {
        video.srcObject = stream;
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
      detections = faceDetector.detectForVideo(
        video,
        startTimeMs
      ).detections;
      displayVideoDetections(detections);
    }
    // Call this function again to keep predicting when the browser is ready
    window.requestAnimationFrame(predictWebcam);
  }
  function displayVideoDetections(detections) {
    // Remove any highlighting from previous frame.
    //console.log(detections)
    let liveView = document.getElementById("liveView");

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
  
  function handleSubmitFace(){
    console.log(detections)
    if(detections)
    {
      const canvas = canvasRef.current
      const vid = webcamRef.current
      canvas.width = detections[0].boundingBox.width
      canvas.height = detections[0].boundingBox.height

      const dx_left = detections[0].boundingBox.originX
      const dy_left = detections[0].boundingBox.originY

      console.log(dx_left, dy_left)
      const context = canvas.getContext("2d")
      context.drawImage(vid, 
        dx_left, dy_left, detections[0].boundingBox.width, detections[0].boundingBox.height, //source
        0, 0, image_size, image_size)//destination

      const base64Canvas = canvas.toDataURL("image/png").split(';base64,')[1];
      console.log(base64Canvas)
    }
  }
  useEffect(() => {
    setUpFaceDetector();
    return () => {
      if (predictWebcam)
        window.removeEventListener("loadeddata", setUpFaceDetector);
    };
  }, []);

  return (
    <div className="flex flex-row">
      {/* <Webcam id="webcam" ref={webcamRef} /> */}
      <div id="liveView" className='videoView'>
        <video id='webcam' autoPlay playsInline ref={webcamRef} src=""></video>
        <button onClick={handleSubmitFace}>Submit Face</button>
      </div>
      <canvas ref={canvasRef} width={image_size} height={image_size}/>
    </div>
  );
}

export default Detection;
