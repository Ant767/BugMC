module.exports = function addPlayerToTabList(server, client) {
    server.writeToClients(Object.values(server.clients), 'player_info', {
        action: 0, // 0 = add player
        data: [{
            UUID: client.uuid,
            name: client.username,
            properties: [],
            gamemode: 1,
            ping: 0,
            displayName: JSON.stringify({ text: client.username }),
            listed: true
        }]
    });
}