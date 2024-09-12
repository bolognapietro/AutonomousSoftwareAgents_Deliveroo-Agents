import { DeliverooApi } from "@unitn-asa/deliveroo-js-client";

export const client = new DeliverooApi(
    'http://localhost:8080', //'http://10.196.182.49:8080',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM3NDg4ODI1NTQ3IiwibmFtZSI6Im1hcmluYSIsImlhdCI6MTcyMjI0MTU5MH0.nXMGK0Av2lW5LodZDD9C2OUj3LkLrcfqvhgB1H9BonM'
    // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUzODE1MGExNjE0IiwibmFtZSI6InBpZXRybyIsImlhdCI6MTcxMTU1NjQ0MH0.HGuarXnbopYzShTuIwxnA_W4iSDW3U2sWIc8WtPE1aU'
)
