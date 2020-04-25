// Make connection
var socket = io.connect('http://localhost:3000');

// Query DOM
var messages = document.getElementById('messages'),
      handle = document.getElementById('handle'),
      button = document.getElementById('send'),
      output = document.getElementById('output'),
      feedback = document.getElementById('feedback');

// Emit events
button.addEventListener('click', function(){
    socket.emit('chat', {
        message: messages.value,
        handle: handle.value
    });
    messages.value = "";
});

messages.addEventListener('keypress', function(){
    socket.emit('typing', handle.value);
})

// Listen for events
io.on('chat', function(data){
    feedback.innerHTML = '';
    output.innerHTML += '<p><strong>' + data.handle + ': </strong>' + data.messages + '</p>';
});

io.on('typing', function(data){
    feedback.innerHTML = '<p><em>' + data + ' is typing a message...</em></p>';
});
