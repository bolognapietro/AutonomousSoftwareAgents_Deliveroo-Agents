import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

const configs = {
    host: "http://localhost:8080",
    token: {
        'agent1': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE4MWIzMTBmMmVjIiwibmFtZSI6ImFnZW50MSIsImlhdCI6MTczMTM5ODE4Mn0.RB_QTliRaYdBEpm-qx0xfMToynY-oYxfR9dlpmH0rH0',
        'agent2': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjgxYjMxMGYyZWM1IiwibmFtZSI6ImFnZW50MiIsImlhdCI6MTczMTM5ODQ0MH0.89CKOv-SME9bzJjD5SryxnkNII2g7YMzUDE8xlJQ2-A'
    }
}

const name = process.argv[2]; // agent1 or agent2
const token = configs.token[name]; // token for the agent



export const client = new DeliverooApi(
    configs.host , //'http://10.196.182.49:8080',
    token 
)

// 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzODE1MGExNjE0IiwibmFtZSI6InBpZXRybyIsImlhdCI6MTcxMTU1NjQ0MH0.HGuarXnbopYzShTuIwxnA_W4iSDW3U2sWIc8WtPE1aU'
// 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM3NDg4ODI1NTQ3IiwibmFtZSI6Im1hcmluYSIsImlhdCI6MTcyMjI0MTU5MH0.nXMGK0Av2lW5LodZDD9C2OUj3LkLrcfqvhgB1H9BonM', 