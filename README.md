# Emitron

![Biome Check](https://img.shields.io/badge/biome-Check-60a5fa?style=for-the-badge&logo=biome&color=60a5fa)
![npm version](https://img.shields.io/npm/v/emitron?style=for-the-badge)
![npm downloads](https://img.shields.io/npm/dm/emitron?style=for-the-badge)
![License](https://img.shields.io/npm/l/emitron?style=for-the-badge)

A modern, type-safe event emitter designed for both Node.js and browser environments. Built with ESM and cutting-edge
Node.js features, Emitron combines the best practices from EventEmitter3, Emittery, and Mitt while focusing on modern
TypeScript development.

## Features

### Core Features

- **Type-Safe**: Built from the ground up with TypeScript for complete type safety
- **Zero Dependencies**: Standalone package with no external dependencies
- **Universal Compatibility**: Works seamlessly in both Node.js and browser environments
- **Memory Efficient**: Optimized memory usage inspired by Mitt's lightweight approach

### Technical Features

- **Pure ESM Architecture**:
    - Modern ES Modules only
    - No CommonJS support (forward-thinking approach)
    - Optimized for modern bundlers

- **Dual Event Modes**:
    - Synchronous event emission for standard use cases
    - Asynchronous event emission with Promise support
    - Native async/await support

- **Advanced Patterns**:
    - Observable pattern support compatible with Rx.js
    - Wildcard event handling
    - Automatic memory management
    - Built-in debugging capabilities

## Installation

```bash
# Using npm
npm install emitron

# Using yarn
yarn add emitron

# Using pnpm
pnpm add emitron
```

## Quick Start

```typescript
import {Emitron} from 'emitron';

// Define your events interface
interface MyEvents {
    userJoined: { userId: string; username: string };
    messageReceived: { content: string; timestamp: number };
    userLeft: { userId: string };
}

// Create a type-safe event emitter
const events = new Emitron<MyEvents>();

// Register event handlers
events.on('userJoined', ({userId, username}) => {
    console.log(`${username} (${userId}) joined the chat`);
});

// Emit events
events.emit('userJoined', {
    userId: '123',
    username: 'JohnDoe'
});

// Async event handling
async function handleMessageAsync() {
    events.onAsync('messageReceived', async ({content, timestamp}) => {
        await processMessage(content);
        console.log(`Message processed at ${timestamp}`);
    });
}
```

## Advanced Usage

### Wildcard Event Handling

```typescript
// Listen to all events
events.onAny((eventName, eventData) => {
    console.log(`Event ${eventName} was triggered with:`, eventData);
});
```

### Async Event Iteration

```typescript
// Create an async iterator for specific events
for await (const message of events.events('messageReceived')) {
    console.log('New message:', message.content);
}
```

### One-time Events

```typescript
// Listen for an event only once
events.once('userJoined', ({username}) => {
    console.log(`Welcome ${username}!`);
});
```

## Why Emitron?

### Problems We Solve

- **Type Safety**: Full TypeScript integration with strict typing
- **Modern Development**: Pure ESM package for modern JavaScript ecosystem
- **Performance**: Optimized for high-frequency event handling
- **Memory Management**: Efficient memory usage with automatic cleanup
- **Debugging**: Enhanced debugging capabilities for complex event flows

### Comparison with Alternatives

| Feature         | Emitron | EventEmitter3 | Mitt     | Emittery |
|-----------------|---------|---------------|----------|----------|
| Type Safety     | ✅       | ⚠️            | ✅        | ✅        |
| Pure ESM        | ✅       | ❌             | ❌        | ⚠️       |
| Async Support   | ✅       | ❌             | ❌        | ✅        |
| Size            | Light   | Light         | Smallest | Medium   |
| Wildcard Events | ✅       | ❌             | ✅        | ✅        |

## Contributing

We welcome contributions! Please see our [Contributing Guide](.github/CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Emitron is released under the [MIT License](LICENSE).

## Acknowledgments

Built on the shoulders of giants:

- EventEmitter3's performance-focused approach
- Emittery's innovative async patterns
- Mitt's elegant simplicity

---

Created with ❤️ by the Emitron Contributors