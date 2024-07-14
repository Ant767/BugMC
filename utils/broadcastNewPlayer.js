const spawnPlayer = require("./spawnPlayer");

module.exports = function broadcastNewPlayer(server, newPlayer) {
    Object.values(server.clients).forEach(client => {
        if (client.id !== newPlayer.id) {
            spawnPlayer(client, newPlayer);
            spawnPlayer(newPlayer, client);
        }
    });
}