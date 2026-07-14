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

  async function readRequestBody(r: any): Promise<Uint8Array> {
    if (r.body && (r.body instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(r.body)))) {
      return r.body instanceof Uint8Array ? r.body : new Uint8Array(r.body);
    }

    if (typeof r.arrayBuffer === 'function') {
      try {
        const ab = await r.arrayBuffer();
        return new Uint8Array(ab);
      } catch (e) {
        // fallthrough to stream reader
      }
    }

    const chunks: any[] = [];
    try {
      for await (const chunk of r) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    } catch (e) {
      // if streaming fails, we'll return empty
    }

    if (chunks.length === 0) return new Uint8Array();
    const buffer = Buffer.concat(chunks);
    return new Uint8Array(buffer);
  }

  try {
    const payload = await readRequestBody(req);

    if (!payload || payload.byteLength === 0) {
      console.error('No file body provided - payload empty');
      return res.status(400).json({ error: 'No file body provided' });
    }

    // If this looks like a thumbnail, return an inline data URL so the
    // frontend can immediately display the thumbnail without a persistent
    // blob store. In production this should be replaced with a proper
    // upload to a CDN or Vercel Blob and returning its public URL.
    if (typeof fileName === 'string' && fileName.endsWith('-thumb.png') && contentType.startsWith('image/')) {
      try {
        const base64 = Buffer.from(payload).toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        return res.status(200).json({
          url: dataUrl,
          pathname: `/uploads/${encodeURIComponent(fileName)}`,
          contentType,
          size: payload.byteLength,
        });
      } catch (e) {
        console.error('Failed to build thumbnail data URL', e);
        // fallthrough to default response
      }
    }

    return res.status(200).json({
      url: `/uploads/${encodeURIComponent(fileName)}`,
      pathname: `/uploads/${encodeURIComponent(fileName)}`,
      contentType,
      size: payload.byteLength,
    });
  } catch (error) {
    console.error('Upload failed', error instanceof Error ? error.stack || error.message : error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
