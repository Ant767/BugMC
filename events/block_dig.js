const chunkManager = require('../chunkManager');

const registry = require('prismarine-registry')('1.16'); // Adjust version accordingly
const Block = require('prismarine-block')(registry); // Adjust version accordingly
const Vec3 = require('vec3');
module.exports = async function(server, packet) {
    try {
        let chunkLoc = {
            x: Math.floor(packet.location.x / 16),
            z: Math.floor(packet.location.z / 16),
        }

        await chunkManager.world.setBlock(new Vec3(packet.location.x, packet.location.y, packet.location.z), packet.location.y < 53 ? Block.fromString('minecraft:water') : Block.fromString('minecraft:air'))

        let chunk = {
            x: chunkLoc.x,
            z: chunkLoc.z,
            chunk: await chunkManager.world.getColumn(chunkLoc.x, chunkLoc.z)
        }

        server.writeToClients(Object.values(server.clients), 'map_chunk', {
            x: chunk.x,
            z: chunk.z,
            groundUp: true,
            biomes: chunk.chunk.dumpBiomes !== undefined ? chunk.chunk.dumpBiomes() : undefined,
            heightmaps: {
                type: 'compound',
                name: '',
                value: {} // Client will accept fake heightmap
            },
            bitMap: chunk.chunk.getMask(),
            chunkData: chunk.chunk.dump(),
            blockEntities: []
        });
    
    } catch(e) {
        console.error(e)
     }
}