const app = require('express')();

app.use((req, res, next) => {
    res.set({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "'Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token'",
    });

    next();
});

const fs = require('fs');
const hls = require('hls-server');
const { default: Hls } = require('hls.js');
const { Server } = require("socket.io");
const http = require('http');
const serverSocket = http.createServer(app);
const io = new Server(serverSocket);

const hlsC = require('hls.js');

app.get('/', (req, res) => {
    return res.status(200).sendFile(`${__dirname}/client.html`);
});

// const h = new Hls({startPosition: 30});

const server = app.listen(3000);

new hls(server, {
    provider: {
        exists: (req, cb) => {
            const ext = req.url.split('.').pop();

            if (ext !== 'm3u8' && ext !== 'ts') {
                return cb(null, true);
            }

            fs.access(__dirname + req.url, fs.constants.F_OK, function (err) {
                if (err) {
                    console.log('File not exist');
                    return cb(null, false);
                }
                cb(null, true);
            });
        },
        getManifestStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        },
        getSegmentStream: (req, cb) => {
            const stream = fs.createReadStream(__dirname + req.url);
            cb(null, stream);
        }
    }
});

io.on('connection', socket => {

    console.log('user connected');
    console.log(socket.id);
    
    socket.on('message', message => {
        socket.broadcast.emit("message", message);
        socket.emit('message', message);
    });

    socket.on('timePlayer', time => {
        socket.broadcast.emit('timePlayer', time);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

serverSocket.listen(4444, () => {
    console.log('Listening on port 4444');
});