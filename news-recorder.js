import puppeteer from 'puppeteer';
import { PuppeteerScreenRecorder } from 'puppeteer-screen-recorder';
import cron from 'node-cron';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { textToSpeech } from './tts-service.js';
import { combineVideoAudio } from './video-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const config = {
	portals: [
		{
			name: 'Prothomalo',
			url: 'https://www.prothomalo.com/',
			language: 'bn'
		},
		{
			name: 'Jugantor',
			url: 'https://www.jugantor.com/',
			language: 'bn'
		},
		{
			name: 'Thedailystar',
			url: 'https://www.thedailystar.net/',
			language: 'en'
		}
	],
	recording: {
		fps: 15,
		viewport: { width: 1280, height: 800 },
		minDuration: 10000 // Minimum 10 seconds
	}
};

const recorderOptions = {
	fps: config.recording.fps,
	videoFrame: config.recording.viewport,
	videoCrf: 28,
	videoCodec: 'libx264',
	videoPreset: 'ultrafast',
	autopad: { color: '#000000' }
};

async function capturePortal(portal, dateStr) {
	const outputDir = path.join(__dirname, 'output', dateStr, portal.name);
	await fs.mkdir(outputDir, { recursive: true });

	console.log(`🌐 Starting processing: ${portal.name}`);

	const browser = await puppeteer.launch({
		headless: 'new',
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-dev-shm-usage'
		]
	});

	try {
		const page = await browser.newPage();
		await page.setViewport(config.recording.viewport);

		// Start recording
		const recorder = new PuppeteerScreenRecorder(page, recorderOptions);
		const videoPath = path.join(outputDir, 'recording.mp4');
		await recorder.start(videoPath);

		// Navigate to page with error handling
		try {
			await page.goto(portal.url, {
				waitUntil: 'domcontentloaded',
				timeout: 45000
			});
		} catch (error) {
			console.error(`🚨 Navigation failed for ${portal.name}:`, error.message);
			await recorder.stop();
			throw error;
		}

		// Extract headlines with better query selectors for Bangla sites
		const headlines = await page.evaluate(() => {
			const elements = [
				...document.querySelectorAll('h1, h2, h3, .headline, .title, .news-title')
			];
			return elements
				.map(el => el.innerText.trim())
				.filter(text => text.length > 5 && text.length < 200);
		});

		if (headlines.length === 0) {
			console.warn(`⚠️ No headlines found for ${portal.name}`);
		}

		// Save headlines
		await fs.writeFile(
			path.join(outputDir, 'headlines.txt'),
			headlines.join('\n\n')
		);

		// Generate TTS with language support
		const audioPath = path.join(outputDir, 'headlines.mp3');
		const ttsResult = await textToSpeech(
			`${portal.name} এর শীর্ষ খবর: ${headlines.slice(0, 5).join('. ')}`,
			audioPath,
			{ language: portal.language }
		);

		// Calculate required duration (max of minDuration or TTS duration + buffer)
		const requiredDuration = Math.max(
			config.recording.minDuration,
			(ttsResult.duration * 1000) + 2000
		);

		console.log(`⏳ Recording for ${(requiredDuration / 1000).toFixed(1)} seconds...`);
		await new Promise(resolve => setTimeout(resolve, requiredDuration));
		await recorder.stop();

		// Combine video and audio with error handling
		try {
			await combineVideoAudio(
				videoPath,
				audioPath,
				path.join(outputDir, 'final.mp4')
			);
			console.log(`✅ Successfully processed ${portal.name}`);
		} catch (mergeError) {
			console.error(`❌ Failed to merge video/audio for ${portal.name}:`, mergeError.message);
			// Fallback to just the video
			await fs.rename(videoPath, path.join(outputDir, 'final.mp4'));
		}

	} catch (error) {
		console.error(`🔥 Critical error processing ${portal.name}:`, error.message);
	} finally {
		await browser.close().catch(e => console.error('Error closing browser:', e));
	}
}

async function main() {
	const dateStr = new Date().toISOString().split('T')[0];
	console.log('📅 Starting daily news capture for:', dateStr);

	try {
		// Process portals sequentially for better error handling
		for (const portal of config.portals) {
			await capturePortal(portal, dateStr);
		}
		console.log('🎉 All portals processed successfully');
	} catch (error) {
		console.error('💥 Failed to complete processing:', error.message);
	}
}

// Execution
if (process.env.NODE_ENV !== 'production') {
	console.log('🔧 Running in development mode');
	await main();
} else {
	console.log('🚀 Running in production mode');
	// Schedule for 7 AM daily
	cron.schedule('0 7 * * *', () => {
		console.log('⏰ Running scheduled news capture');
		main().catch(e => console.error('Scheduled job failed:', e));
	});
}