import {client} from '../utils/client_config.js';
import Plans from '../utils/plan.js'; 
import Message from '../messages/message.js';
import { readFile } from '../utils/support_fn.js';
import { PddlProblem, onlineSolver } from "@unitn-asa/pddl-client";

let domain = await readFile('./actions/domain.pddl');

class PddlMove extends Plans {
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
        // console.log('prova meArray nel costruttore di GoTo: ', this.me); // Aggiungi un log nel costruttore
    }

    static isApplicableTo(move, x, y, id) {
        return 'go_to' == move;
    }

    async execute(go_to, x, y) {
        // Define the PDDL goal
        let goal = 'at t' + x + '_' + y;

        this.maps.update_beliefset();

        // Create the PDDL problem
        var pddlProblem = new PddlProblem(
            'deliveroo',
            this.maps.agent_beliefset.objects.join(' '),
            this.maps.agent_beliefset.toPddlString() + ' ' + '(at t' + this.me.x + '_' + this.me.y + ')',
            goal
        );

        let problem = pddlProblem.toPddlString();

        // Get the plan from the online solver
        var plan = await onlineSolver(domain, problem);

        // Parse the plan to get the path
        let path = []
        plan.forEach(action => {
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
        let deliveriesOnPath = [];
        let parcelsOnPath = [];

        for (let del of this.maps.deliverPoints) {
            for (let p of path) {
                if (del.x == p.x && del.y == p.y) {
                    deliveriesOnPath.push(del);
                }
            }
        }

        for (let par of this.me.map_particles) {
            for (let p of path) {
                if (par.x == p.x && par.y == p.y && (p.x != x && p.y != y)) {
                    parcelsOnPath.push(par);
                }
            }
        }

        // Start moving the agent to the target position
        while (this.me.x != x || this.me.y != y) {

            // Check if the agent is on a delivery point or a parcel point
            if (deliveriesOnPath.some(del => {
                del.x === this.me.x && del.y === this.me.y
            })) {
                if (this.stopped) throw ['stopped']; // if stopped then quit
                await client.putdown()
                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            if (parcelsOnPath.some(par => {
                par.x === this.me.x && par.y === this.me.y
            })) {

                if (this.stopped) throw ['stopped']; // if stopped then quit
                // Pickup the parcel
                await client.pickup();
                if (this.stopped) throw ['stopped']; // if stopped then quit

                // Add parcels to MyData.parcelsInMind if they match the current position
                // parcelsOnPath.forEach(par => {
                //     if (par.x === this.me.x && par.y === this.me.y) {
                //         MyData.parcelsInMind.push(par.id);
                //     }
                // });

                if (this.stopped) throw ['stopped']; // if stopped then quit
            }

            // Get the next coordinate to move to
            let coordinate = path.shift()
            let status_x = false;
            let status_y = false;

            if (coordinate.x == this.me.x && coordinate.y == this.me.y) {
                continue;
            }

            if (coordinate.x > this.me.x)
                status_x = await client.move('right')
            else if (coordinate.x < this.me.x)
                status_x = await client.move('left')

            if (status_x) {
                this.me.x = status_x.x;
                this.me.y = status_x.y;
            }

            if (this.stopped) throw ['stopped']; // if stopped then quit

            if (coordinate.y > this.me.y)
                status_y = await client.move('up')
            else if (coordinate.y < this.me.y)
                status_y = await client.move('down')

            if (status_y) {
                this.me.x = status_y.x;
                this.me.y = status_y.y;
            }

            // If the agent is stucked, wait for 500ms and try again
            if (!status_x && !status_y) {
                this.log('stucked ', countStacked);
                await timeout(500)
                if (countStacked <= 0) {
                    throw 'stopped';
                } else {
                    countStacked -= 1;
                }

            } 
            // else if (this.me.x == x && this.me.y == y) {
            //     // this.log('target reached');
            // }
        }
        return true;
    }
}

export default PddlMove;