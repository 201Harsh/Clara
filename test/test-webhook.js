// test-webhook.js
fetch("http://localhost:4000/api/webhooks/baas", { // Change 8080 to your backend port
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-mb-secret": "", 
  },
  body: JSON.stringify({
    event: "bot.completed",
    data: {
      bot_id: "fake-test-bot-123",
      transcription: "https://s3.amazonaws.com/fake-transcription-url.json",
      mp4: "https://s3.amazonaws.com/fake-video-url.mp4",
      extra: {
        googleEventId: "5ajo3jjes2anjoh32id6li3mns", // Example from your logs
        userId: "69ca10551be46a119fa13da1",          // Example from your logs
        meetingTitle: "Simulated Webhook Test"
      }
    }
  })
})
.then(res => res.json())
.then(data => console.log("Server Response:", data))
.catch(err => console.error("Error:", err));