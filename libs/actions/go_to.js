import {client} from '../utils/client_config.js';
import Plans from '../utils/plan.js'; 
import Message from '../messages/message.js';
import {distance} from '../utils/support_fn.js';

/**
 * Class representing a GoTo action plan.
 * @extends Plans
 */
class GoTo extends Plans{
    /**
     * Create a GoTo plan.
     * @param {Object} parent - The parent object.
     * @param {Object} me - The agent executing the plan.
     * @param {Object} maps - The map object containing the environment details.
     */
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
    }

    /**
     * Check if the GoTo plan is applicable to the given move.
     * @param {string} move - The move to check.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {string} id - The identifier.
     * @returns {boolean} True if the move is 'go_to', otherwise false.
     */
    static isApplicableTo ( move, x, y, id ) {
        return 'go_to' == move;
    }

    /**
     * Execute the GoTo plan to move to the target coordinates.
     * @param {string} go_to - The move type.
     * @param {number} targetX - The target x-coordinate.
     * @param {number} targetY - The target y-coordinate.
     * @returns {Promise<boolean>} True if the path was completed successfully, otherwise false.
     */
    async execute(go_to, targetX, targetY) {
        // Use BFS to find the shortest path to the target coordinates
        this.maps.update_beliefset();
        
        let completed = false;
        var shortestPath = await this.findShortestPath(this.me.x, this.me.y, targetX, targetY, this.maps);
        
        if (shortestPath !== null) {
            let path = [];
            let actual = { x: this.me.x, y: this.me.y };
            
            // Build the path based on the shortest path found
            for (let i = 0; i <= shortestPath.length; i++) {
                path.push([actual.x, actual.y]);
                if (shortestPath[i] === 'up') {
                    actual.y += 1;
                } else if (shortestPath[i] === 'down') {
                    actual.y -= 1;
                } else if (shortestPath[i] === 'left') {
                    actual.x -= 1;
                } else if (shortestPath[i] === 'right') {
                    actual.x += 1;
                }
            }

            // Find parcels on the path
            let parcelsOnPath = [];
            for (let par of this.me.getParticle()) {
                for (let p of path) {
                    if (par[1].x == p.x && par[1].y == p.y && (p.x != x || p.y != y)) {
                        parcelsOnPath.push(par);
                    }
                }
            }

            // Find delivery points on the path
            let deliveryPointsOnPath = [];
            for (let del of this.maps.deliverPoints) {
                for (let p of path) {
                    if (del.x == p[0] && del.y == p[1] && p != [del.x, del.y] && (del.x != this.me.x || del.y != this.me.y)) {
                        deliveryPointsOnPath.push(del);
                    }
                }
            }
            
            // Execute the moves to reach the target
            for (const move of shortestPath) {
                // Pick up parcels if found on the path
                if (parcelsOnPath.some(par => { return par[1].x === this.me.x && par[1].y === this.me.y; })) {
                    await client.pickup();
                }
                // Put down parcels if at delivery points
                if (deliveryPointsOnPath.some(del => { return del.x === Math.round(this.me.x) && del.y === Math.round(this.me.y); })) {
                    await client.putdown();
                }
                // Move the agent
                completed = await client.move(move);
            }

            // Check if the path was completed successfully
            if (completed.x === targetX && completed.y === targetY) {
                completed = true;
            } else {
                completed = false;
            }

            // Handle case where agent is stuck with another agent
            if (!completed) {
                const agent_map = this.maps.getAgents();
                for (const agent of agent_map) {
                    // Check if the agent is 1 block away
                    if (agent.x === this.me.x + 1 || agent.x === this.me.x - 1 || agent.y === this.me.y + 1 || agent.y === this.me.y - 1) {
                        console.log('stuck with agent', agent.id);
                        // Cooperate with friend agent to unstuck
                        if (agent.id === this.me.friendId) {
                            console.log('stuck with my Friend');
                            let msg = new Message();
                            msg.setHeader("STUCKED_TOGETHER");
                            // Determine which agent is closer to the center of the map
                            const map_center = { x: Math.floor(this.maps.width / 2), y: Math.floor(this.maps.height / 2) };
                            const distance_to_center = Math.abs(map_center.x - this.me.x) + Math.abs(map_center.y - this.me.y);
                            const distance_to_center_friend = Math.abs(map_center.x - agent.x) + Math.abs(map_center.y - agent.y);
                            let content = "";
                            if (distance_to_center > distance_to_center_friend) {
                                content = "You have to move away";
                            } else {
                                content = "I have to move away";
                            }
                            msg.setContent(content);
                            msg.setSenderInfo({ name: this.me.name, x: this.me.x, y: this.me.y, points: this.me.score, timestamp: Date.now() });
                            await client.say(this.me.friendId, msg);
                            break;
                        }
                        else{ // there is another agent that is not the friend
                            // case: agent has to deliver parcerls but the delivery point is blocked by another agent (not the friend)
                            if (this.me.particelsCarried){
                                let deliveryPoints = this.maps.getDeliverPoints();
                                deliveryPoints.sort((a, b) => distance(this.me, a) - distance(this.me, b));
                                //push the second near delivery point
                                let saving_coord ;
                                for (const del of deliveryPoints) {
                                    if (del.x != agent.x && del.y != agent.y){
                                        saving_coord = del;
                                        break;
                                    }
                                }
                                await this.subIntention(['go_put_down', saving_coord.x, saving_coord.y], this.me, this.maps); 
                            }
                        }
                        break;
                    }
                }
            }
            return true; // Return true if the path was completed successfully
        } else {
            console.log("Unable to find a path to the target.");
            return false; // Return false if no path is found
        }
    }

    /**
     * Find the shortest path from the agent's current position to the target coordinates using BFS.
     * @param {number} agentX - The agent's current x-coordinate.
     * @param {number} agentY - The agent's current y-coordinate.
     * @param {number} targetX - The target x-coordinate.
     * @param {number} targetY - The target y-coordinate.
     * @param {Object} map - The map object containing the environment details.
     * @returns {Promise<Array<string>|null>} The sequence of moves to reach the target, or null if no path is found.
     */
    async findShortestPath(agentX, agentY, targetX, targetY, map) {
        const queue = [{ x: agentX, y: agentY, moves: [] }];
        const visited = new Set();

        while (queue.length > 0) {
            const { x, y, moves } = queue.shift();
            if (x === targetX && y === targetY) {
                // Hai trovato la particella. Restituisci la sequenza di mosse.
                // console.log("Trovata particella: ", moves);
                return moves;
            }

            // Se la posizione è già stata visitata, passa alla prossima iterazione
            if (visited.has(`${x},${y}`)) continue;
            visited.add(`${x},${y}`);

            // Espandi i vicini validi
            const neighbors = this.getValidNeighbors(x, y, map);
            for (const neighbor of neighbors) {
                const { newX, newY, move } = neighbor;
                const newMoves = [...moves, move];
                queue.push({ x: newX, y: newY, moves: newMoves });
            }
        }

        // Se non è possibile raggiungere la particella, restituisci null
        return null;
    }

    /**
     * Get the valid neighboring positions from the current position.
     * @param {number} x - The current x-coordinate.
     * @param {number} y - The current y-coordinate.
     * @param {Object} map - The map object containing the environment details.
     * @returns {Array<Object>} An array of valid neighboring positions and their corresponding moves.
     */
    getValidNeighbors(x, y, map) {
        const neighbors = [];
        const moves = [[0, 1, 'up'], [0, -1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];

        for (const [dx, dy, move] of moves) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isValidPosition(newX, newY, map)) {
                neighbors.push({ newX, newY, move });
            }
        }

        return neighbors;
    }

    /**
     * Check if the given position is valid within the map.
     * @param {number} myX - The x-coordinate to check.
     * @param {number} myY - The y-coordinate to check.
     * @param {Object} map - The map object containing the environment details.
     * @returns {boolean} True if the position is valid, otherwise false.
     */
    isValidPosition(myX, myY, map) {
        return myX >= 0 && myX < map.width && myY >= 0 && myY < map.height && map.map.some(row => row.x === myX && row.y === myY);
    }
}

export default GoTo;