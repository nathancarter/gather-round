
# Gather Round

This toolkit aims to make it easy to create simple online shared experiences,
such as a chat room or a game.  I'm making it basically for my own use.  It
provides:

 * a Node/Express [server](server.js), including classes for creating rooms in
   which to put users and models of the state of the room
 * [client-side JS code](client.js) to establish WebSocket connections to the
   server (which the server automatically puts in each page it serves)
 * a [model](map-model.js) class that can be used on both client side and server
   side, and the client and server know how to keep both copies in sync
 * an [example](example/) usage of it (just a three-room chat site that is
   extremely ugly, in order to be a simple example)
