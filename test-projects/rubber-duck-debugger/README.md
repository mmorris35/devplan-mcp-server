# rubber-duck-debugger

> A CLI rubber duck debugging companion that responds with sarcastic quacks and unhelpful advice.

## Installation

```bash
npm install -g rubber-duck-debugger
```

## Usage

### Start a debugging session

```bash
rubber-duck-debugger
# or
rdd
```

### Quick commands

```bash
# Get a random quack
rdd quack

# Get some "wisdom"
rdd wisdom

# Show help
rdd --help
```

## What to expect

The duck will:
- Listen to your problems (reluctantly)
- Respond with sarcastic quacks
- Get increasingly annoyed the longer you talk
- Offer genuinely unhelpful advice
- Rate your debugging skills (harshly)

## Example session

```
🦆 *stares at you judgmentally*
   I'm listening.

You: My function returns undefined

🦆 Quack. Have you tried actually returning something?
   💡 Have you tried turning it off and on again?
   Mood: [🤔 Mildly Interested]

You: I did return something!

🦆 QUACK. That's what they all say.
   Mood: [🙄 Questioning Your Life Choices]

You: quit

╔══════════════════════════════════════════════════════════════╗
║                   🦆 SESSION SUMMARY 🦆                       ║
╠══════════════════════════════════════════════════════════════╣

  ⏱️  Duration: 45 seconds. Speed run? Or gave up?

  💬 Messages: 2
     Average length: 25 characters

  🦆 Mood Journey: 😌 → 🤔 → 🙄

  🎯 Debugging Skill Rating: 4/10
     "Struggling"

  🦆 The duck suggests reviewing CS fundamentals.

╚══════════════════════════════════════════════════════════════╝
```

## License

MIT - Because even ducks believe in open source.
