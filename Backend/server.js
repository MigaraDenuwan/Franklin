import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8000;
const STREAM_DIR = path.join(process.cwd(), 'streams');

// Ensure stream directory exists
if (!fs.existsSync(STREAM_DIR)) fs.mkdirSync(STREAM_DIR, { recursive: true });

// CONFIG: add your cameras here
const CAMERAS = [
  { id: 'camera1', rtspUrl: 'rtsp://admin:EDSNNP@192.168.8.100:554/Streaming/Channels/101' },
  // add more cameras if needed
];

// **Use full path to ffmpeg.exe on Windows**
const FFMPEG_PATH = 'C:\\Program Files\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe';

CAMERAS.forEach((cam) => {
  const outDir = path.join(STREAM_DIR, cam.id);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'stream.m3u8');

  console.log(`Starting ffmpeg for ${cam.id}`);

  const args = [
    '-rtsp_transport', 'tcp',    // use TCP for RTSP
    '-i', cam.rtspUrl,           // input
    '-fflags', 'nobuffer',
    '-max_delay', '0',
    '-c:v', 'copy',              // copy video (fast). Use libx264 if you need re-encoding
    '-c:a', 'aac',               // convert audio if present
    '-f', 'hls',
    '-hls_time', '2',            // segment length in seconds
    '-hls_list_size', '3',
    '-hls_flags', 'delete_segments+append_list',
    '-hls_allow_cache', '0',
    outPath
  ];

  // Use full path to ffmpeg
  const ff = spawn(FFMPEG_PATH, args, { stdio: ['ignore', 'pipe', 'pipe'] });

  ff.stdout.on('data', (d) => console.log(`[ffmpeg ${cam.id} stdout] ${d.toString()}`));
  ff.stderr.on('data', (d) => console.log(`[ffmpeg ${cam.id} stderr] ${d.toString()}`));
  ff.on('exit', (code, signal) => {
    console.warn(`ffmpeg for ${cam.id} exited code=${code} signal=${signal}`);
  });
});

// Serve streams directory
app.use('/streams', express.static(STREAM_DIR, {
  setHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.get('/', (req, res) => {
  res.send('EZVIZ HLS streaming server. Streams: ' + CAMERAS.map(c => `/streams/${c.id}/stream.m3u8`).join(', '));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
