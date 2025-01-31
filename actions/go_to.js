import {client} from '../utils/client_config.js';
import Plans from '../utils/plan.js'; 
import Message from '../messages/message.js';

class GoTo extends Plans {
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
        // console.log('prova meArray nel costruttore di GoTo: ', this.me); // Aggiungi un log nel costruttore
        // console.log('prova meArray nel costruttore di GoTo: ', this.maps); // Aggiungi un log nel costruttore
    }

    static isApplicableTo ( move, x, y, id ) {
        return 'go_to' == move;
    }

    async execute( go_to, targetX, targetY ){
        // console.log("GoTo me: ", targetX, targetY);
        
        
        // Utilizza l'algoritmo BFS per trovare il percorso più breve verso la particella
        let completed = false
        var shortestPath = await this.findShortestPath(this.me.x, this.me.y, targetX, targetY, this.maps) 
        if (shortestPath !== null) {
            let path = []
            let actual = {x: this.me.x, y: this.me.y}
            for (let i = 0; i <= shortestPath.length; i++) {
                path.push([actual.x, actual.y])
                if (shortestPath[i] === 'up') {
                    actual.y += 1
                } else if (shortestPath[i] === 'down') {
                    actual.y -= 1
                } else if (shortestPath[i] === 'left') {
                    actual.x -= 1
                } else if (shortestPath[i] === 'right') {
                    actual.x += 1
                }
            }

            let parcelsOnPath = [];
            for (let par of this.me.getParticle()) {    // this.me.getParticle()
                for (let p of path) {
                    if (par[1].x == p.x && par[1].y == p.y && (p.x != x || p.y != y)) {
                        parcelsOnPath.push(par);
                    }
                }
            }

            let deliveryPointsOnPath = [];
            for (let del of this.maps.deliverPoints) {    // this.me.getParticle()
                for (let p of path) {
                    if (del.x == p[0] && del.y == p[1] && p != [del.x, del.y] && (del.x != this.me.x || del.y != this.me.y)) {
                        deliveryPointsOnPath.push(del);
                    }
                }
            }
            
            // Esegui le mosse per raggiungere la particella
            for (const move of shortestPath) {
                if (parcelsOnPath.some(par => { return par[1].x === this.me.x && par[1].y === this.me.y; })) {
                    await client.pickup();
                }
                if (deliveryPointsOnPath.some(del => { return del.x === Math.round(this.me.x) && del.y === Math.round(this.me.y); })) {
                    await client.putdown();
                }
                completed = await client.move(move);
            }

            // Se il percorso è stato completato con successo, restituisci true
            if (completed.x === targetX && completed.y === targetY) {
                completed = true
            }
            else {
                completed = false
            }

            if (!completed) {
                const agent_map = this.maps.getAgents();
                for (const agent of agent_map) {
                    // if the agent is 1 block away from me
                    if (agent.x === this.me.x + 1 || agent.x === this.me.x - 1 || agent.y === this.me.y + 1 || agent.y === this.me.y - 1) {
                        console.log('stucked with agent', agent.id);
                        // Coop with my friend in order to unstuck
                        if (agent.id === this.me.friendId) { // && !this.me.stuckedFriend 
                            // this.me.stuckedFriend = true
                            console.log('stucked with my Friend');
                            let msg = new Message();
                            msg.setHeader("STUCKED_TOGETHER");
                            // compute which agent is the one nearest to the center of the map
                            const map_center = { x: Math.floor(this.maps.width / 2), y: Math.floor(this.maps.height / 2) };
                            const distance_to_center = Math.abs(map_center.x - this.me.x) + Math.abs(map_center.y - this.me.y);
                            const distance_to_center_friend = Math.abs(map_center.x - agent.x) + Math.abs(map_center.y - agent.y);
                            let content = "";
                            if (distance_to_center > distance_to_center_friend) {
                                content = "You have to move away";
                            }
                            else {
                                content = "I have to move away";
                            }
                            // const content = { direction: this.maps.getAnotherDir(this.me.x, this.me.y), path: shortestPath }
                            msg.setContent(content);
                            msg.setSenderInfo({name: this.me.name, x: this.me.x, y: this.me.y, points: this.me.score, timestamp: Date.now()});
                            await client.say(this.me.friendId, msg);
                            break;
                        }
                        break;
                    }
                }
            }
            return true; // Restituisci true se il percorso è stato completato con successo
        } else {
            console.log("Impossibile trovare un percorso per raggiungere la particella.");
            return false; // Restituisci false se non è possibile trovare un percorso
        }
    }

    async findShortestPath(agentX, agentY, targetX, targetY, map) {
        // console.log("FindShortestPath maps: ", map);
        // console.log("FindShortestPath agentX: ", agentX, agentY, targetX, targetY);
        const queue = [{ x: agentX, y: agentY, moves: [] }];
        const visited = new Set();

        while (queue.length > 0) {
            const { x, y, moves } = queue.shift();

            if (x === targetX && y === targetY) {
                // Hai trovato la particella. Restituisci la sequenza di mosse.
                // console.log("Trovata particella: ", moves);
                return moves;
            }

            // Se la posizione è già stata visitata, passa alla prossima iterazione
            if (visited.has(`${x},${y}`)) continue;
            visited.add(`${x},${y}`);

            // Espandi i vicini validi
            const neighbors = this.getValidNeighbors(x, y, map);
            for (const neighbor of neighbors) {
                const { newX, newY, move } = neighbor;
                const newMoves = [...moves, move];
                queue.push({ x: newX, y: newY, moves: newMoves });
            }
        }

        // Se non è possibile raggiungere la particella, restituisci null
        return null;
    }

    getValidNeighbors(x, y, map) {
        const neighbors = [];
        const moves = [[0, 1, 'up'], [0, -1, 'down'], [-1, 0, 'left'], [1, 0, 'right']];

        for (const [dx, dy, move] of moves) {
            const newX = x + dx;
            const newY = y + dy;
            if (this.isValidPosition(newX, newY, map)) {
                neighbors.push({ newX, newY, move });
            }
        }

        return neighbors;
    }

    isValidPosition(myX, myY, map) {
        return myX >= 0 && myX < map.width && myY >= 0 && myY < map.height && map.map.some(row => row.x === myX && row.y === myY);
    }

}

export default GoTo;