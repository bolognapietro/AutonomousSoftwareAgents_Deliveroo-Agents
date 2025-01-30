import Message from './message.js';
import {distance, stucked} from '../utils/support_fn.js';

async function handleMsg(id, name, msg, reply, maps, client, myAgent, agents_map) {

    if (msg.header == 'HANDSHAKE') {
        // If the agent is not the master and the message content is 'attacchiamo?'
        // then set the friend id and send a message to the master
        if (!myAgent.me.master && msg.content == 'attacchiamo?') {
            myAgent.me.setFriendId(id);
            let msg = new Message();
            msg.setHeader("HANDSHAKE");
            msg.setContent("attacchiamo!");
            msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            await client.say(id, msg, reply);
            // msg.setHeader("CURRENT_INTENTION");
            // msg.setContent(myAgent.me.currentIntention)
            // msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            // await client.say(id, msg)
        }
        // If the agent is the master and the message content is 'attacchiamo!'
        // then set the friend id and send a message
        if (myAgent.me.master && msg.content == 'attacchiamo!') {
            myAgent.me.setFriendId(id);
            console.log('\n-------- HANDSHAKE COMPLETED --------');
            // msg.setHeader("CURRENT_INTENTION");
            // msg.setContent(myAgent.me.currentIntention)
            // msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            // await client.say(id, msg, reply)
        }
    }

    if (msg.header === 'INFO_PARCELS') {
        // see content and update the parcels if not already present
        let new_parcels, last_intention = msg.content; // particels seen by the teammate
        if (last_intention === null) {
            const seenParcels = myAgent.get_parcerls_to_pickup();
            const options = [];
            // Check if the parcel is not carried by any agent and not already seen by me
            
            for (const parcel of new_parcels) {
                if (!parcel.carriedBy && !seenParcels.has(parcel.id) && parcel.rewards > 4) {
                    options.push(['go_pick_up', parcel[1], parcel[2], parcel[3]]);
                }
            }
            if ( options ) {
                options.sort((a, b) => {
                    let distanceA = distance({ x: a[1], y: a[2] }, myAgent.me);
                    let distanceB = distance({ x: b[1], y: b[2] }, myAgent.me);
                    return distanceA - distanceB;
                });
                console.log('---------------INFO----------\n', options[0]);
                myAgent.push(options[0]);
            }
            // Sort the options based on the distance from the agent
        }
    }

    if (msg.header === 'INFO_AGENTS') {
        let perceived_agents = msg.content;
        for (const agent of perceived_agents) {
            if (agent.id !== myAgent.me.id) {
                // Update the enemy agent information received 
                // from the message content of the teammate
                agents_map.set(agent.id, agent);
                myAgent.maps.setAgent(agent.id, agent.x, agent.y, Date.now())
            }
        }
    }

    if (msg.header === "STUCKED_TOGETHER") {
        myAgent.me.stuckedFriend = true;
        const friendDirection = msg.content.direction;
        const friendPath = msg.content.path;
        // const possibleDirection = myAgent.maps.getPossibleDirection(myAgent.me.x, myAgent.me.y);

        // if (stucked(possibleDirection, friendDirection)) {
           
        // }
    }
}

export { handleMsg };