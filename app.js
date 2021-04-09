const path = require('path');
const express = require('express');
const socket = require('socket.io');
const PORT = process.env.PORT || 3080;
var channels = {}; // collect channels
var sockets = {}; // collect sockets
var peers = {}; // collect peers id:name in channel
const app = express();
const server = app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
const io = socket(server, { serveClient: true });
var turnEnabled = 'true';
var turnUrls = 'turn:numb.viagenie.ca';
var turnUsername = 'azeemhaider0322@gmail.com';
var turnCredential = 'azeem0322..';
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//Global middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.get(['/', '/:room'], (req, res) => res.render('main'));

var iceServers = [{ urls: 'stun:stun.l.google.com:19302' }];

if (turnEnabled == 'true') {
	iceServers.push({
		urls: turnUrls,
		username: turnUsername,
		credential: turnCredential,
	});
}

io.on('connect', (socket) => {
	console.log('[' + socket.id + '] --> connection accepted');
	socket.channels = {};
	sockets[socket.id] = socket;
	/**
	 * On peer diconnected
	 */
	socket.on('disconnect', () => {
		for (var channel in socket.channels) {
			removePeerFrom(channel);
		}
		console.log('[' + socket.id + '] <--> disconnected');
		delete sockets[socket.id];
	});

	/**
	 * On peer join
	 */
	socket.on('join', (config) => {
		console.log('[' + socket.id + '] --> join ', config);

		var channel = config.channel;
		var peer_name = config.peerName;

		if (channel in socket.channels) {
			console.log('[' + socket.id + '] [Warning] already joined', channel);
			return;
		}

		if (!(channel in channels)) {
			channels[channel] = {};
			peers[channel] = {};
		}

		// collect peers id:name group by channel
		peers[channel][socket.id] = peer_name;
		console.log('connected peers', peers);

		for (var id in channels[channel]) {
			// offer false
			channels[channel][id].emit('addPeer', {
				peer_id: socket.id,
				peers: peers[channel],
				should_create_offer: false,
				iceServers: iceServers,
			});
			// offer true
			socket.emit('addPeer', {
				peer_id: id,
				peers: peers[channel],
				should_create_offer: true,
				iceServers: iceServers,
			});
			console.log('[' + socket.id + '] emit add Peer [' + id + ']');
		}

		channels[channel][socket.id] = socket;
		socket.channels[channel] = channel;
	});

	/**
	 * Remove peers
	 * @param {*} channel
	 */
	async function removePeerFrom(channel) {
		if (!(channel in socket.channels)) {
			console.log('[' + socket.id + '] [Warning] not in ', channel);
			return;
		}

		delete socket.channels[channel];
		delete channels[channel][socket.id];
		delete peers[channel][socket.id];

		// console.log("connected peers", peers);

		for (var id in channels[channel]) {
			await channels[channel][id].emit('removePeer', { peer_id: socket.id });
			await socket.emit('removePeer', { peer_id: id });
			console.log('[' + socket.id + '] emit remove Peer [' + id + ']');
		}
    }
	socket.on('relayICE', (config) => {
		let peer_id = config.peer_id;
		let ice_candidate = config.ice_candidate;
		if (peer_id in sockets) {
			sockets[peer_id].emit('iceCandidate', {
				peer_id: socket.id,
				ice_candidate: ice_candidate,
			});
		}
	});
	socket.on('relaySDP', (config) => {
		let peer_id = config.peer_id;
		let session_description = config.session_description;

		console.log('[' + socket.id + '] relay SessionDescription to [' + peer_id + '] ', { type: session_description.type }); // session_description

		if (peer_id in sockets) {
			sockets[peer_id].emit('sessionDescription', {
				peer_id: socket.id,
				session_description: session_description,
			});
		}
	});
	socket.on('msg', (config) => {
		let peerConnections = config.peerConnections;
		let name = config.name;
		let msg = config.msg;

		console.log('[' + socket.id + '] emit onMessage', {
			name: name,
			msg: msg,
		});

		for (var peer_id in peerConnections) {
			sockets[peer_id].emit('onMessage', {
				name: name,
				msg: msg,
			});
		}
	});
});
