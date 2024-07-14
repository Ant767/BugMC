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
function sendBroadcastMessage(server, clients, message, sender) {
    if (mcData.supportFeature('signedChat')) {
        server.writeToClients(clients, 'player_chat', {
            plainMessage: message,
            signedChatContent: '',
            unsignedChatContent: JSON.stringify({ text: message }),
            type: 0,
            senderUuid: 'd3527a0b-bc03-45d5-a878-2aafdd8c8a43', // random
            senderName: JSON.stringify({ text: sender }),
            senderTeam: undefined,
            timestamp: Date.now(),
            salt: 0n,
            signature: mcData.supportFeature('useChatSessions') ? undefined : Buffer.alloc(0),
            previousMessages: [],
            filterType: 0,
            networkName: JSON.stringify({ text: sender })
        });
    } else {
        server.writeToClients(clients, 'chat', { message: JSON.stringify({ text: message }), position: 0, sender: sender || '0' });
    }
}

function broadcast(message, exclude, username) {
    sendBroadcastMessage(server, Object.values(server.clients).filter(client => client !== exclude), message);
}

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
let players = [];
chunkManager.world.getColumn(0, 0)
server.on('playerJoin', async (client) => {
    if(!players.includes(client.username)) players.push(client.username)
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
    let blockUpdate = async (oldBlock, newBlock) => {
        let chunkLoc = { x: Math.floor(oldBlock.position.x / 16), z: Math.floor(oldBlock.position.z / 16) };
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

    }

    client.on('end', function () {
        chunkManager.world.off("blockUpdate", blockUpdate)
        broadcast(`§e${client.username} left!`);
        players = players.filter(_=>_ != client.username);
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
    broadcast(`§e${client.username} joined!`);
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
        for (const chunk of chunks) {
            if (chunksLoaded.find(_ => _[0] == chunk.x && _[1] == chunk.z)) continue;
            chunksLoaded.push([chunk.x, chunk.z])
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
    let prevChunkLoc = { x: Math.floor(client.position.x / 16), z: Math.floor(client.position.z / 16) }
    getChunksNear();
    client.on('position', function (data) {
        client.position = { x: data.x, y: data.y, z: data.z };
        let newChunkLoc = { x: Math.floor(client.position.x / 16), z: Math.floor(client.position.z / 16) };
        if (newChunkLoc.x != prevChunkLoc.x || newChunkLoc.z != prevChunkLoc.z) {
            getChunksNear()
            prevChunkLoc = newChunkLoc;
        }
        broadcastPositionUpdates(server, client)
    });
    let currSlot = 0;
    let playerSlots = {};
    chunkManager.world.on('blockUpdate', blockUpdate);
            // 161 + 485,489

    client.on('block_place', async function (packet) {
        try {

            if (playerSlots[currSlot]) {
                let itemName = mcData.items[playerSlots[currSlot]].name
                if (!mcData.blocksByName[itemName]) return;

                let off = offsetDir(packet.location.x, packet.location.y, packet.location.z, packet.direction)
                let block2 = await chunkManager.world.getBlock(new Vec3(packet.location.x, packet.location.y, packet.location.z));
                if (block2.material == "plant" && block2.type < 59 && block2.type > 64) {
                    off = [packet.location.x, packet.location.y, packet.location.z]
                }
                // rock wood wool leaves
                let block3 = await chunkManager.world.getBlock(new Vec3(...off))
                if(["rock","wood","wool","leaves"].includes(block3.material)) return;
                if(
                    !(
                        (
                            off[0] == Math.floor(client.position.x) &&
                            off[1] == Math.floor(client.position.y) &&
                            off[2] == Math.floor(client.position.z)    
                        ) || (
                            off[0] == Math.floor(client.position.x) &&
                            off[1] == Math.floor(client.position.y) + 1 &&
                            off[2] == Math.floor(client.position.z)    
                        )
    
                    )
                ) {
                    let chunkLoc = {
                        x: Math.floor(off[0] / 16),
                        z: Math.floor(off[2] / 16),
                    }
                    console.log(chunkLoc)
                    let id = mcData.blocksByName[itemName].id
                    let block = Block.fromString(itemName);
                    await chunkManager.world.setBlock(new Vec3(...off), block);
                    let stateId = mcData.blocksByName[itemName].defaultState
                    //35, 58
                    console.log(block.type)

            // 161 + 485,489
                    if(block.type >= 35 && block.type <= 58) {
                        stateId = packet.direction;
                        await chunkManager.world.setBlockType(new Vec3(...off), block.type);
                        console.log(stateId)
                        await chunkManager.world.setBlockData(new Vec3(...off), packet.direction == 1 ? 1 : packet.direction == 2 ? 2 : packet.direction == 3 ? 2 : 0);
                    } else if(block.type == 161 || (block.type >= 485 && block.type <= 489)) {
                        await chunkManager.world.setBlockType(new Vec3(...off), block.type);
                        await chunkManager.world.setBlockData(new Vec3(...off), 10);
                        await chunkManager.world.setBlockType(new Vec3(off[0],off[1]+1,off[2]), block.type);
                        await chunkManager.world.setBlockData(new Vec3(off[0],off[1]+1,off[2]), 2);

                    } else {
                        await chunkManager.world.setBlockStateId(new Vec3(...off), stateId);
                    }
                    let chunk = {
                        x: chunkLoc.x,
                        z: chunkLoc.z,
                        chunk: await chunkManager.world.getColumn(chunkLoc.x, chunkLoc.z)
                    }
    
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
        } catch (e) { console.error(e) }
    });
    client.on('chat', data => {
        if(data.message == "/list") {
            sendBroadcastMessage(server, [client], `§eThere are §b${players.length} player(s) §eonline: §r${players.join('§7, §r')}`);
            return;
        }
        if(data.message.startsWith("/tp ")) {
            try {
                let args = data.message.split(' ').slice(1);
                let arg1 = parseInt(args[0]);
                let arg2 = parseInt(args[1]);
                let arg3 = parseInt(args[2]);
                client.write('position', {
                    x: arg1,
                    y: arg2,
                    z: arg3,
                    yaw: 0,
                    pitch: 0,
                    flags: 0x00
                });
            
            } catch {}
            return;
        }
        let adminUsernames = ["AzaleaDev","FruitKitty_"]
        broadcast((adminUsernames.includes(client.username) ? "§b[BugMC Admin] §r" : "§f") + "<" + client.username + "> " + data.message, null, client.username);

        // let sender = null;
        // server.writeToClients(server.clients, 'chat', { message: JSON.stringify({ text: `<${client.username}> ${packet.message}` }), position: 0, sender: sender || '0' });
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