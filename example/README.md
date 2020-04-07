
# Example use of Gather Round

This folder contains a small example application of the Gather Round tools that
sit in the main folder.  The application functions as follows:

 * The owner of the application runs it on a server by calling
   `node server.js` on the [server.js](server.js) file in this folder.
 * Users connect to it through their browser at `http://address.goes.here/` and
   are immediately dropped into the lobby, which is a simple chat room.  Users
   are given a random ID (an ugly hash) upon arrival and it cannot be changed.
 * The model is the simple [Map Model](../map-model.js) in this repo.  In it, we
   store just one thing, with key "chats" we store an array of strings, the
   users' chats, in order.
 * When users type a chat and press Send, the message is transmitted to the
   server, which appends it to the end of the list of chats in the model, which
   then automatically syncs back to each [client](client.js), who responds to
   the change by updating their display of the chat list.
 * Users can move out of the lobby to one of two other rooms (a "new users" room
   and an "old users" room), each of which is a chat room just like the lobby,
   but exist just to show how the platform supports multiple disjoint rooms.

The [user interface](index.html) for this is extremely minimal, with no styling,
just for simplicity.
