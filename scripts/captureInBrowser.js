/**
 * Browser Console Event Capture Script
 *
 * INSTRUCTIONS:
 * 1. Open the Multi-Agent Demo page in your browser
 * 2. Open Browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. Run your analysis (the script will capture events automatically)
 * 6. When complete, run: downloadCapturedEvents()
 * 7. Save the JSON file
 */

(function() {
  window.capturedEvents = [];
  window.captureStartTime = Date.now();

  // Intercept fetch requests to the orchestrator API
  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);

    // Check if this is the orchestrator endpoint
    if (args[0] && args[0].includes('/api/agents/orchestrator')) {
      console.log('🎯 Intercepted orchestrator request - starting event capture...');

      // Clone the response so we can read it without consuming the original
      const clonedResponse = response.clone();

      // Read the SSE stream
      const reader = clonedResponse.body.getReader();
      const decoder = new TextDecoder();

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('✅ Event capture complete!');
              console.log(`📊 Captured ${window.capturedEvents.length} events`);
              console.log('💾 Run downloadCapturedEvents() to save the data');
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const eventData = JSON.parse(line.substring(6));
                  const captureTime = Date.now() - window.captureStartTime;

                  window.capturedEvents.push({
                    ...eventData,
                    captureTime,
                  });

                  console.log(`📥 Event ${window.capturedEvents.length}: ${eventData.type}`, eventData.data);
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error capturing events:', error);
        }
      })();
    }

    return response;
  };

  // Function to download captured events as JSON
  window.downloadCapturedEvents = function() {
    if (window.capturedEvents.length === 0) {
      console.warn('⚠️  No events captured yet. Run an analysis first!');
      return;
    }

    const dataStr = JSON.stringify(window.capturedEvents, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `captured-events-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Downloaded ${window.capturedEvents.length} events`);
  };

  // Function to reset capture
  window.resetCapture = function() {
    window.capturedEvents = [];
    window.captureStartTime = Date.now();
    console.log('🔄 Capture reset');
  };

  console.log('✅ Event capture script loaded!');
  console.log('');
  console.log('Commands:');
  console.log('  downloadCapturedEvents() - Download captured events as JSON');
  console.log('  resetCapture() - Clear captured events and start fresh');
  console.log('');
  console.log('Ready to capture! Run your analysis now...');
})();
