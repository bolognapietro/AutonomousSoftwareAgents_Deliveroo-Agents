# **Autonomous Software Agents**
<div>
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black" alt="JavaScript"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/PDDL-005F8F?style=flat&logo=prolog&logoColor=white" alt="PDDL"/>
    <img src="https://img.shields.io/badge/WebSockets-009688?style=flat&logo=websocket&logoColor=white" alt="WebSockets"/>
</div>

# Table of contents
-   [Project Overview](#project-overview)
-   [Project structure](#project-structure)
-   [Getting Started](#getting-started)
    - [1. Download the Required Repositories](#1-download-the-required-repositories)
    - [2a. Running the Code Automatically](#2a-running-the-code-automatically)
    - [2b. Running the Code Manually](#2b-running-the-code-manually)
-   [Contacts](#contacts)

# Project Overview

This repository contains the implementation of autonomous agents designed to play the Deliveroo game. The objective of the game is to earn points by collecting and delivering parcels to designated delivery points. To achieve this, we have implemented a Belief-Desire-Intention (BDI) architecture, enabling the agent to perceive the environment, establish goals, select the best plans, and execute actions. This approach allows the agent to continuously revise and optimize its strategies for improved performance.

The project is structured into two main parts:

- **Single Agent**: A single autonomous agent is developed, capable of interpreting and processing information from its environment. The agent perceives the environment, updates its beliefs, forms intentions, and takes appropriate actions.
- **Multi-Agent**: The system is extended to include a second autonomous agent, allowing for information sharing and coordinated decision-making. The agents communicate to exchange environmental data and mental states, collaborating effectively to develop optimal plans and execute tasks efficiently.

Finally, we evaluate the performance of our agents through a series of simulations across different game levels, each presenting unique challenges and characteristics. The evaluation results can be found in ```documentation/results.md```.

# Project structure

```text
.
├── assets          # Images
├── documentation   # Report, Presentation and Results
├── libs            # Source files
    ├── actions     # Action implementations defining agent behaviors
    ├── intentions  # Intentions representing agent goals and plans
    ├── messages    # Communication system for inter-agent messaging
    └── utils       # Utility functions and helper modules
```

# Getting Started

### **1. Download the Required Repositories**
First, clone the necessary repositories:

```bash
git clone https://github.com/unitn-ASA/Deliveroo.js
git clone https://github.com/bolognapietro/AutonomousSoftwareAgents_Deliveroo-Agents
```

### **2a. Running the Code Automatically**

#### **Start the Simulation**
Navigate to the `Deliveroo.js` folder and launch the game:

```bash
cd Deliveroo.js
node index.js level_1
```

Now, open a browser and go to [http://localhost:8080](http://localhost:8080) to view the game.

#### **Run the Agent**
Move to the `AutonomousSoftwareAgents_Deliveroo-Agents` folder:

```bash
cd ../AutonomousSoftwareAgents_Deliveroo-Agents
```

- **Single Agent Scenario:**  
  Open a terminal and run:
  
  ```bash
  ./single_agent.sh
  ```
  
- **Multi-Agent Scenario:**  
  1. Open a terminal and run:
     
     ```bash
     ./multi_agent.sh
     ```
  2. The agents will start automatically and interact with the environment.

Once running, return to the browser, and you will see them move autonomously.

### **2b. Running the Code Manually**

#### **Start the Simulation**
Navigate to the `Deliveroo.js` folder and launch the game:

```bash
cd Deliveroo.js
node index.js level_1
```

Then, open a browser and go to [http://localhost:8080](http://localhost:8080).

#### **Run the Agent Manually**

- **Single Agent Scenario:**  
  Open a terminal and run:
  
  ```bash
  cd AutonomousSoftwareAgents_Deliveroo-Agents
  node main.js agent1
  ```

- **Multi-Agent Scenario:**  
  1. Open a terminal and start the slave agent:
     
     ```bash
     cd AutonomousSoftwareAgents_Deliveroo-Agents
     node main.js agent2 slave
     ```
  
  2. Open another terminal and start the master agent:
     
     ```bash
     cd AutonomousSoftwareAgents_Deliveroo-Agents
     node main.js agent1 master
     ```

Once running, return to the browser, and you will see them move autonomously.

# Contacts
Marina Segala - [marina.segala@studenti.unitn.it](mailto:marina.segala@studenti.unitn.it)

Pietro Bologna - [pietro.bologna@studenti.unitn.it](mailto:pietro.bologna@studenti.unitn.it)

