/**
 * ReadableStream Polyfill for Render Hosting
 * 
 * Adds a minimal ReadableStream implementation to the global scope
 * to prevent the error in undici/fetch on Render hosting.
 */

// Only add polyfill if ReadableStream isn't already defined
if (typeof global.ReadableStream === 'undefined') {
    console.log('Adding ReadableStream polyfill for Render compatibility');
    
    // Simple minimal implementation of ReadableStream
    global.ReadableStream = class ReadableStream {
        constructor(underlyingSource, strategy) {
            this._source = underlyingSource;
            this._strategy = strategy;
        }
        
        getReader() {
            return {
                read: async () => ({ done: true, value: undefined }),
                releaseLock: () => {}
            };
        }
        
        cancel() {
            return Promise.resolve();
        }
    };
    
    // Add required static methods
    global.ReadableStream.from = (iterable) => {
        return new global.ReadableStream({
            start(controller) {
                Promise.resolve().then(async () => {
                    try {
                        for await (const chunk of iterable) {
                            controller.enqueue(chunk);
                        }
                        controller.close();
                    } catch (e) {
                        controller.error(e);
                    }
                });
            }
        });
    };
}