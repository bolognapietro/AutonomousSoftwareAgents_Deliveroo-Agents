import fs from 'fs';

/**
 * Calculates the Manhattan distance between two points.
 *
 * @param {Object} point1 - The first point.
 * @param {number} point1.x - The x-coordinate of the first point.
 * @param {number} point1.y - The y-coordinate of the first point.
 * @param {Object} point2 - The second point.
 * @param {number} point2.x - The x-coordinate of the second point.
 * @param {number} point2.y - The y-coordinate of the second point.
 * @returns {number} The Manhattan distance between the two points.
 */
function distance( {x:x1, y:y1}, {x:x2, y:y2}) {
    const dx = Math.abs( Math.round(x1) - Math.round(x2) )
    const dy = Math.abs( Math.round(y1) - Math.round(y2) )
    return dx + dy;
}


/**
 * Finds the nearest delivery point to the given agent.
 *
 * @param {Object} agent - The agent's current position with properties `x` and `y`.
 * @param {Array<Object>} deliveryPoints - An array of delivery points, each with properties `x` and `y`.
 * @returns {Object} The nearest delivery point to the agent.
 */
function findNearestDeliveryPoint(agent, deliveryPoints) {
    
    let nearest = deliveryPoints.reduce((prev, curr) => {
        let prevDistance = distance({x: prev.x, y: prev.y}, agent);
        let currDistance = distance({x: curr.x, y: curr.y}, agent);

        return prevDistance < currDistance ? prev : curr;
    });
    return nearest;
}

/**
 * Checks if the given coordinates (myX, myY) are within the bounds of the map and exist in the map's coordinates.
 *
 * @param {number} myX - The x-coordinate to check.
 * @param {number} myY - The y-coordinate to check.
 * @param {Object} map - The map object containing width, height, and coordinates.
 * @param {number} map.width - The width of the map.
 * @param {number} map.height - The height of the map.
 * @param {Array} map.coords - An array of coordinate objects with x and y properties.
 * @returns {boolean} - Returns true if the coordinates are valid and exist in the map, otherwise false.
 */
function isValidPosition(myX, myY, map) {
    let found = false;
    if (myX >= 0 && myX < map.width && myY >= 0 && myY < map.height){
        map.coords.forEach((row) => {
            if (row.x === myX && row.y === myY) {
                found = true;
            }
        });
    } 
    return found;
}

/**
 * Used in the collaboration.js file.
 * Moves the agent to a random position on the map.
 * The map is divided into four quadrants, and the agent will move to one of the quadrant centers.
 * If the agent is already at the selected position, it will move to the next position in the list.
 *
 * @param {Object} myAgent - The agent object.
 * @param {Object} myAgent.maps - The map object containing the width of the map.
 * @param {number} myAgent.maps.width - The width of the map.
 * @param {Object} myAgent.me - The agent's current position.
 * @param {number} myAgent.me.x - The agent's current x-coordinate.
 * @param {number} myAgent.me.y - The agent's current y-coordinate.
 * @returns {Array} An array containing the action 'go_to' and the coordinates [x, y] to move the agent to.
 */
function simpleMoveToRandomPos(myAgent) {
    const random_pos = [[myAgent.maps.width/4, myAgent.maps.width/4], [myAgent.maps.width/4, 3*myAgent.maps.width/4], [3*myAgent.maps.width/4, myAgent.maps.width/4], [3*myAgent.maps.width/4, 3*myAgent.maps.width/4]];
    const randomIndex = Math.floor(Math.random() * random_pos.length);
    const selectedPosition = random_pos[randomIndex];
    if (selectedPosition[0] == myAgent.me.x && selectedPosition[1] == myAgent.me.y) {
        const newIndex = (randomIndex + 1) % random_pos.length;
        const newSelectedPosition = random_pos[newIndex];
        return [['go_to', newSelectedPosition[0], newSelectedPosition[1]]];
    } 
    else {
        return [['go_to', selectedPosition[0], selectedPosition[1]]];
    }
}

/**
 * Reads the content of a file at the given path.
 * 
 * @param {string} path - The path to the file to be read.
 * @returns {Promise<string>} A promise that resolves with the file content as a string, or rejects with an error if the file cannot be read.
 */
function readFile(path) {
    return new Promise((res, rej) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) rej(err)
            else res(data)
        })
    })
}

export { distance, findNearestDeliveryPoint, isValidPosition, simpleMoveToRandomPos, readFile };