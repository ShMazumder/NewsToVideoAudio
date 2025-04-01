const express = require('express');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const PORT = 3000;

app.use(express.static('output'));

app.get('/', async (req, res) => {
  try {
    const dates = await fs.readdir('./output');
    const latestDate = dates.sort().reverse()[0];
    
    const portals = await fs.readdir(`./output/${latestDate}`);
    
    const results = await Promise.all(portals.map(async portal => {
      const hasVideo = await fs.pathExists(`./output/${latestDate}/${portal}/recording.mp4`);
      const hasAudio = await fs.pathExists(`./output/${latestDate}/${portal}/headlines.mp3`);
      const headlines = await fs.readFile(`./output/${latestDate}/${portal}/headlines.txt`, 'utf8');
      
      return {
        portal,
        date: latestDate,
        videoUrl: hasVideo ? `/${latestDate}/${portal}/recording.mp4` : null,
        audioUrl: hasAudio ? `/${latestDate}/${portal}/headlines.mp3` : null,
        headlines: headlines.split('\n\n')
      };
    }));
    
    res.send(`
      <html>
      <head><title>News Recorder Results</title></head>
      <body>
        <h1>News Recorder Results - ${latestDate}</h1>
        ${results.map(result => `
          <div style="margin-bottom: 40px; border-bottom: 1px solid #ccc; padding-bottom: 20px;">
            <h2>${result.portal}</h2>
            ${result.videoUrl ? `
              <video width="640" controls>
                <source src="${result.videoUrl}" type="video/mp4">
                Your browser does not support the video tag.
              </video>
            ` : '<p>No video available</p>'}
            <h3>Headlines:</h3>
            <ul>
              ${result.headlines.map(h => `<li>${h}</li>`).join('')}
            </ul>
            ${result.audioUrl ? `
              <audio controls>
                <source src="${result.audioUrl}" type="audio/mp3">
                Your browser does not support the audio element.
              </audio>
            ` : '<p>No audio available</p>'}
          </div>
        `).join('')}
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('In GitHub Codespaces, click the "Ports" tab and open in browser');
});