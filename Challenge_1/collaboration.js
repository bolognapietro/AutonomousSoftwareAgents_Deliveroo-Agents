import Message from './message.js';
async function handleMsg(id, name, msg, reply, client, myAgent) {

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
                // console.log('new parcel collab', parcel.x, parcel.y, parcel.id);
                options.push(['go_pick_up', parcel[1], parcel[2], parcel[3]]);
            }
        }
        myAgent.push(options)
    }
}

export { handleMsg };