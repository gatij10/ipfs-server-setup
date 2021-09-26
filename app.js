const express = require('express')
const app = express()
const http = require('http')

const fs = require('fs');

var multer = require('multer')
var upload = multer({ dest: 'uploads/' })

var ipfsAPI = require('ipfs-api')
var ipfs = ipfsAPI('ipfs.infura.io', '5001', { protocol: 'https' })

var download = function (url, dest) {
    var file = fs.createWriteStream(dest);
    http.get(url, function (response) {
        response.pipe(file);
        file.on('finish', function () {
            file.close();  // close() is async, call cb after close completes.
        });
    }).on('error', function (err) { // Handle errors
        fs.unlink(dest); // Delete the file async. (But we don't check the result)
        console.log(err);
    });
};

app.post('/upload', upload.single('avatar'), function (req, res, next) {
    var data = fs.readFileSync(req.file.path);
    try {
        ipfs.add(data, function (err, file) {
            if (err) {
                console.log(err);
            }
            console.log(file);
            res.send(file[0].hash);
        })

    } catch (err) {
        console.log(err);
        res.status(500).send('Server Error');
    }

})

app.get('/download/:ID', function (req, res) {
    const url = `http://ipfs.io/ipfs/${req.params.ID}`
    const dir = 'download_folder'
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    const dest = `${dir}/${req.params.ID}.pdf`;
    download(url, dest);
    res.redirect(url);
})

app.listen(3000);