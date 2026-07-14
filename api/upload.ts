export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const fileName = typeof req.headers['x-file-name'] === 'string'
    ? req.headers['x-file-name']
    : 'upload.bin';

  const contentType = typeof req.headers['content-type'] === 'string'
    ? req.headers['content-type']
    : 'application/octet-stream';

  const body = req.body;

  if (!body) {
    return res.status(400).json({ error: 'No file body provided' });
  }

  const payload = body instanceof Uint8Array
    ? body
    : typeof body === 'string'
      ? new TextEncoder().encode(body)
      : new TextEncoder().encode(JSON.stringify(body));

  try {
    return res.status(200).json({
      url: `/uploads/${encodeURIComponent(fileName)}`,
      pathname: `/uploads/${encodeURIComponent(fileName)}`,
      contentType,
      size: payload.byteLength,
    });
  } catch (error) {
    console.error('Upload failed', error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
