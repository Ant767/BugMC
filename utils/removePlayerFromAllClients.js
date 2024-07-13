module.exports = function removePlayerFromAllClients(server, leavingPlayer) {
    Object.values(server.clients).forEach(client => {
        if (client !== leavingPlayer) {
            despawnPlayer(client, leavingPlayer);
        }
    });
}