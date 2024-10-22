class Maps {

    #map;
    #deliverPoints = [];
    #agentMap = {};

    constructor(width, height) {
        this.width = width
        this.height = height
        this.#map = Array(width).fill().map(() => Array(height).fill(0));
    }

    set(x, y, value) {
        this.#map[y][x] = value;
        if (value == 1) {
            this.#deliverPoints.push({ x: y, y: x });
        }
    }
    setAgent(id, x, y, time) {
        this.#agentMap[id] = { id: id, x: x, y: y, time: time };
    }

    getAgentMap() {
        let returnArray = [];
        for (let key in this.#agentMap) {
            returnArray.push(this.#agentMap[key]);
        }
        return returnArray;
    }

    get(x, y) {
        return this.#map[x][y];
    }

    getMap() {

        let tmpAgentMap = this.getAgentMap();
        // Filter and remove agents that haven't been seen for 10 seconds
        tmpAgentMap = tmpAgentMap.filter(agent => {
            return agent.time >= Date.now() - 10000;
        });

        // For each agent, update the cell weight
        const grid = this.#map;
        grid.forEach((row, x) => {
            row.forEach((cell, y) => {
                if (cell != 0) {
                    grid[x][y] = 1;
                }
            })
        })


        return grid;
    }

    getDeliverPoints() {
        return this.#deliverPoints;
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