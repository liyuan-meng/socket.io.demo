const process = require('child_process');
const express = require('express');
const http = require('http');
const io = require('socket.io');
const os = require('node-os-utils');
const config = require('./config');

// 创建 http 服务器
const app = express();

// 创建 websocket 服务器
const server = http.createServer(app);
const socketServer = io(server, {
    path: '/ws'
});

socketServer.on('connection', (socket) => {
    console.log('Has Client connected');

    socket.on('client_message', (data) => {
        process.exec(data, (err, stdout) => {
            socket.emit('server_message', stdout)
        })
    });

    const timer = setInterval(() => {
        os.cpu.usage().then((percent) => {
            const time = Date.now();
            socket.emit('CPU_STATUS', JSON.stringify({
                percent,
                time
            }))
        })
    }, 500);

    socket.ondisconnect = () => {
        clearInterval(timer);
    }
});

// 通过内建的静态资源中间件，配置 http 服务的静态资源文件夹
app.use(express.static('./public', {
    index: 'index.html'
}));

// 启动服务, 这里必须是包装过的
server.listen(config.port, config.host, (err) => {
    if (err) {
        console.error(err)
    } else {
        console.log('Server start at ' + config.port);
    }
});
