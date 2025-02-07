import { Beliefset } from "@unitn-asa/pddl-client";
/**
 * Class representing a map for autonomous software agents.
 */
class Maps {

    /**
     * @private
     * @type {Object}
     */
    #agentMap = {};

    /**
     * @type {Beliefset}
     */
    agent_beliefset = new Beliefset();

    /**
     * Create a map.
     * @param {number} width - The width of the map.
     * @param {number} height - The height of the map.
     * @param {Array<Array<number>>} coords - The coordinates of the map.
     * @param {Array<Object>} delPoints - The delivery points on the map.
     */
    constructor(width, height, coords, delPoints) {
        this.width = width;
        this.height = height;
        this.map = coords;
        this.deliverPoints = delPoints;
        this.agent_beliefset = new Beliefset();
        // value_coords full of 0
        this.value_coords = Array.from({ length: this.width }, () => Array.from({ length: this.height }, () => 0));
    }

    /**
     * Get the value at a specific coordinate.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @returns {number} The value at the coordinate.
     */
    get(x, y) {
        return this.map[x][y];
    }

    setValue(x, y, value){
        this.value_coords[x][y] = value;
    }

    getVal(x, y){
        return this.value_coords[x][this.width - y - 1];
    }

    /**
     * Set an agent's position and time.
     * @param {string} id - The agent's ID.
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @param {number} time - The time associated with the agent's position.
     */
    setAgent(id, x, y, time) {
        this.#agentMap[id] = { id: id, x: x, y: y, time: time };
    }

    /**
     * Get all agents on the map.
     * @returns {Array<Object>} An array of agents.
     */
    getAgents() {
        let returnArray = [];
        for (let key in this.#agentMap) {
            returnArray.push(this.#agentMap[key]);
        }
        return returnArray;
    }

    /**
     * Get all delivery points on the map.
     * @returns {Array<Object>} An array of delivery points.
     */
    getDeliverPoints() {
        return this.deliverPoints;
    }

    /**
     * Update the belief set based on the current map state.
     */
    update_beliefset() {
        this.agent_beliefset = new Beliefset();

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.map[x][y] === 0 || this.map[x][y] === -1) {
                    continue;
                }
                if ((x + 1) < this.width && this.map[x + 1][y] > 0) {
                    this.agent_beliefset.declare('right t' + x + '_' + y + ' t' + (x + 1) + '_' + y);
                }
                if ((x - 1) >= 0 && this.map[x - 1][y] > 0) {
                    this.agent_beliefset.declare('left t' + x + '_' + y + ' t' + (x - 1) + '_' + y);
                }
                if ((y + 1) < this.height && this.map[x][y + 1] > 0) {
                    this.agent_beliefset.declare('up t' + x + '_' + y + ' t' + x + '_' + (y + 1));
                }
                if ((y - 1) >= 0 && this.map[x][y - 1] > 0) {
                    this.agent_beliefset.declare('down t' + x + '_' + y + ' t' + x + '_' + (y - 1));
                }
            }
        }
    }

    /**
     * this method returns the possible directions wher an agent can go from a given point
     * @param {float} x - Coordinate x of the agent 
     * @param {float} y - Coordinate y of the agent 
     * @returns possible direction of the agent
     */
    getPossibleDirection(x, y) {

        let directions = [];
        x = Math.round(x);
        y = Math.round(y);
        if (x > 0 && this.getVal(x - 1, y) !== 0) {
            directions.push({ x: x - 1, y: y, name: "left" });
        }
        if (x < this.width && this.getVal(x + 1, y) !== 0) {
            directions.push({ x: x + 1, y: y, name: "right" });
        }
        if (y > 0 && this.getVal(x, y - 1) !== 0) {
            directions.push({ x: x, y: y - 1, name: "down" });
        }
        if (y < this.height && this.getVal(x, y + 1) !== 0) {
            directions.push({ x: x, y: y + 1, name: "up" });
        }

        const maps_agent = this.getAgents();
        const possibleDirections = [];
        for (let i = 0; i < directions.length; i++) {
            let can_move = true
            for (let j = 0; j < maps_agent.length; j++) {
                if (maps_agent[j].x === directions[i].x && maps_agent[j].y === directions[i].y) {
                    can_move = false;
                    break;
                }
            }
            if (can_move) possibleDirections.push(directions[i]);
        }

        return possibleDirections;
    }
}

export default Maps;