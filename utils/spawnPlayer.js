module.exports = function spawnPlayer(client, target) {
    client.write('named_entity_spawn', {
        entityId: target.id,
        playerUUID: target.uuid,
        x: target.position.x,
        y: target.position.y,
        z: target.position.z,
        yaw: target.yaw || 0,
        pitch: target.pitch || 0,
        metadata: []
    });
}