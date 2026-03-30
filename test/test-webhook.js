fetch("http://localhost:4000/webhooks/baas", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-mb-secret": "5c2695dda18e3a436412bde0a4d80db2fadafc2aff3c7378eb0d6f3289f", 
  },
  body: JSON.stringify({
    event: "bot.completed",
    data: {
      bot_id: "fake-test-bot-123",
      transcription: "https://s3.amazonaws.com/fake-transcription-url.json",
      mp4: "https://s3.amazonaws.com/fake-video-url.mp4",
      extra: {
        googleEventId: "5ajo3jjes2anjoh32id6li3mns", 
        userId: "69c76fe6c4b38bea01f5e241",        
        meetingTitle: "Simulated Webhook Test"
      }
    }
  })
})
.then(res => res.json())
.then(data => console.log("Server Response:", data))
.catch(err => console.error("Error:", err));