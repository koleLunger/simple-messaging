var express = require('express');
app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/site'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/site/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');

    //Handle chat event
    io.on('chat', function(data){
      //console.log(data);
      io.sockets.emit('chat', data);
    });

    //Handle typing event
    io.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });
});
