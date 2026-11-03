const express = require('express');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Uploads फोल्डर बनाना (अगर न हो)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Multer Storage Setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Static Files & Uploads Access
app.use(express.static('public'));
app.use('/uploads', express.static(uploadDir));

// Customer Upload Page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bansal Internet Point - Direct Print</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-max-w-md text-center border-t-4 border-blue-600">
                <h1 class="text-2xl font-bold text-gray-800">Bansal Internet Point</h1>
                <p class="text-sm text-gray-500 mb-6">डायरेक्ट प्रिंट पोर्टल - फाइल अपलोड करें</p>

                <form action="/upload" method="POST" enctype="multipart/form-data" class="space-y-4">
                    <input type="file" name="document" required class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-lg p-2"/>
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">फाइल भेजें 🚀</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Handle Upload Action
app.post('/upload', upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.send("कोई फाइल सेलेक्ट नहीं की गई!");
    }
    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>सफल!</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-100 flex items-center justify-center min-h-screen p-4">
            <div class="bg-white p-6 rounded-2xl shadow-xl text-center">
                <h2 class="text-2xl font-bold text-green-600 mb-2">फाइल सफलतापूर्वक भेजी गई! ✅</h2>
                <p class="text-gray-600 mb-4">दुकानदार के पास आपकी फाइल पहुँच गई है।</p>
                <a href="/" class="text-blue-600 font-semibold underline">दूसरी फाइल भेजें</a>
            </div>
        </body>
        </html>
    `);
});

// Admin Panel Route (/admin)
app.get('/admin', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) {
            return res.status(500).send("फाइलें पढ़ने में समस्या आई!");
        }

        let fileListHtml = files.map(file => `
            <div class="flex items-center justify-between p-3 bg-gray-50 border rounded-lg mb-2">
                <span class="text-sm font-medium text-gray-700 truncate max-w-[200px]">${file}</span>
                <div class="space-x-2">
                    <a href="/uploads/${file}" target="_blank" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">देखें / प्रिंट 🖨️</a>
                    <a href="/delete/${file}" class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">हटाएं ❌</a>
                </div>
            </div>
        `).join('');

        if (files.length === 0) {
            fileListHtml = `<p class="text-center text-gray-400 py-6">अभी तक कोई फाइल अपलोड नहीं हुई है!</p>`;
        }

        res.send(`
            <!DOCTYPE html>
            <html lang="hi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Admin Dashboard - Bansal Internet Point</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-slate-100 p-4">
                <div class="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-xl">
                    <div class="flex justify-between items-center mb-6">
                        <h1 class="text-xl font-bold text-gray-800">Bansal Admin Panel 🖨️</h1>
                        <button onclick="location.reload()" class="px-3 py-1 bg-blue-100 text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-200">रिफ्रेश 🔄</button>
                    </div>
                    <div class="space-y-2">
                        ${fileListHtml}
                    </div>
                </div>
            </body>
            </html>
        `);
    });
});

// Delete File Action
app.get('/delete/:filename', (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    fs.unlink(filePath, (err) => {
        res.redirect('/admin');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});