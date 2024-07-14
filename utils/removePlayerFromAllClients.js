const despawnPlayer = require("./despawnPlayer");

module.exports = function removePlayerFromAllClients(server, leavingPlayer) {
    Object.values(server.clients).forEach(client => {
        if (client.id !== leavingPlayer.id) {
            despawnPlayer(client, leavingPlayer);
        }
    });
}