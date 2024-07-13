const Chunk = require('prismarine-chunk')('1.16');
const World = require('prismarine-world')('1.16');
const Anvil = require('prismarine-provider-anvil').Anvil('1.16')
const registry = require('prismarine-registry')('1.16'); // Adjust version accordingly
const Block = require('prismarine-block')(registry); // Adjust version accordingly

const Vec3 = require('vec3');
const Perlin = require('perlin.js');
Perlin.seed(4643);
function generateSimpleChunk(chunkX, chunkZ) {
    const chunk = new Chunk({
        worldHeight: 256
    })
    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            let treeNoise = Math.abs(Perlin.simplex2((x + (chunkX * 16)), (z + (chunkZ * 16)))) * 256
            let value = Math.floor(Math.abs(Perlin.perlin2((x + (chunkX * 16)) / 100, (z + (chunkZ * 16)) / 100)) * 256);
            let threshold = 40;
            let newY = value > threshold ? Math.floor((value / 512) * 25) + 50 : 50
            chunk.setBlockType(new Vec3(x, newY, z), value <= threshold ? 26 : 8)
            if(value <= threshold) {
                chunk.setBlockType(new Vec3(x, newY + 1, z), value <= threshold ? 26 : 8)
                chunk.setBlockType(new Vec3(x, newY + 2, z), value <= threshold ? 26 : 8)
            }
            if(value > threshold) {
                chunk.setBlockData(new Vec3(x, newY, z), 1)
                if(treeNoise > 50) {
                    chunk.setBlockType(new Vec3(x, newY + 1, z), 95)
                }
                if(treeNoise > 200) {
                    chunk.setBlockType(new Vec3(x, newY + 1, z), 120)
                }
                if(treeNoise > 180 && treeNoise < 200) {
                    chunk.setBlockType(new Vec3(x, newY + 1, z), 119)
                }
                if(treeNoise > 229) {
                    
                    let coords = [
                        new Vec3(x, newY + 6, z),
                        new Vec3(x, newY + 7, z),
                        new Vec3(x, newY + 6, z-1),
                        new Vec3(x, newY + 6, z+1),
                        new Vec3(x-1, newY + 6, z),
                        new Vec3(x+1, newY + 6, z),
                        new Vec3(x+1, newY + 3, z),
                        new Vec3(x-1, newY + 3, z),
                        new Vec3(x, newY + 3, z+1),
                        new Vec3(x, newY + 3, z-1),
                        new Vec3(x-1, newY + 3, z-1),
                        new Vec3(x-1, newY + 3, z+1),
                        new Vec3(x+1, newY + 3, z-1),
                        new Vec3(x+1, newY + 3, z+1),
                    ]
                    if(!coords.some(_=>{
                        return _.x < 0 || _.z < 0 || _.x > 14 || _.z > 14
                    })) {
                        for(let i = 0;i < 5;i++) {
                            chunk.setBlockType(new Vec3(x, newY + i + 1, z), 35)
                            chunk.setBlockData(new Vec3(x, newY + i + 1, z), 1)
                        }
                        for(let x2 = -2;x2 < 3;x2++) {
                            for(let y2 = -2;y2 < 3;y2++) {
                                if((x2 == y2 || x2 == -y2 || -x2 == y2 || -x2 == -y2) && (x2 == 2 || x2 == -2)) continue;
                                coords.push(new Vec3(x - x2, newY + 5, z - y2))
                                coords.push(new Vec3(x - x2, newY + 4, z - y2))
                            }
                        }
                        for(const coord of coords) {
                            chunk.setBlockType(coord, 59)
                        }
    
                    }
                }
                if(newY > 50) {
                    for(let i = 50; i < newY;i++) {
                        chunk.setBlockType(new Vec3(x, i, z), 9)
                    }
                }
            }
            for (let y = 0; y < 256; y++) {
                if(y < 50) {
                    // let val = Math.abs(Perlin.perlin3(Math.abs(x + (chunkX * 16) / 137.5), Math.abs(y), Math.abs(z + (chunkZ * 16) / 137.5))) * 256;
                    // if(val > 10) {
                        chunk.setBlockType(new Vec3(x, y, z), 1)
    
                    // } else {
                    //     let choices = [2,4,6];
                    //     chunk.setBlockType(new Vec3(x, y, z), choices[Math.floor(Math.random() * choices.length)]);
                    // }
    
                }

                chunk.setSkyLight(new Vec3(x, y, z), 15)
            }
        }
    }

    return chunk
}
class ChunkManager {
    constructor() {
        this.world = new World(generateSimpleChunk, new Anvil('regions'));
        this.world.on('blockUpdate', async (oldBlock, newBlock) => {
            if(oldBlock.material == "dirt" && newBlock.stateId == 0) {
                let block = await this.world.getBlock(new Vec3(oldBlock.position.x, oldBlock.position.y + 1, oldBlock.position.z))
                if(block.material == "plant") {
                    await this.world.setBlockStateId(block.position, 0)
                }
            }
            if(oldBlock.stateId == 0 && newBlock.material == "plant") {
                let block = await this.world.getBlock(new Vec3(oldBlock.position.x, oldBlock.position.y - 1, oldBlock.position.z))
                if(block.transparent || block.material == "plant") {
                    await this.world.setBlockStateId(newBlock.position, 0)
                }
            }
        })
    }
}
module.exports = new ChunkManager();