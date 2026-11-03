const express = require('express');
const multer  = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// फाइलों को डिस्क पर सेव नहीं करेंगे, सीधे मेमोरी (RAM) में रखेंगे ताकि कभी कचरा न जमे!
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// अस्थायी रूप से फाइलों को याद रखने के लिए एरे (Array) - जो सर्वर रीस्टार्ट होते ही खाली हो जाता है
let uploadedFiles = [];

// 1. ग्राहक के लिए अपलोड पेज (Customer Upload Page)
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
            <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md text-center border-t-4 border-blue-600">
                <h1 class="text-2xl font-bold text-gray-800">Bansal Internet Point</h1>
                <p class="text-sm text-gray-500 mb-6">दुकान पर प्रिंट के लिए फाइल भेजें</p>

                <form action="/upload" method="POST" enctype="multipart/form-data" class="space-y-4">
                    <input type="file" name="document" required class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border rounded-lg p-2"/>
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">फाइल भेजें 🚀</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// 2. जब ग्राहक फाइल अपलोड करेगा
app.post('/upload', upload.single('document'), (req, res) => {
    if (!req.file) {
        return res.send("कोई फाइल सेलेक्ट नहीं की गई!");
    }

    const fileId = Date.now();
    const fileObj = {
        id: fileId,
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        time: new Date().toLocaleTimeString('en-IN')
    };

    uploadedFiles.push(fileObj);

    // सुरक्षा के लिए: 5 मिनट (300000 मिलीसेकंड) बाद फाइल अपने आप मेमोरी से डिलीट हो जाएगी!
    setTimeout(() => {
        uploadedFiles = uploadedFiles.filter(f => f.id !== fileId);
    }, 5 * 60 * 1000);

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
                <p class="text-gray-600 mb-4">दुकानदार के पास फाइल पहुँच गई है। आप जा सकते हैं।</p>
                <a href="/" class="text-blue-600 font-semibold underline">दूसरी फाइल भेजें</a>
            </div>
        </body>
        </html>
    `);
});

// 3. दुकानदार का एडमिन पैनल (/admin)
app.get('/admin', (req, res) => {
    let fileListHtml = uploadedFiles.map(file => `
        <div class="flex items-center justify-between p-3 bg-gray-50 border rounded-lg mb-2 shadow-sm">
            <div>
                <p class="text-sm font-bold text-gray-800">${file.originalname}</p>
                <span class="text-xs text-gray-500">आया समय: ${file.time} (5 मिनट में ऑटो-डिलीट)</span>
            </div>
            <div class="space-x-2">
                <a href="/view/${file.id}" target="_blank" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-semibold">देखें / प्रिंट 🖨️</a>
                <a href="/delete/${file.id}" class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 font-semibold">हटाएं ❌</a>
            </div>
        </div>
    `).join('');

    if (uploadedFiles.length === 0) {
        fileListHtml = `<p class="text-center text-gray-400 py-6">अभी कोई नई फाइल नहीं है!</p>`;
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
                <div class="flex justify-between items-center mb-6 border-b pb-4">
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

// 4. फाइल देखने और प्रिंट करने का रास्ता
app.get('/view/:id', (req, res) => {
    const file = uploadedFiles.find(f => f.id == req.params.id);
    if (!file) return res.status(404).send("फाइल नहीं मिली या डिलीट हो चुकी है!");
    
    res.setHeader('Content-Type', file.mimetype);
    res.send(file.buffer);
});

// 5. मैन्युअल रूप से तुरंत डिलीट करने का रास्ता
app.get('/delete/:id', (req, res) => {
    uploadedFiles = uploadedFiles.filter(f => f.id != req.params.id);
    res.redirect('/admin');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
