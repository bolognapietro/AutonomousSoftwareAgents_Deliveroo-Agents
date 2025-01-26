import {client} from '../utils/client_config.js';
import Plans from '../utils/plan.js'; 
import Message from '../messages/message.js';
import { readFile } from '../utils/support_fn.js';
import { onlineSolver } from "@unitn-asa/pddl-client";

// Debug: AutonomousSoftwareAgents_Deliveroo-Agents/actions/domain.pddl
// Terminal: actions/domain.pddl
let domain = await readFile('AutonomousSoftwareAgents_Deliveroo-Agents/actions/domain.pddl'); 

class PddlMove extends Plans {
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
        // console.log('prova meArray nel costruttore di GoTo: ', this.me); // Aggiungi un log nel costruttore
    }

    static isApplicableTo(move, x, y, id) {
        return ['go_to', 'go_pick_up', 'go_put_down'].includes(move);
    }

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

        // Set the countStacked to 1 if the agent is a SLAVE, otherwise to 12
        // We use two different stucked because if the MASTER Stuck the SLAVE the SLAVE escape before the MASTER 
        if (this.me.master) {
            var countStacked = 12
        }
        else {
            var countStacked = 2
        }

        // Get the deliveries and parcels on the path to pick up or put down is pass through them
        let parcelsOnPath = [];
        for (let par of this.me.getParticle()) {
            for (let p of path) {
                if (par[1].x == p.x && par[1].y == p.y && (p.x != x || p.y != y)) {
                    parcelsOnPath.push(par);
                }
            }
        }

        // Start moving the agent to the target position
        let iteration = 0;
        while (iteration < pddlPlan.length) {
            //! ----- NON SERVE -----
            // if (deliveriesOnPath.some(del => {
            //     del.x === this.me.x && del.y === this.me.y
            // })) {
            //     if (this.stopped) throw ['stopped']; // if stopped then quit
            //     await client.putdown()
            //     if (this.stopped) throw ['stopped']; // if stopped then quit
            // }

            //! ----- RIVEDERE -----
            if (parcelsOnPath.some(par => { return par[1].x === this.me.x && par[1].y === this.me.y; })) {
                console.log('parcelsOnPath');
                // if (this.stopped) throw ['stopped']; // if stopped then quit
                // Pickup the parcel
                await client.pickup();
                // if (this.stopped) throw ['stopped']; // if stopped then quit

                // Add parcels to MyData.parcelsInMind if they match the current position
                // parcelsOnPath.forEach(par => {
                //     if (par.x === this.me.x && par.y === this.me.y) {
                //         MyData.parcelsInMind.push(par.id);
                //     }
                // });
            }

            // Get the next coordinate to move to
            let coordinate = path.shift()
            let status_x = false;
            let status_y = false;

            if (coordinate.x == this.me.x && coordinate.y == this.me.y) {
                if (go_to == 'go_pick_up'){
                    await client.pickup();
                }
                else if (go_to == 'go_put_down'){
                    await client.putdown();
                }
            }

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

            //! ----- RIVEDERE -----
            // If the agent is stucked, wait for 500ms and try again
            // if (!status_x && !status_y) {
            //     this.log('stucked ', countStacked);
            //     await timeout(500)
            //     if (countStacked <= 0) {
            //         throw 'stopped';
            //     } else {
            //         countStacked -= 1;
            //     }
            // } 
            // else if (this.me.x == x && this.me.y == y) {
            //     // this.log('target reached');
            // }
            iteration++;
        }
        return true;
    }
}

export default PddlMove;