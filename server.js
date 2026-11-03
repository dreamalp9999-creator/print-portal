const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// अपलोड फोल्डर चेक करें
const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// फाइल स्टोरेज सेटिंग्स
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

// इन-मेमोरी डेटाबेस (फाइलों की लिस्ट रखने के लिए)
let printJobs = [];

// 1. कस्टमर अपलोड पेज (Mobile View)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bansal Internet Point - Print Portal</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-100 min-h-screen flex items-center justify-center p-4">
            <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md text-center border border-slate-200">
                <div class="mb-4">
                    <h2 class="text-xs uppercase tracking-widest text-blue-600 font-bold">Bansal Internet Point</h2>
                    <h1 class="text-2xl font-extrabold text-slate-800 mt-1">Direct Print Portal</h1>
                    <p class="text-slate-500 text-xs mt-1">अपनी फोटो या डॉक्यूमेंट यहाँ चुनें</p>
                </div>
                
                <form action="/upload" method="POST" enctype="multipart/form-data" class="space-y-4">
                    <div class="border-2 border-dashed border-blue-300 rounded-2xl p-6 bg-blue-50/45 hover:bg-blue-50 transition cursor-pointer relative">
                        <input type="file" name="doc_file" accept="image/*,.pdf,.doc,.docx" required class="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onchange="showFileName(this)">
                        <div class="flex flex-col items-center pointer-events-none">
                            <svg class="w-12 h-12 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            <span id="fileLabel" class="text-sm font-semibold text-slate-700">क्लिक करके फोटो या PDF चुनें</span>
                        </div>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition duration-200">🖨️ प्रिंट के लिए भेजें</button>
                </form>
            </div>
            <script>
                function showFileName(input) {
                    if(input.files.length > 0) {
                        document.getElementById('fileLabel').innerText = "चुनी गई फाइल: " + input.files[0].name;
                    }
                }
            </script>
        </body>
        </html>
    `);
});

// 2. फाइल अपलोड हैंडलर
app.post('/upload', upload.single('doc_file'), (req, res) => {
    if (req.file) {
        printJobs.unshift({
            id: Date.now(),
            fileName: req.file.filename,
            originalName: req.file.originalname,
            time: new Date().toLocaleTimeString()
        });
    }
    res.send(`<script>alert('फाइल सफलतापूर्वक भेज दी गई है!'); window.location.href='/';</script>`);
});

// 3. एडमिन डैशबोर्ड (Admin View)
app.get('/admin', (req, res) => {
    let rows = printJobs.map(job => `
        <tr class='hover:bg-slate-700/30 transition'>
            <td class='p-4 font-mono text-slate-400'>#${job.id}</td>
            <td class='p-4 font-medium text-white'>${job.originalName}</td>
            <td class='p-4 text-slate-400'>${job.time}</td>
            <td class='p-4 text-center'>
                <a href='/uploads/${job.fileName}' target='_blank' class='text-xs bg-slate-700 text-blue-300 px-2 py-1 rounded'>देखें / प्रीव्यू</a>
            </td>
            <td class='p-4 text-right space-x-1'>
                <a href='/uploads/${job.fileName}' target='_blank' onclick="setTimeout(() => { window.location.href='/delete/${job.id}'; }, 1000);" class='bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-2 rounded-lg inline-block shadow'>🖨️ Print</a>
                <a href='/uploads/${job.fileName}' download='${job.originalName}' class='bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-lg inline-block shadow'>💾 Save</a>
                <a href='/delete/${job.id}' class='bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-lg inline-block shadow'>❌ Reject</a>
            </td>
        </tr>
    `).join('') || `<tr><td colspan='5' class='p-8 text-center text-slate-500'>कोई नई फाइल नहीं है।</td></tr>`;

    res.send(`
        <!DOCTYPE html>
        <html lang="hi">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="5">
            <title>Admin Dashboard - Bansal Internet Point</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-900 text-white min-h-screen p-6">
            <div class="max-w-6xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-blue-400">Bansal Internet Point - Node.js Portal</h1>
                    <span class="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">Auto Refresh (5s)</span>
                </div>
                <div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-700/50 text-slate-300 text-sm">
                                <th class="p-4">ID</th>
                                <th class="p-4">फाइल का नाम</th>
                                <th class="p-4">समय</th>
                                <th class="p-4 text-center">प्रीव्यू</th>
                                <th class="p-4 text-right">एक्शन</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700 text-sm">
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 4. डिलीट / रिजेक्ट करने का रूट
app.get('/delete/:id', (req, res) => {
    const jobId = Number(req.params.id);
    const index = printJobs.findIndex(j => j.id === jobId);
    if (index !== -1) {
        const filePath = path.join(uploadDir, printJobs[index].fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        printJobs.splice(index, 1);
    }
    res.redirect('/admin');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 सर्वर चालू है! लिंक खोलें: http://localhost:${PORT}`);
});