import {client} from '../client_config.js';
import Plans from '../plan.js'; 
class GoTo extends Plans {
    constructor(parent, me, maps) {
        super(parent);
        this.me = me;
        this.maps = maps;
        console.log('prova meArray nel costruttore di GoTo: ', this.me); // Aggiungi un log nel costruttore
        console.log('prova meArray nel costruttore di GoTo: ', this.maps); // Aggiungi un log nel costruttore
    }

    static isApplicableTo ( move, x, y, id ) {
        return 'go_to' == move;
    }

    async execute( go_to, targetX, targetY ){
        console.log("GoTo me: ", targetX, targetY);
        // Utilizza l'algoritmo BFS per trovare il percorso più breve verso la particella
        var shortestPath = await this.findShortestPath(this.me.x, this.me.y, targetX, targetY, this.maps) 
        if (shortestPath !== null) {
            // Esegui le mosse per raggiungere la particella
            for (const move of shortestPath) {
                await client.move(move);
            }
            return true; // Restituisci true se il percorso è stato completato con successo
            count = 0; 
        } else {
            console.log("Impossibile trovare un percorso per raggiungere la particella.");
            return false; // Restituisci false se non è possibile trovare un percorso
        }
    }

    async findShortestPath(agentX, agentY, targetX, targetY, map) {
        console.log("FindShortestPath maps: ", map);
        console.log("FindShortestPath agentX: ", agentX, agentY, targetX, targetY);
        const queue = [{ x: agentX, y: agentY, moves: [] }];
        const visited = new Set();

        while (queue.length > 0) {
            const { x, y, moves } = queue.shift();

            if (x === targetX && y === targetY) {
                // Hai trovato la particella. Restituisci la sequenza di mosse.
                console.log("Trovata particella: ", moves);
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
        return myX >= 0 && myX < map.width && myY >= 0 && myY < map.height; // && map.coords.some(row => row.x === myX && row.y === myY);
    }
}

export default GoTo;