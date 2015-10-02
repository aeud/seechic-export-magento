var fs = require('fs')
var converter = require('./lib/converter')
var express     = require('express')
var zlib = require('zlib')
var app         = express()
var multipart = require('connect-multiparty')

var multipartMiddleware = multipart()

app.get('/', (req, res, next) => {
    res.sendFile(__dirname + '/index.html')
})

app.post('/exec', multipartMiddleware, (req, res) => {
    try {
        converter.exec(fs.readFileSync(req.files.file.path, 'utf-8'), (err, string) => {
            gz = zlib.gzipSync(string)
            res.setHeader('Content-disposition', 'attachment; filename=magnento-export_' + new Date().toISOString() + '.csv');
            res.setHeader('Content-type', 'text/csv');
            res.setHeader('Content-encoding', 'gzip');
            res.send(gz)
        })
    } catch (e) {
        res.sendStatus(404)
    }
})

var server = app.listen(process.env.PORT || 4000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
})