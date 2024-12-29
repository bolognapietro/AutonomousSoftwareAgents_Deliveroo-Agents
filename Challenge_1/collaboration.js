import Message from './message.js';
import {distance} from './support_fn.js';

async function handleMsg(id, name, msg, reply, maps, client, myAgent, position_agents) {

    if (msg.header == 'HANDSHAKE') {
        if (!myAgent.me.master && msg.content == 'attacchiamo?') {
            myAgent.me.setFriendId(id);
            let msg = new Message();
            msg.setHeader("HANDSHAKE");
            msg.setContent("attacchiamo!");
            await client.say(id, msg, reply);
            msg.setHeader("CURRENT_INTENTION");
            msg.setContent(myAgent.me.currentIntention)
            await client.say(id, msg)
        }
        if (myAgent.me.master && msg.content == 'attacchiamo!') {
            myAgent.me.setFriendId(id);
            console.log('Handshake completed');
            let msg = new Message();
            msg.setHeader("START_JOB");
            msg.setContent({ x: myAgent.me.x, y: myAgent.me.y });
            await client.say(id, msg, reply);
            msg.setHeader("CURRENT_INTENTION");
            msg.setContent(myAgent.me.currentIntention)
            await client.say(id, msg, reply)
        }
    }

    if (msg.header === 'INFO_PARCELS') {
        // see content and update the parcels if not already present
        const seenParcels = myAgent.get_parcerls_to_pickup();
        let new_parcels = msg.content;
        const options = [];
        for (const parcel of new_parcels) {
            if (!parcel.carriedBy && !seenParcels.has(parcel.id)) {
                options.push(['go_pick_up', parcel[1], parcel[2], parcel[3]]);
            }
        }
        if ( options ) {
            options.sort((a, b) => {
                let distanceA = distance({ x: a[1], y: a[2] }, myAgent.me);
                let distanceB = distance({ x: b[1], y: b[2] }, myAgent.me);
                return distanceA - distanceB;
            });
            
            myAgent.push(options);
        }
    }

    if (msg.header === 'INFO_AGENTS') {
        let perceived_agents = msg.content;

        for (const agent of perceived_agents) {
            if (agent.id !== myAgent.me.id) {
                position_agents.set(agent.id, agent);
                maps.setAgent(agent.id, agent.x, agent.y, Date.now())
            }
        }
    }
}

export { handleMsg };