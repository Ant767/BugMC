const chunkManager = require("./chunkManager");

class ChunkGen {
    async getChunksNearLoc({x,y,z}) {
        let chunkX = Math.floor(x / 16);
        let chunkZ = Math.floor(z / 16);
        let chunkCoords = [];
        for(let x = 0;x < 16;x++) {
            for(let z = 0;z < 16;z++) {
                chunkCoords.push({x:chunkX - (x - 7),z:chunkZ - (z - 7)});
            }
        }
        let chunks = [];
        for(const coord of chunkCoords) {
            chunks.push({x:coord.x,z:coord.z,chunk: await chunkManager.world.getColumn(coord.x, coord.z)})
        }
        return chunks;
    }
    //chunkManager.world.getColumn()
}
module.exports = new ChunkGen();