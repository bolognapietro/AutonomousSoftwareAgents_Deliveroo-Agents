import {client} from '../utils/client_config.js';
import Plan from '../utils/plan.js';

/**
 * Class representing a plan to put down an item.
 * @extends Plan
 */
class GoPutDown extends Plan {
    /**
     * Create a GoPutDown plan.
     * @param {Object} parent - The parent object.
     * @param {Object} me - The agent executing the plan.
     * @param {Object} maps - The maps object.
     */
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
    }

    /**
     * Check if the plan is applicable to the given move.
     * @param {string} move - The move to check.
     * @param {number} x - The x-coordinate.
     * @param {number} y - The y-coordinate.
     * @param {string} id - The identifier.
     * @returns {boolean} - True if the plan is applicable, false otherwise.
     */
    static isApplicableTo(move, x, y, id) {
        return 'go_put_down' == move;
    }

    /**
     * Execute the plan to put down an item.
     * @param {string} put_down - The action to put down.
     * @param {number} x - The x-coordinate to move to.
     * @param {number} y - The y-coordinate to move to.
     * @returns {Promise<boolean>} - True if the plan is successfully executed, false otherwise.
     * @throws {Array<string>} - Throws 'stopped' if the plan is stopped.
     */
    async execute ( put_down, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) 
            throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y], this.me, this.maps); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.putdown() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        this.me.particelsCarried = false;
        
        return true; 
    }  
}

export default GoPutDown;