# SignRPG

## Project Description
SignRPG is a 2D fantasy RPG game where you play as a wizard, casting spells and navigating the world through ASL. The game utilizes your laptop's built-in webcam to track your hands and uses AI to predict the ASL letter. These predictions are fed into the fantasy game to not only control your character movement, but also cast spells against a horde of enemies!

This game is designed to encourage the average person to learn ASL through an interactive and fun environment, aiming to lower the barrier to entry.
## Getting Started
To get started with SignRPG, clone this repository and follow the installation instructions below:

```
git clone https://github.com/jasonkwok475/SignRPG.git
```

Install the required packages and start the virtual environment:
```
pip install uv
uv venv
source .venv/Scripts/activate
uv sync
```

Build the front end:
```
cd game
npm install
npm run build
```

And run the app!
```
cd ..
uv run main.py
```

Now, you can visit the site at http://127.0.0.1:8000/ 


## Demo

https://youtu.be/bsj90AtmSTg

## Devpost

https://devpost.com/software/signrpg