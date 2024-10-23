import Plan from '../plan.js';
class GoPutDown extends Plan {

    static isApplicableTo ( move, x, y, id  ) {
        return 'go_put_down' == move;
    }

    async execute ( x, y, me, maps ) {
        // Check if the plan has been stopped.
        if (this.stopped) 
            throw ['stopped']; // if yes, throw an exception to halt execution.
        // Asynchronously execute a sub-intention to move to the coordinates (x, y).
        await this.subIntention(['go_to', x, y, me, maps]); 

        // Check if the plan has been stopped after moving.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        // Call the `pickup` method on the `client` object to perform the pickup action.
        await client.putdown() 

        // Check once more if the plan has been stopped after picking up.
        if (this.stopped) 
            throw ['stopped']; // If yes, throw an exception to halt execution.
        
        // If all actions are completed without the plan being stopped, return true indicating success.
        myAgent.me.particelsCarried = false;
        // parcelCarriedByMe = false;
        return true; 
    }

}

export default GoPutDown;