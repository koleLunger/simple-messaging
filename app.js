var express = require('express');
app = express();
var sqlite3 = require('sqlite3');
var session = require('express-session');
var bodyParser = require('body-parser');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var url = require('url');
var db = new sqlite3.Database('db/database.db');
var cookieParser = require('socket.io-cookie-parser');

app.use(express.static(__dirname + '/site'));

// login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/site/index.html');
});

app.get('/chat', (req, res) => {
    res.sendFile(__dirname + '/site/chat.html');
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/site/register.html');
});

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

app.use(bodyParser.urlencoded({
	extended: true
}));

// runs when a user tries to login
app.post('/auth', function (req, res) {
	let username = req.body.username;
	let password = req.body.password;

	if (username && password) {
		db.get('SELECT * FROM accounts WHERE username = \'' + username + '\' AND password = \'' + password + '\';', function (err, results) {
			if (err)
				console.log(err);
			if (results) {
				successfulLogin(username);
				db.get('SELECT * FROM accounts WHERE username = \'' + username + '\' ;', function (err, results) {
                    res.cookie('key', results.key)
					res.redirect(url.format({
						pathname: "/chat",

					}));
					res.end();
				});

			} else {
				res.send('Incorrect Username and/or Password!');
				res.end();
			}

		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

// runs when a user tries to login
app.post('/reg', function (req, res) {
	let username = req.body.username;
	let password = req.body.password;
	let key = generateKey()
	let expiration = Math.round((new Date()).getTime() / 1000) + 2592000

	if (username && password) {
		db.get('SELECT * FROM accounts WHERE username = \'' + username + '\' ;', function (err, results) {
		if (!results){
		db.run('INSERT INTO accounts(username, password, email, key, expire) VALUES(?, ?, ?, ?, ?)', [username, password, "placeholder", key, expiration], function(err){
			console.log("done")
			res.cookie('key', key)
					res.redirect(url.format({
						pathname: "/chat",

					}));
					res.end();
		  });
		}else{
			res.send('Username Taken!');
			res.end();
		}
		})
	
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

io.use(cookieParser());

io.on('connection', (socket) => {
    
    //Handle chat event
    io.on('chat', function(data){
      io.sockets.emit('chat', data);
    });

    //Handle typing event
    io.on('typing', function(data){
      socket.broadcast.emit('typing', data);
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        
        console.log('message: ' + msg);
    });
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        
        db.get('SELECT * FROM accounts WHERE key = \'' + socket.request.cookies['key'] + '\' ;', function (err, results) {
        data = {message: msg,
                username: results.username}
        io.emit('chat message', data);
        })
    });
});

function checkExpiration(key, callback) {
	db.get('SELECT * FROM accounts WHERE key = \'' + key + '\' ;', function (err, results) {

		if (results.expire <= Math.round((new Date()).getTime() / 1000)) {
			return callback(true);
		} else {
			return callback(false);
		}
	});
}

// Generates a random string to be used as a key
function generateKey() {
	let result = '';
	let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let charactersLength = characters.length;
	for (let i = 0; i < 32; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}

// Sets the randomly generated key to the users key in the db
function setUserKey(username) {

	db.run('UPDATE accounts SET key = ? WHERE username = ?', [generateKey(), username], function (err) {
		if (err) {
			return console.error(err.message);
		}
	});
}

// Sets the key expiration for the user to one month in the future in the database
function setKeyExpiration(username) {

	let expiration = Math.round((new Date()).getTime() / 1000) + 2592000;

	db.run('UPDATE accounts SET expire = ? WHERE username = ?', [expiration, username], function (err) {
		if (err) {
			return console.error(err.message);
		}
	});
}

// runs when a user successfully logs in
function successfulLogin(username) {
	setUserKey(username);
	setKeyExpiration(username);
}


http.listen(3000, () => {
    console.log('listening on *:3000');
});