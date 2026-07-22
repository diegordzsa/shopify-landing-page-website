import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.mjs':  'text/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mime[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
  const ext = path.extname(filePath).toLowerCase();

  if (ext) {
    serveFile(filePath, res);
  } else {
    // Try directory/index.html for extensionless paths (e.g. /audit -> audit/index.html)
    const indexPath = path.join(filePath, 'index.html');
    fs.access(indexPath, fs.constants.F_OK, (err) => {
      if (!err) {
        serveFile(indexPath, res);
      } else {
        // Try with .html extension (e.g. /audit -> audit.html)
        const htmlPath = filePath + '.html';
        fs.access(htmlPath, fs.constants.F_OK, (err2) => {
          if (!err2) {
            serveFile(htmlPath, res);
          } else {
            res.writeHead(404);
            res.end('Not found');
          }
        });
      }
    });
  }
}).listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
