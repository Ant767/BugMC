const Chunk = require('prismarine-chunk')('1.16');
const Vec3 = require('vec3');
const Perlin = require('perlin.js');

Perlin.seed(69);

module.exports = function generateSimpleChunk(chunkX, chunkZ) {
    const chunk = new Chunk({
        worldHeight: 256
    })
    for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
            let treeNoise = Math.abs(Perlin.simplex2((x + (chunkX * 16)), (z + (chunkZ * 16)))) * 256
            let value = Math.floor(Math.abs(Perlin.perlin2((x + (chunkX * 16)) / 50, (z + (chunkZ * 16)) / 50)) * 256);
            let value3 = (Perlin.perlin2((x + (chunkX * 16)) / 50, (z + (chunkZ * 16)) / 50));
            let value2 = Math.floor(Math.abs(Perlin.perlin2((x + (chunkX * 16)) / 100, (z + (chunkZ * 16)) / 100)) * 512);
            let threshold = 40;
            let newY = value > 125 && value < 170 ? Math.floor((value2 / 256) * 17) + 50 : value > threshold ? Math.floor((value / 256) * 15) + 50 : 50
            chunk.setBlockType(new Vec3(x, newY, z), value <= threshold ? 26 : 8)
            if(value <= threshold) {
                chunk.setBlockType(new Vec3(x, newY + 1, z), value <= threshold ? 26 : 8)
                chunk.setBlockType(new Vec3(x, newY + 2, z), value <= threshold ? 26 : 8)
                if(value == threshold || value == threshold - 1) {
                    chunk.setBlockType(new Vec3(x, newY, z), 9)                    
                    chunk.setBlockType(new Vec3(x, newY+1, z), 9)                    
                }
                if(value == threshold - 2 || value == threshold - 3 || value == threshold - 4) {
                    chunk.setBlockType(new Vec3(x, newY, z), 9)                    
                }
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
                        let off = Perlin.simplex2((x + (chunkX * 16)) / 40, (z + (chunkZ * 16)) / 40);
                        chunk.setBlockType(new Vec3(x, i, z), i >= newY - (3 + Math.floor(off * 3)) ? 9 : 1)
                    }
                }
            }
            for (let y = 0; y < 256; y++) {
                if(y == 1) {
                    chunk.setBlockType(new Vec3(x, y, z), 27)
                }

                if(y < 50) {
                    if(((value <= threshold || value == threshold || value == threshold - 1 || value == threshold - 2 || value == threshold - 3 || value == threshold - 4) && y > 40 - Math.floor(value3 * 5))) {
                        chunk.setBlockType(new Vec3(x, y, z), 1)
                    }
    
                }
                if(y < 50 - Math.floor(value3 * 5)) {
                    let val = Math.abs(Perlin.perlin3((x + (chunkX * 16)) / 137.5, Math.abs(y) / 137.5, (z + (chunkZ * 16))  / 137.5)) * 256;
                    if(val > 10) {
                        chunk.setBlockType(new Vec3(x, y, z), val > 30 && val < 60 ? 6 : 1)
                    } else {
                        chunk.setBlockType(new Vec3(x, y, z), 26)
                    }
    
                }
                if(y == 0) {
                    chunk.setBlockType(new Vec3(x, y, z), 25)

                }

                chunk.setSkyLight(new Vec3(x, y, z), 15)
            }
        }
    }

    return chunk
}
