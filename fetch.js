const https = require('https');
https.get('https://raw.githubusercontent.com/452369/Ai-Interviewer/main/src/main/java/com/ag/service/InterviewService.java', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
});
