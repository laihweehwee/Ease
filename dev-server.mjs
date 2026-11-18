import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const LIVE_RELOAD_SCRIPT = `
<!-- Live Reload Script -->
<script>
(() => {
  let es = new EventSource('/__live_reload');
  es.onmessage = (e) => {
    if (e.data === 'reload') {
      console.log('[LiveReload] Change detected, reloading page...');
      location.reload();
    }
  };
  es.onerror = () => {
    // Reconnect after brief pause
    setTimeout(() => {
      es = new EventSource('/__live_reload');
    }, 2000);
  };
})();
</script>
`;

const clients = new Set();

function broadcastReload() {
  for (const client of clients) {
    client.write('data: reload\n\n');
  }
}

// Watch directory for file changes
let reloadDebounce = null;
fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
  if (!filename) return;
  // Ignore server itself or temp files
  if (filename.includes('dev-server') || filename.startsWith('.')) return;

  const ext = path.extname(filename).toLowerCase();
  if (['.html', '.css', '.js', '.json', '.svg'].includes(ext)) {
    clearTimeout(reloadDebounce);
    reloadDebounce = setTimeout(() => {
      console.log(`[LiveReload] ${filename} changed. Reloading browser...`);
      broadcastReload();
    }, 100);
  }
});

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);

  // Server-Sent Events endpoint for live reloading
  if (reqUrl.pathname === '/__live_reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write('retry: 1000\n\n');
    clients.add(res);

    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  // Resolve safe file path
  let safePath = path.normalize(reqUrl.pathname);
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(__dirname, safePath);

  // Security check: ensure file is inside __dirname
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (ext === '.html') {
      fs.readFile(filePath, 'utf8', (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          res.end('Error reading file');
          return;
        }

        // Inject live reload script before </body>
        const injected = content.includes('</body>')
          ? content.replace('</body>', `${LIVE_RELOAD_SCRIPT}</body>`)
          : content + LIVE_RELOAD_SCRIPT;

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(injected);
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`🚀 Ease Babysitter Live Dev Server`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`⚡ Live reloading is active on file edits`);
  console.log(`=========================================`);
});
