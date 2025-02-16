import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stat, readFile } from 'fs/promises';
import path from 'path';
import { createReadStream } from 'node:fs';
import bcrypt from 'bcrypt';

const uploadDir = path.join(process.cwd(), 'static/fdrop');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { filename, password } = await request.json();

		const filePath = path.resolve(uploadDir, filename);
		const metaPath = path.join(uploadDir, `${filename}.meta`);

		if (!filePath.startsWith(uploadDir)) {
			throw error(400, 'Invalid filename');
		}

		try {
			await stat(metaPath);
		} catch {
			throw error(404, 'Metadata file not found');
		}

		const metadata = JSON.parse(await readFile(metaPath, 'utf8'));
		const hasPass = metadata.hashedpassword != null;
		if (hasPass){
		const isPasswordValid = await bcrypt.compare(password, metadata.hashedpassword);
		if (!isPasswordValid) {
			throw error(403, 'Invalid password');
		 }
		}

		await stat(filePath);

		const stats = await stat(filePath);
		const fileStream = createReadStream(filePath);

		const headers = new Headers({
			'Content-Length': stats.size.toString(),
			'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
			'Cache-Control': 'no-cache',
			'Access-Control-Allow-Origin': '*'
		});

		return new Response(fileStream as any, { headers });
	} catch (err) {
		console.error('Download error:', err);
		throw error(500, err instanceof Error ? err.message : 'Internal server error');
	}
};
