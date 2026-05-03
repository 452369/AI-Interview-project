const fs = require('fs');
const https = require('https');
https.get('https://raw.githubusercontent.com/452369/Ai-Interviewer/main/src/main/java/com/ag/service/InterviewService.java', (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => {
    fs.writeFileSync('./service.java', data);
    console.log('done');
  });
});
