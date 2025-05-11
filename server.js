const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Buat folder uploads jika belum ada
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer config
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route download
app.get('/download', (req, res) => {
  const { url, format } = req.query;
  if (!url) return res.status(400).send('URL is required');

  const ext = format === 'mp3' ? 'mp3' : 'mp4';
  const filename = `${Date.now()}.${ext}`;
  const outputFilePath = path.join(uploadsDir, filename);

  const command = format === 'mp3'
    ? `yt-dlp -x --audio-format mp3 -o "${outputFilePath}" "${url}"`
    : `yt-dlp -f best -o "${outputFilePath}" "${url}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) return res.status(500).send(`Download error: ${stderr}`);

    // Langsung trigger download di browser
    res.download(outputFilePath, filename, (err) => {
      if (err && !res.headersSent) {
        res.status(500).send('Gagal mengunduh file');
      }

      // Hapus file setelah selesai diunduh
      fs.unlink(outputFilePath, () => {});
    });
  });
});

// Route upload (opsional)
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `${req.protocol}://${req.headers.host}/uploads/${req.file.filename}`;
  res.json({ url: imageUrl });
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
app.post('/upload', upload.single('image'), (req, res) => {
  const imageUrl = `${req.protocol}://${req.headers.host}/uploads/${req.file.filename}`;
  res.render('index', { imageUrl });
});
