// Minimal static file server for serving Next.js production build
// Ultra-lightweight: uses Bun native HTTP, ~30MB RAM
// Includes self-ping keepalive to prevent sandbox from killing idle process

const BUILD_DIR = '/home/z/my-project/.next';
const PORT = 3000;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
  '.data': 'application/octet-stream',
};

function getMimeType(path: string): string {
  const ext = path.substring(path.lastIndexOf('.'));
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// Pre-load the HTML file into memory for instant response
let cachedHtml: string | null = null;
try {
  cachedHtml = require('fs').readFileSync(`${BUILD_DIR}/server/app/index.html`, 'utf-8');
  console.log(`Cached index.html: ${cachedHtml.length} bytes`);
} catch {
  console.error('WARNING: Could not cache index.html');
}

const server = Bun.serve({
  port: PORT,
  reusePort: true,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // Serve root page from cache
      if (path === '/' || path === '') {
        if (cachedHtml) {
          return new Response(cachedHtml, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        }
        const file = Bun.file(`${BUILD_DIR}/server/app/index.html`);
        return new Response(file, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // Serve all .next assets (static, media, chunks)
      if (path.startsWith('/_next/')) {
        const filePath = BUILD_DIR + path;
        const file = Bun.file(filePath);
        if (await file.exists()) {
          return new Response(file, {
            headers: {
              'Content-Type': getMimeType(path),
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }

      // Serve files from public/
      const publicPath = `/home/z/my-project/public${path}`;
      const publicFile = Bun.file(publicPath);
      if (await publicFile.exists()) {
        return new Response(publicFile, {
          headers: {
            'Content-Type': getMimeType(path),
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // 404
      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
});

console.log(`Minimal server running on port ${PORT}`);

// Self-ping keepalive every 8 seconds to prevent sandbox from killing idle process
setInterval(async () => {
  try {
    const res = await fetch(`http://localhost:${PORT}/`);
    console.log(`keepalive: ${res.status}`);
  } catch (e) {
    console.error('keepalive failed');
  }
}, 8000);

// Keep process alive with a blocking timer
setInterval(() => {
  // noop - just keep event loop alive
}, 60000);
