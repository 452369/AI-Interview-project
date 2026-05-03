const fs = require('fs');
const https = require('https');
https.get('https://raw.githubusercontent.com/452369/Ai-Interviewer/main/src/main/java/com/ag/entity/InterviewQuestion.java', (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => console.log(data));
});
