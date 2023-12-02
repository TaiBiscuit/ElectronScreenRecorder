/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
*/

import './index.css';
import { ipcRenderer } from 'electron';
import { write, writeFile } from 'fs';

console.log('👋 This message is being logged by "renderer.js", included via webpack');


//Elements

const videoOut = document.querySelector('video');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const chooseBtn = document.getElementById('choose-btn');
const selectMenu = document.getElementById('select-menu');



//Variables

let mediaRecorder;
let recordedChunks = [];



// Events

chooseBtn.addEventListener('click', (e) => {
  e.preventDefault();
  getVideoSources();
});

startBtn.addEventListener('click', (e) => {
  e.preventDefault();
  startRecord()
});

stopBtn.addEventListener('click', (e) => {
  e.preventDefault();
  mediaRecorder.stop();
});



// Functions

async function getVideoSources() {
    const inputSources = await ipcRenderer.invoke('getSources')

    inputSources.forEach(source => {
      const element = document.createElement("option")
      element.value = source.id
      element.innerHTML = source.name
      selectMenu.appendChild(element)
      selectMenu.style.display= 'inline';
    }); 
}

async function startRecord() {
  const screenId = selectMenu.options[selectMenu.selectedIndex].value;
  
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: screenId
      }
    }
  }

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoOut.srcObject = stream;
  await videoOut.play();
  videoOut.style.width = "600px";
  videoOut.style.height = '1000px';
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9'});
  mediaRecorder.ondataavailable = onDataAvailable;
  mediaRecorder.onstop = stopRecording;
  mediaRecorder.start();
} 


function onDataAvailable(e) {
  recordedChunks.push(e.data);
}

async function stopRecording(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const { canceled, filePath } = await ipcRenderer.invoke('showSaveDialog');

  if(canceled) return

  if(filePath) {
    writeFile(filePath, buffer, () => console.log('Video saved!'));
  }
}