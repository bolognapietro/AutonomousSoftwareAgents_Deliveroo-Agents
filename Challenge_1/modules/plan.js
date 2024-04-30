import { Intention } from "/home/pietro/Desktop/UniTn/4_anno/Secondo_semestre/Autonomous Software Agents/Lab/Project_AutonomousSoftwareAgents/Challenge_1/modules/intention.js";

/**
 *! PLAN LIBRARY
 */

export const planLibrary = [];

export class Plan {
    #stopped = false; // private field to track whether the plan has been stopped.
    
    stop() {
        // this.log('stop plan'); 
        this.#stopped = true; // set the stopped status to true.
        // Iterate over all sub-intentions.
        for (const i of this.#sub_intentions) { 
            i.stop(); // stop each sub-intention.
        }
    }

    // Getter method for the stopped status.
    get stopped() {
        return this.#stopped; 
    }

    #parent; // private field to hold a reference to the parent object that might be controlling or monitoring this plan.

    // Initialize the plan with a reference to the parent object.
    constructor(parent) {
        this.#parent = parent; 
    }

    log(...args) {
        // Use the parent's log method if available.
        if (this.#parent && this.#parent.log) {
            this.#parent.log('\t', ...args); 
        } else {
            console.log(...args); // default to console.log if no parent log method is available.
        }
    }

    #sub_intentions = []; // private field to store an array of sub-intentions.

    async subIntention(predicate) {
        const sub_intention = new Intention(this, predicate); // create a new sub-intention.
        this.#sub_intentions.push(sub_intention); // add the new sub-intention to the array.
        return await sub_intention.achieve(); // attempt to achieve the sub-intention and return the result.
    }
}

export class GoPickUp extends Plan {
    static isApplicableTo ( go_pick_up, x, y, id ) {
        return go_pick_up == 'go_pick_up';
    }

    async execute ( go_pick_up, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) 
            throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y]); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.pickup() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        return true; 
    }

}

export class BlindMove extends Plan {

    static isApplicableTo ( go_to, x, y ) {
        return go_to == 'go_to';
    }

    async execute ( go_to, x, y ) {

        // Continue the loop until the coordinates of 'me' match the target coordinates (x, y)
        while (me.x != x || me.y != y) {            
            // If the plan has been stopped, exit the loop by throwing an exception
            if (this.stopped) throw ['stopped']; 
            
            let status_x = false;
            let status_y = false;
            
            // Attempt to move horizontally towards the target x-coordinate
            if (x > me.x)
                status_x = await client.move('right') // if the target x-coordinate is greater, move right
            else if (x < me.x)
                status_x = await client.move('left') // if the target x-coordinate is less, move left
        
            // Update the coordinates of 'me' if the move was successful
            if (status_x) {
                me.x = status_x.x;
                me.y = status_x.y;
            }
        
            // Check again if the plan has been stopped, and exit if true.
            if (this.stopped) throw ['stopped']; 
        
            // Attempt to move vertically towards the target y-coordinate
            if (y > me.y)
                status_y = await client.move('up') // if the target y-coordinate is greater, move up
            else if (y < me.y)
                status_y = await client.move('down') // if the target y-coordinate is less, move down
        
            // Update the coordinates of 'me' if the move was successful
            if (status_y) {
                me.x = status_y.x;
                me.y = status_y.y;
            }
            
            // If neither horizontal nor vertical moves were successful, log 'stucked' and throw an exception
            if (!status_x && !status_y) {
                this.log('stucked');
                throw 'stucked';
            // If the target coordinates are reached, optionally log 'target reached'
            } else if (me.x == x && me.y == y) {
                this.log('target reached');
            }
        }

        return true;

    }
}