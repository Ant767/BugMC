const Chunk = require('prismarine-chunk')('1.16');
const World = require('prismarine-world')('1.16');
const Anvil = require('prismarine-provider-anvil').Anvil('1.16')
const registry = require('prismarine-registry')('1.16'); // Adjust version accordingly
const Block = require('prismarine-block')(registry); // Adjust version accordingly

const Vec3 = require('vec3');
const overworldGen = require('./generation/overworldGen');

class ChunkManager {
    constructor() {
        this.world = new World(overworldGen, new Anvil('regions'));
        this.world.on('blockUpdate', async (oldBlock, newBlock) => {
            if(oldBlock.material == "dirt" && newBlock.stateId == 0) {
                let block = await this.world.getBlock(new Vec3(oldBlock.position.x, oldBlock.position.y + 1, oldBlock.position.z))
                if(block.material == "plant" && block.type < 59 && block.type > 64) {
                    await this.world.setBlockStateId(block.position, 0)
                }
            }
            if((oldBlock.type == 161 || (oldBlock.type >= 485 && oldBlock.type <= 489)) && newBlock.stateId == 0) {
                let block1 = await this.world.getBlock(new Vec3(oldBlock.position.x, oldBlock.position.y - 1, oldBlock.position.z))
                let block2 = await this.world.getBlock(new Vec3(oldBlock.position.x, oldBlock.position.y + 1, oldBlock.position.z))
                if(block1.type == 161 || (block1.type >= 485 && block1.type <= 489)) {
                    await this.world.setBlockStateId(block1.position, 0)
                }
                if(block2.type == 161 || (block2.type >= 485 && block2.type <= 489)) {
                    await this.world.setBlockStateId(block2.position, 0)
                }
            }
            if(oldBlock.stateId == 0 && newBlock.material == "plant") {
                let block = await this.world.getBlock(new Vec3(oldBlock.position.x, oldBlock.position.y - 1, oldBlock.position.z))
                console.log(block.material)
                if(block.material == "plant" && block.type < 59 && block.type > 64) {
                    await this.world.setBlockStateId(newBlock.position, 0)
                }
            }
        })
    }
}
module.exports = new ChunkManager();