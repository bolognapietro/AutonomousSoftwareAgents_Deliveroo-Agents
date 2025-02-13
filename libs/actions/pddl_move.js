import {client} from '../utils/client_config.js';
import Plans from '../utils/plan.js'; 
import Message from '../messages/message.js';
import { readFile } from '../utils/support_fn.js';
import { onlineSolver } from "@unitn-asa/pddl-client";

let domain = await readFile('libs/actions/domain.pddl'); 

/**
 * Class representing a PDDL move action.
 * @extends Plans
 */
class PddlMove extends Plans {
    /**
     * Create a PddlMove instance.
     * @param {Object} parent - The parent object.
     * @param {Object} me - The agent object.
     * @param {Object} maps - The maps object.
     */
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
    }

    /**
     * Check if the move is applicable.
     * @param {string} move - The move type.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {string} id - The parcel id.
     * @returns {boolean} True if the move is applicable, false otherwise.
     */
    static isApplicableTo(move, x, y, id) {
        return ['go_to', 'go_pick_up', 'go_put_down'].includes(move);
    }

    /**
     * Execute the move action.
     * @param {string} go_to - The move type.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {string} pid - The parcel id.
     * @returns {Promise<boolean>} True if the move was successful, false otherwise.
     */
    async execute(go_to, x, y, pid) {        
        this.maps.update_beliefset();

        // Define the PDDL goal based on the task
        let goal = "";
        if (go_to === 'go_to') {
            goal = `(at t${x}_${y})`;
        } else if (go_to === 'go_pick_up') {
            goal = `(carrying ${pid})`;
        } else if (go_to === 'go_put_down') {
            const particles = this.me.getParticle()
            pid = particles.entries().next().value[0];
            goal = `(parcel_at ${pid} t${x}_${y})`;
        }

        // Define the PDDL objects
        let objects = this.maps.map.map(tile => `t${tile.x}_${tile.y}`).join(' ');

        // Generate movement relations
        let movements = [];
        let tileMap = new Map();

        // Populate a map for quick lookup
        this.maps.map.forEach(tile => {
            tileMap.set(`t${tile.x}_${tile.y}`, tile);
        });

        // Compute movement predicates
        this.maps.map.forEach(tile => {
            let current = `t${tile.x}_${tile.y}`;
            
            let neighbors = [
                { x: tile.x, y: tile.y - 1, dir: "down", opp: "up" },
                { x: tile.x, y: tile.y + 1, dir: "up", opp: "down" },
                { x: tile.x - 1, y: tile.y, dir: "left", opp: "right" },
                { x: tile.x + 1, y: tile.y, dir: "right", opp: "left" }
            ];

            neighbors.forEach(n => {
                let neighbor = `t${n.x}_${n.y}`;
                if (tileMap.has(neighbor)) {
                    movements.push(`(${n.dir} ${neighbor} ${current})`);
                    movements.push(`(${n.opp} ${current} ${neighbor})`);
                }
            });
        });

        // Create the PDDL problem string
        let problem = ''
        if (go_to === 'go_to' || go_to === 'go_pick_up') {
            problem = `
            (define (problem deliveroo-pddl)
                (:domain deliveroo)
                (:objects
                    ${objects}
                    ${pid}
                )
                (:init
                    ;; Agent position        
                    (at t${this.me.x}_${this.me.y})

                    ;; Parcel location
                    (parcel_at ${pid} t${x}_${y})

                    ;; Map structure (direction new_pos old_pos)
                    ${movements.join("\n        ")}
                )
                (:goal
                    (and
                        ${goal}
                    )
                )
            )`;
        } else if (go_to === 'go_put_down') {
            problem = `
            (define (problem deliveroo-pddl)
                (:domain deliveroo)
                (:objects
                    ${objects}
                    ${pid}
                )
                (:init
                    ;; Agent position        
                    (at t${this.me.x}_${this.me.y})

                    ;; Parcel location
                    (carrying ${pid})

                    ;; Map structure (direction new_pos old_pos)
                    ${movements.join("\n        ")}
                )
                (:goal
                    (and
                        ${goal}
                    )
                )
            )`;
        }
        
        // Get the plan from the online solver
        var pddlPlan = await onlineSolver(domain, problem);

        // Parse the plan to get the path
        let path = []
        pddlPlan.forEach(action => {
            let end = action.args[1].split('_');
            path.push({
                x: parseInt(end[0].substring(1)),
                y: parseInt(end[1])
            });
        });

        // Get the deliveries and parcels on the path to pick up or put down is pass through them
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
                if (del.x == p.x && del.y == p.y && p != [del.x, del.y] && (del.x != this.me.x || del.y != this.me.y)) {
                    deliveryPointsOnPath.push(del);
                }
            }
        }

        // Start moving the agent to the target position
        let iteration = 0;
        while (iteration < pddlPlan.length) {

            // Check if there is a parcel to pick up on the path
            if (parcelsOnPath.some(par => { return par[1].x === this.me.x && par[1].y === this.me.y; })) {
                console.log('parcelsOnPath');
                await client.pickup();
            }
            // Put down parcels if at delivery points
            if (deliveryPointsOnPath.some(del => { return del.x === Math.round(this.me.x) && del.y === Math.round(this.me.y); })) {
                await client.putdown();
            }

            // Get the next coordinate to move to
            let coordinate = path.shift()
            let status_x = false;
            let status_y = false;

            // Check if the agent is at the target position
            if (coordinate.x == this.me.x && coordinate.y == this.me.y) {
                if (go_to == 'go_pick_up'){
                    await client.pickup();
                    this.me.particelsCarried = true;
                }
                else if (go_to == 'go_put_down'){
                    await client.putdown();
                    this.me.particelsCarried = false;
                }
            }

            // Move the agent to the next coordinate
            if (coordinate.x > this.me.x)
                status_x = await client.move('right')
            else if (coordinate.x < this.me.x)
                status_x = await client.move('left')
            if (status_x) {
                this.me.x = status_x.x;
                this.me.y = status_x.y;
            }

            if (coordinate.y > this.me.y)
                status_y = await client.move('up')
            else if (coordinate.y < this.me.y)
                status_y = await client.move('down')
            if (status_y) {
                this.me.x = status_y.x;
                this.me.y = status_y.y;
            }

            iteration++;
        }

        if (x == this.me.x && y == this.me.y){
            return true;
        }
        else {
            const agent_map = this.maps.getAgents();
            for (const agent of agent_map) {
                // Check if the agent is 1 block away
                if (agent.x === this.me.x + 1 || agent.x === this.me.x - 1 || agent.y === this.me.y + 1 || agent.y === this.me.y - 1) {
                    console.log('stuck with agent', agent.id, agent.x, agent.y);
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
                        } 
                        else if (distance_to_center < distance_to_center_friend) {
                            content = "I have to move away";
                        }
                        
                        msg.setContent(content);
                        msg.setSenderInfo({ name: this.me.name, x: this.me.x, y: this.me.y, points: this.me.score, timestamp: Date.now() });
                        await client.say(this.me.friendId, msg);
                        break;
                    }
                    else{
                        // The enemy is on a delivery point
                        if (this.me.particelsCarried && deliveryPointsOnPath.some(del => { return del.x === Math.round(agent.x) && del.y === Math.round(agent.y); })) {
                            // Go to second nearest delivery point
                            let deliveryPoint = this.maps.deliverPoints;
                            let delivery_no_enemy = deliveryPoint.filter(del => del.x !== Math.round(agent.x) && del.y !== Math.round(agent.y));
                            let second_nearest_delivery = findNearestDeliveryPoint(this.me, delivery_no_enemy);
                            
                            await client.putdown()
                            await client.pickup()
                            await this.execute('go_to', second_nearest_delivery.x, second_nearest_delivery.y);
                            break;
                        }
                    }
                    break;
                }
            }
        };
    }
}

export default PddlMove;