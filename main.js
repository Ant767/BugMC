const mc = require('minecraft-protocol');
const nbt = require('prismarine-nbt');
const yaml = require('yaml');
const Chunk = require('prismarine-chunk')('1.16'); // Adjust version accordingly
const World = require('prismarine-world')('1.16'); // Adjust version accordingly
const mcData = require('minecraft-data')('1.16'); // Adjust version accordingly
const registry = require('prismarine-registry')('1.16'); // Adjust version accordingly
const Block = require('prismarine-block')(registry); // Adjust version accordingly
const Vec3 = require('vec3');
const uuid = require('uuid');
const fs = require('fs');
const chunkManager = require('./chunkManager');
const spawnPlayer = require('./utils/spawnPlayer');
const chunkGen = require('./chunkGen');
const broadcastPositionUpdates = require('./utils/broadcastPositionUpdates');
const config = yaml.parse(fs.readFileSync('config.yaml').toString())
const server = mc.createServer(config.server);
let entityIdIndex = server.maxPlayers + 1;

function createEntityId() {
  entityIdIndex++;
  return entityIdIndex;
}
function offsetDir(x, y, z, dir) {
    if (dir == 1) return [x, y + 1, z]
    else if (dir == 2) return [x, y, z - 1]
    else if (dir == 3) return [x, y, z + 1]
    else if (dir == 4) return [x - 1, y, z]
    else if (dir == 5) return [x + 1, y, z]
    else if (dir == 6) return [x, y - 1, z]
}
chunkManager.world.getColumn(0, 0)
server.on('playerJoin', async (client)=>{
    fs.appendFileSync(`logs.txt`, `\n[${new Date().toString()}] ${client.username} Joined`)
    console.log(client.username + " joined!")
    client.id = createEntityId();
    client.uuid = uuid.v4();
    client.position = { x: 7, y: 101, z: 7 }; // Initial position
    let chunk = {
        x: 0,
        z: 0,
        chunk: await chunkManager.world.getColumn(0, 0)
    }
    console.log(chunk.chunk.blockLightMask)
    // Object.values(server.clients).forEach(existingClient => {
        // if (existingClient !== client) {
            // spawnPlayer(client, existingClient);
        // }
    //   });
    client.on('end', function () {

    });
    client.write('login', {
        ...mcData.loginPacket,
        entityId: client.id,
        isHardcore: false,
        gameMode: 1,
        previousGameMode: 1,
        worldNames: ['minecraft:overworld'],
        worldName: 'minecraft:overworld',
        hashedSeed: [0, 0],
        maxPlayers: server.maxPlayers,
        viewDistance: 20,
        reducedDebugInfo: false,
        enableRespawnScreen: true,
        isDebug: false,
        isFlat: false
      });
    // let skyLight = [], blockLight = [];
    // chunk.chunk.skyLightSections.forEach(e => e !== null && skyLight.push(new Uint8Array(e.data.buffer)));
    // chunk.chunk.blockLightSections.forEach(e => e !== null && blockLight.push(new Uint8Array(e.data.buffer)));
    console.log(chunk.chunk.blockLightMask)
    client.write('map_chunk', {
        x: 0,
        z: 0,
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

    client.write('position', {
        x: 7,
        y: 52,
        z: 7,
        yaw: 0,
        pitch: 0,
        flags: 0x00
    });
    let chunksLoaded = [];
    async function getChunksNear() {
        let chunks = await chunkGen.getChunksNearLoc(client.position);
        for(const chunk of chunks) {
            if(chunksLoaded.find(_=>_[0]==chunk.x && _[1]==chunk.z)) continue;
            chunksLoaded.push([chunk.x,chunk.z])
            client.write('map_chunk', {
                x: chunk.x,
                z: chunk.z,
                // groundUp: chunksLoaded.find(_=>_[0]==chunk.x&&_[1]==chunk.z) ? false : true,
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
        
        }
    
    }
    let prevChunkLoc = {x:Math.floor(client.position.x / 16),z:Math.floor(client.position.z / 16)}
    getChunksNear();
    client.on('position', function (data) {
        client.position = { x: data.x, y: data.y, z: data.z };
        let newChunkLoc = {x:Math.floor(client.position.x / 16),z:Math.floor(client.position.z / 16)};
        if(newChunkLoc.x != prevChunkLoc.x || newChunkLoc.z != prevChunkLoc.z) {
            getChunksNear()
            prevChunkLoc = newChunkLoc;
        }
        broadcastPositionUpdates(server, client)
    });
    let currSlot = 0;
    let playerSlots = {};
    chunkManager.world.on('blockUpdate', async (oldBlock, newBlock) => {
        let chunkLoc = {x:Math.floor(oldBlock.position.x / 16),z:Math.floor(oldBlock.position.z / 16)};
        let chunk = {
            x: chunkLoc.x,
            z: chunkLoc.z,
            chunk: await chunkManager.world.getColumn(chunkLoc.x, chunkLoc.z)
          }
          client.write('map_chunk', {
            x: chunk.x,
            z: chunk.z,
            // groundUp: chunksLoaded.find(_=>_[0]==chunk.x&&_[1]==chunk.z) ? false : true,
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

    });
    client.on('block_place', async function (packet) {
        try {
            
            if (playerSlots[currSlot]) {
                let itemName = mcData.items[playerSlots[currSlot]].name
                if(!mcData.blocksByName[itemName]) return;
        
                let off = offsetDir(packet.location.x, packet.location.y, packet.location.z, packet.direction)
                let block2 = await chunkManager.world.getBlock(new Vec3(packet.location.x, packet.location.y, packet.location.z));
                if(block2.material == "plant") {
                    off = [packet.location.x,packet.location.y,packet.location.z]
                }
                let chunkLoc = {
                    x: Math.floor(off[0] / 16),
                    z: Math.floor(off[2] / 16),
                }
                console.log(chunkLoc)
                let id = mcData.blocksByName[itemName].id
                let block = Block.fromString(itemName);
                await chunkManager.world.setBlock(new Vec3(...off), block);
                await chunkManager.world.setBlockStateId(new Vec3(...off), mcData.blocksByName[itemName].defaultState);
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
                      value: {}
                    },
                    bitMap: chunk.chunk.getMask(),
                    chunkData: chunk.chunk.dump(),
                    blockEntities: []
                });
            }
        } catch(e){console.error(e)}
    });
    client.on('chat',packet=>{
        let sender = null;
        server.writeToClients(server.clients, 'chat', { message: JSON.stringify({ text: `<${client.username}> ${packet.message}` }), position: 0, sender: sender || '0' });
    })
    client.on('held_item_slot', (packet) => {
        currSlot = packet.slotId + 36;
      })
      client.on('set_creative_slot', (packet) => {
        console.log(packet);
        console.log(packet.item)
        playerSlots[packet.slot] = packet.item.itemId;
      })
      client.on('block_dig', async function (packet) {
        try {
          let chunkLoc = {
            x: Math.floor(packet.location.x / 16),
            z: Math.floor(packet.location.z / 16),
          }
          await chunkManager.world.setBlock(new Vec3(packet.location.x, packet.location.y, packet.location.z), Block.fromString('minecraft:air'))
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
    
        } catch { }
    
      });
    // setInterval(()=>{
    //     getChunksNear()
    // },1000);
})
server.on('error', function (error) {
    console.log('Error:', error);
  });
  
  server.on('listening', function () {
    console.log('Server listening on port', server.socketServer.address().port);
  });