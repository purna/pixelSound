const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const assert = require('node:assert/strict');
const sandbox = { console, TextDecoder, TextEncoder, WebAssembly, Blob, URL, setTimeout, clearTimeout, performance, fetch };
sandbox.Worker = class {};
sandbox.document = {currentScript:{tagName:"SCRIPT",src:"http://localhost/js/vendor/ogg-opus-decoder-1.7.5.min.js"}};
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const path of ['js/vendor/ogg-vorbis-decoder-0.1.20.min.js', 'js/vendor/ogg-opus-decoder-1.7.5.min.js', 'js/audioDecoding.js']) vm.runInContext(fs.readFileSync(require('node:path').join(root, path),'utf8'),sandbox);
const context = {
 async decodeAudioData() { throw new Error('Simulated browser OGG decoding failure'); },
 createBuffer(channels, samples, rate) {
  const channelData = Array.from({length:channels},()=>new Float32Array(samples));
  return {numberOfChannels:channels,length:samples,sampleRate:rate,duration:samples/rate,channelData,copyToChannel(data,index){channelData[index].set(data);}};
 }
};
(async () => {
 for (const codec of ['vorbis','opus']) {
  const file = new Blob([fs.readFileSync(path.join(__dirname, 'fixtures', `${codec}.ogg`))]);
  const decoded = await sandbox.decodeConverterAudio(context,file);
  assert(decoded.duration > 0);
  assert(decoded.channelData.some(channel=>channel.some(sample=>Math.abs(sample)>.001)));
  assert(decoded.channelData.every(channel=>channel.every(Number.isFinite)));
  console.log(`${codec}: decoded ${decoded.numberOfChannels} channels, ${decoded.sampleRate} Hz, ${decoded.duration.toFixed(3)} seconds of real audio after native decoding failed.`);
 }
 const nativeBuffer = {};
 assert.equal(await sandbox.decodeConverterAudio({decodeAudioData:async()=>nativeBuffer},new Blob(['WAV data'])),nativeBuffer);
 await assert.rejects(()=>sandbox.decodeConverterAudio(context,new Blob(['not audio'])),/damaged|unsupported/);
 await assert.rejects(()=>sandbox.decodeConverterAudio(context,new Blob(['OggSunsupported'])),/Vorbis or Opus/);
 console.log('Native WAV path and invalid/unsupported audio errors passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
