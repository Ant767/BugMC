function wrapNumber(num, min, max) {
    return ((num - min) % (max - min) + (max - min)) % (max - min) + min;
}
function normalizeYaw(yaw) {
    while (yaw < -127) yaw += 256;
    while (yaw > 128) yaw -= 256;
    return yaw;
}

function wrapYaw(yaw) {
    return normalizeYaw(yaw);
    const min = -127;
    const max = 128;
    const range = max - min;
    return ((yaw - min) % range + range) % range + min;
}
function wrapAngleTo180(angle) {
    angle = angle % 360; // Normalize angle to the range of -360 to 360
    if (angle > 180) {
        angle -= 360; // Wrap around to -180
    } else if (angle < -180) {
        angle += 360; // Wrap around to 180
    }
    return angle;
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Example usage:
console.log(clamp(5, 1, 10));  // Output: 5
console.log(clamp(0, 1, 10));  // Output: 1
console.log(clamp(15, 1, 10)); // Output: 10
function toMinecraftYaw(degrees) {
    // Normalize the angle to the range of -360 to 360
    let yaw = degrees % 360;
    if (yaw < -360) {
        yaw += 360 * Math.ceil(-yaw / 360);
    } else if (yaw < 0) {
        yaw += 360;
    }

    // Convert to the range of -128 to 127
    yaw = (yaw - 180) % 256;
    if (yaw < -127) {
        yaw += 256;
    }

    return yaw;
}

// Example usage:
console.log(toMinecraftYaw(450));   // Output: -90
console.log(toMinecraftYaw(-450));  // Output: 90
console.log(toMinecraftYaw(720));   // Output: 0
console.log(toMinecraftYaw(-720));  // Output: 0
console.log(toMinecraftYaw(180));   // Output: 0
console.log(toMinecraftYaw(-180));  // Output: 0


// Example usage:
console.log(toMinecraftYaw(90));   // Output: -90
console.log(toMinecraftYaw(-90));  // Output: 90
console.log(toMinecraftYaw(450));  // Output: -90
console.log(toMinecraftYaw(180));  // Output: 0
console.log(toMinecraftYaw(-180)); // Output: 0

module.exports = function broadcastPositionUpdates(server, client) {
    const updateInterval = setInterval(() => {

        const position = client.position;
        server.writeToClients(Object.values(server.clients).filter(c => c !== client), 'entity_teleport', {
            entityId: client.id,
            x: position.x,
            y: position.y,
            z: position.z,
            pitch: 0,
            yaw: wrapNumber(-toMinecraftYaw(client.yaw), -128, 127),
            onGround: true
        });
    }, 50); // Update every 50ms
}