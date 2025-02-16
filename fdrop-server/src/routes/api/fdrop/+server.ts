import type { RequestHandler } from './$types';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import randomstring from 'randomstring';

const uploadDir = path.join(process.cwd(), 'static/fdrop');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

async function cleanupExpiredFiles() {
	const now = Date.now();
	const files = fs.readdirSync(uploadDir);

	for (const file of files) {
		if (file.endsWith('.meta')) {
			const metaPath = path.join(uploadDir, file);
			const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

			if (metadata.expiry < now) {
				const filePath = path.join(uploadDir, metadata.filename);

				try {
					await unlink(filePath);
					await unlink(metaPath);
					console.log(`Deleted expired file: ${metadata.filename}`);
				} catch (err) {
					console.error(`Failed to delete ${metadata.filename}:`, err);
				}
			}
		}
	}
}

setInterval(cleanupExpiredFiles, 30 * 60 * 1000);
console.log("File cleanup service started.");

export const OPTIONS: RequestHandler = async () => {
	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const lifetime = formData.get('lifetime');
		const hashed_password = formData.get('password');
		const domain = formData.get('domain');
		const maxSize = formData.get('maxSize');

		if (!file) {
			return new Response(JSON.stringify({ error: 'No file uploaded' }), { status: 400 });
		}

		const maxFileSize = maxSize * 1024 * 1024;
		if (file.size > maxFileSize) {
			return new Response(JSON.stringify({ error: `File size exceeds ${maxSize}MB` }), { status: 400 });
		}

		const fileName = `upload_${Date.now()}_${randomstring.generate(12)}${path.extname(file.name)}`;
		const filePath = path.join(uploadDir, fileName);
		const metaPath = path.join(uploadDir, `${fileName}.meta`);
		const buffer = Buffer.from(await new Response(file.stream()).arrayBuffer());

		const expiry = Date.now() + lifetime * 60 * 60 * 1000;

		await writeFile(filePath, buffer);
		await writeFile(metaPath, JSON.stringify({ filename: fileName, expiry, "hashedpassword": hashed_password}));
		return new Response(
			JSON.stringify({
				success: true,
				filename: fileName,
				filePath: `/static/fdrop/${fileName}`,
				hashedPass: hashed_password,
				lifetime: lifetime,
				fileURL: `${domain}/fdrop/${fileName}` ? hashed_password == null :`${domain}/fdrop/${fileName}?hasPass=true`
			}),
			{ status: 200 }
		);
	} catch (error) {
		console.error(error);
		return new Response(JSON.stringify({ error: 'File upload failed' }), { status: 500 });
	}
};
