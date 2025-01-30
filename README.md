## Getting started

First of all, download the following repositories:
```bash
git clone https://github.com/unitn-ASA/Deliveroo.js
git clone https://github.com/bolognapietro/Project_AutonomousSoftwareAgents
```

## Run the code
Move to the Deliveroo.js folder and run the command 
```bash
cd Deliveroo.js
node index.js level_1
```
Now you can open a browser and view the game locally: http://localhost:8080

--- EDIT TOKEN PART ---
Finally, open another terminal and go to the Project_AutonomousSoftwareAgents folder and launch the main.js file. 

*Single agent scenario*
```bash
cd Project_AutonomousSoftwareAgents/Challenge_1
node main.js agent1 
```

*Multi-agent scenario*
```bash
cd Project_AutonomousSoftwareAgents/Challenge_1
node main.js agent1 master
```
```bash
cd Project_AutonomousSoftwareAgents/Challenge_1
node main.js agent2 slave
```
When you return to the web page you will notice that your agent will move autonomously (TODO)
