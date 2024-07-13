module.exports = function broadcastPositionUpdates(server, client) {
    const updateInterval = setInterval(() => {

        const position = client.position;
        server.writeToClients(Object.values(server.clients).filter(c => c !== client), 'entity_teleport', {
            entityId: client.id,
            x: position.x,
            y: position.y,
            z: position.z,
            yaw: client.yaw || 0,
            pitch: client.pitch || 0,
            onGround: true
        });
    }, 50); // Update every 50ms
}