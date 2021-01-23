var dgram = require('dgram'),
    stun = require('../lib');

var peer = [];

// STUN Server (by Google)
var port = 19302;
var host = 'stun.l.google.com';

// Event Handler
var onRequest = function () {
    console.log('Sending STUN packet');
};

var onError = function () {
    console.log('Error:', err);
};

// Create STUN Client
var client1 = stun.connect(port, host);
client1.on('error', onError);

var client2 = stun.connect(port, host);
client2.on('error', onError);

// Client1: STUN Response event handler
client1.on('response', function (packet) {
    console.log('Received 1 STUN packet:', packet);

    // Save NAT Address
    peer.push(packet_to(packet));

    // Sending STUN Packet
    client2.request(onRequest);
});

// Client2: STUN Response event handler
client2.on('response', function (packet) {
    console.log('Received 2 STUN packet:', packet);

    // Save NAT Address
    peer.push(packet_to(packet));

    // Sending UDP message
    var msg1 = new Buffer.from("Msg 1");
    var msg2 = new Buffer.from("Msg 2");

    for (var i = 0; i < 5; i++) {
        client1.send(msg1, 0, msg1.length, peer[1].port, peer[1].address);
        client2.send(msg2, 0, msg2.length, peer[0].port, peer[0].address);
    }

    // Client close after 2sec
    setTimeout(function () {
        client1.close();
        client2.close();
        console.log('done');
    }, 2000);
});

// Client1: UDP Message event handler
client1.on('message', function (msg, rinfo) {
    //console.log('Client 1 Received UDP rinfo:', rinfo);
    console.log('Client 1 Received UDP message:', msg.toString());
});

// Client2: UDP Message event handler
client2.on('message', function (msg, rinfo) {
    //console.log('Client 2 Received UDP rinfo:', rinfo);
    console.log('Client 2 Received UDP message:', msg.toString());
});

// Sending STUN request
client1.request(onRequest);

function packet_to(packet) {
    var p;
    if (packet.attrs[stun.attribute.XOR_MAPPED_ADDRESS]) {
        p = packet.attrs[stun.attribute.XOR_MAPPED_ADDRESS];

    } else {
        p = packet.attrs[stun.attribute.MAPPED_ADDRESS];
    }
    console.log(' > Global IP:Port:', p.address, p.port);
    return p;
}

