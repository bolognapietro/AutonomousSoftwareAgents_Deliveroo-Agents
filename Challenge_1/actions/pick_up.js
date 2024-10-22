import Plans from '../plan.js';
class GoPickUp extends Plans {
    
    static isApplicableTo ( move, x, y, id ) {
        return 'go_pick_up' == move;
    }

    async execute ( go_pick_up, x, y ) {
        // Check if the plan has been stopped.
        if (this.stopped) throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y]); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.pickup() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        myAgent.me.particelsCarried = true;
        // parcelCarriedByMe = true;
        previus_position = {x: x, y: y};
        return true; 
    }

}

export default GoPickUp;