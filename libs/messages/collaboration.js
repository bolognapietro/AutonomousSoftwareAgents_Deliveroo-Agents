import Message from './message.js';
import {distance, simpleMoveToRandomPos} from '../utils/support_fn.js';

/**
 * Handles incoming messages and performs actions based on the message header and content.
 *
 * @param {string} id - The ID of the sender.
 * @param {string} name - The name of the sender.
 * @param {Object} msg - The message object containing header and content.
 * @param {Function} reply - The function to reply to the message.
 * @param {Object} maps - The maps object for the agent.
 * @param {Object} client - The client object to communicate with other agents.
 * @param {Object} myAgent - The agent object representing the current agent.
 * @param {Map} agents_map - A map of perceived agents.
 * @returns {Promise<void>} - A promise that resolves when the message handling is complete.
 */
async function handleMsg(id, name, msg, reply, maps, client, myAgent, agents_map) {

    if (msg.header == 'HANDSHAKE') {
        // If the agent is the SLAVE and the message content is 'attacchiamo?' then set the friend_id and send a message to the MASTER
        if (!myAgent.me.master && msg.content == 'attacchiamo?') {
            myAgent.me.setFriendId(id);
            let msg = new Message();
            msg.setHeader("HANDSHAKE");
            msg.setContent("attacchiamo!");
            msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            await client.say(id, msg, reply);
        }
        // If the agent is the MASTER and the message content is 'attacchiamo!' then set the friend_id
        if (myAgent.me.master && msg.content == 'attacchiamo!') {
            myAgent.me.setFriendId(id);
            console.log('\n-------- HANDSHAKE COMPLETED--------');
            console.log(msg.senderInfo.name + ' is now my friend!');
            console.log('-----------------------------------');
        }
    }

    if (msg.header === 'INFO_PARCELS') {
        let new_parcels = msg.content;
        if (msg.senderInfo.name != myAgent.me.name && !myAgent.me.notMoving) {
            const seenParcels = myAgent.get_parcerls_to_pickup();
            
            // order new_parcels by distance from agent
            new_parcels.sort((a, b) => distance(myAgent.me, a) - distance(myAgent.me, b)); 

            for (const parcel of new_parcels) {
                if (!parcel.carriedBy && !seenParcels.has(parcel.id)) {
                    if ( parcel.rewards > 4 || distance({ x: parcel[1], y: parcel[2] }, myAgent.me) < 20){
                        myAgent.push(['go_to', parcel[1], parcel[2], parcel[3]]);
                        break;
                    }
                }
            }
        }
    }

    if (msg.header === 'INFO_AGENTS') {
        let perceived_agents = msg.content;
        for (const agent of perceived_agents) {
            if (agent.id !== myAgent.me.id) {
                agents_map.set(agent.id, agent);
                myAgent.maps.setAgent(agent.id, agent.x, agent.y, Date.now())
            }
        }
    }

    if (msg.header === "STUCKED_TOGETHER") {
        if (msg.content == "You have to move away") {
            await client.putdown()
            await new Promise(r => setTimeout(r, 1000));
            myAgent.me.particelsCarried = false
            let predicate = simpleMoveToRandomPos(myAgent);
            myAgent.push(predicate);
        }
        else{
            let msg = new Message();
            msg.setHeader("STUCKED_TOGETHER");
            msg.setContent("You have to move away");
            msg.setSenderInfo({name: myAgent.me.name, x: myAgent.me.x, y: myAgent.me.y, points: myAgent.me.score, timestamp: Date.now()});
            await client.say(myAgent.me.friendId, msg);
        }
    }
}

export { handleMsg };