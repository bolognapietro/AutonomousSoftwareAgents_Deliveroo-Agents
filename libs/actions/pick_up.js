import {client} from '../utils/client_config.js';
import Plans from '../utils/plan.js';

/**
 * Class representing a plan to pick up an item.
 * @extends Plans
 */
class GoPickUp extends Plans {
    /**
     * Create a GoPickUp plan.
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
     * @returns {boolean} True if the plan is applicable, false otherwise.
     */
    static isApplicableTo ( move, x, y, id) {
        return 'go_pick_up' == move;
    }

    /**
     * Execute the plan to pick up an item.
     * @param {string} go_pick_up - The action to execute.
     * @param {number} x - The x-coordinate to move to.
     * @param {number} y - The y-coordinate to move to.
     * @returns {Promise<boolean>} True if the plan is successfully executed, false otherwise.
     * @throws Will throw an error if the plan is stopped.
     */
    async execute ( go_pick_up, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        // console.log("GoPickUp me: ", this.me);
        await this.subIntention(['go_to', x, y], this.me, this.maps); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.pickup() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        this.me.particelsCarried = true;
        // parcelCarriedByMe = true;
        this.me.previus_position = {x: x, y: y};
        return true; 
    }
}

export default GoPickUp;