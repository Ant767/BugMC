module.exports = function despawnPlayer(client, target) {
    client.write('entity_destroy', {
        entityIds: [target.id]
    });
}