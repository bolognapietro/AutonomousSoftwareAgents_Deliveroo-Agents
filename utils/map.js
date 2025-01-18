import { Beliefset } from "@unitn-asa/pddl-client";
class Maps {

    #map; //0 = vuoto, 1 = delivery, 2 = piastrella
    // deliverPoints = [];
    #agentMap = {};
    agent_beliefset = new Beliefset();

    constructor(width, height, coords, delPoints) {
        this.width = width
        this.height = height
        this.map = coords;
        this.deliverPoints = delPoints
        this.agent_beliefset = new Beliefset()
        // this.#map = Array(width).fill().map(() => Array(height).fill(0));
    }

    // set_deliver_points(deliverPoints) { 
    //     this.#deliverPoints = this.coords.filter(this.coord => this.coord.delivery);;
    // }

    // set(x, y, value) {
    //     this.#map[y][x] = value;
    //     if (value == 1) {
    //         this.#deliverPoints.push({ x: y, y: x });
    //     }
    // }
    get(x, y) {
        return this.map[x][y];
    }

    setAgent(id, x, y, time) {
        // this.#agentMap.set(id, { id: id, x: x, y: y, time: time });
        this.#agentMap[id] = { id: id, x: x, y: y, time: time };
    }

    getAgents() {
        let returnArray = [];
        for (let key in this.#agentMap) {
            returnArray.push(this.#agentMap[key]);
        }
        return returnArray;
    }

    // get(x, y) {
    //     return this.#map[x][y];
    // }

    // getMap() {

    //     let tmpAgentMap = this.getAgents();
    //     // Filter and remove agents that haven't been seen for 10 seconds
    //     tmpAgentMap = tmpAgentMap.filter(agent => {
    //         return agent.time >= Date.now() - 10000;
    //     });

    //     // For each agent, update the cell weight
    //     const grid = this.map;
    //     grid.forEach((row, x) => {
    //         row.forEach((cell, y) => {
    //             if (cell != 0) {
    //                 grid[x][y] = 1;
    //             }
    //         })
    //     })
    //     return grid;
    // }

    getDeliverPoints() {
        return this.deliverPoints;
    }

    getAnotherDir(x, y) {
        const tmpAgentMap = this.getAgents();
        let directions = [];
        if (x > 0 && this.get(x - 1, y) !== undefined && this.get(x - 1, y) !== 0) {
            directions.push({ x: x - 1, y: y, name: "left" });
        }
        if (x < this.width && this.get(x + 1, y) !== undefined && this.get(x + 1, y) !== 0) {
            directions.push({ x: x + 1, y: y, name: "right" });
        }
        if (y > 0 && this.get(x, y - 1) !== undefined && this.get(x, y - 1) !== 0) {
            directions.push({ x: x, y: y - 1, name: "down" });
        }
        if (y < this.height && this.get(x, y + 1) !== undefined && this.get(x, y + 1) !== 0) {
            directions.push({ x: x, y: y + 1, name: "up" });
        }
        const realDirections = [];
        for (let i = 0; i < directions.length; i++) {
            let free = true
            for (let j = 0; j < tmpAgentMap.length; j++) {
                if (tmpAgentMap[j].x === directions[i].x && tmpAgentMap[j].y === directions[i].y) {
                    free = false;
                    break;
                }
            }
            if (free) {
                realDirections.push(directions[i]);
            }
        }
        return realDirections
    }

    update_beliefset() {
        this.agent_beliefset = new Beliefset();

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.map[x][y] === 0 || this.map[x][y] === -1) {
                    // console.log("Tile ", x, " ", y, " skipped  (val = ", this.map[x][y], ")")
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

    print() {
        for (let y = 0; y < this.height; y++) {
            let row = '';
            for (let x = 0; x < this.width; x++) {
                row += this.get(x, y);
            }
            console.log(row);
        }
    }

}

export default Maps;