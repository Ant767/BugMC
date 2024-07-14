module.exports = function removePlayerFromTabList(server, client) {
    server.writeToClients(Object.values(server.clients), 'player_info', {
        action: 4, // 4 = remove player
        data: [{
            UUID: client.uuid
        }]
    });
}