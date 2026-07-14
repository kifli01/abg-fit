import { put } from '@vercel/blob';

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

    const tokenEnvNames = [
      'BLOB_READ_WRITE_TOKEN',
      'VERCEL_BLOB_TOKEN',
      'BLOB_TOKEN',
      'BLOB_API_TOKEN',
      'BLOB_WRITE_KEY',
    ];
    const tokenListEnvNames = ['BLOB_READ_WRITE_TOKENS', 'VERCEL_BLOB_TOKENS'];
    const blobStoreId = process.env.BLOB_STORE_ID || process.env.VERCEL_BLOB_STORE_ID || process.env.BLOB_STORE;

    const tokensFromList = tokenListEnvNames.flatMap((envName) => {
      const raw = process.env[envName];
      if (!raw || typeof raw !== 'string') return [];
      return raw.split(',').map((token) => token.trim()).filter(Boolean);
    });
    const individualTokens = tokenEnvNames.map((envName) => process.env[envName]).filter(Boolean) as string[];
    const tokenCandidates = [...tokensFromList, ...individualTokens];

    if (blobStoreId && tokenCandidates.length === 0) {
      console.error('Blob store configured but no write token candidates found');
      return res.status(500).json({
        error: 'Blob store configured but no write token found',
        guidance: `Set a write token in Vercel and add it to env (BLOB_READ_WRITE_TOKEN, VERCEL_BLOB_TOKENS, or one of ${tokenEnvNames.join(', ')})`,
        blobStoreId,
      });
    }

    if (tokenCandidates.length > 0) {
      const errors: Array<{ tokenIndex: number; message: string }> = [];

      for (let i = 0; i < tokenCandidates.length; i++) {
        const blobToken = tokenCandidates[i];
        try {
          const putResult = await put(fileName, Buffer.from(payload), {
            access: 'public',
            addRandomSuffix: false,
            contentType,
            token: blobToken,
          });

          return res.status(200).json({
            url: putResult.url,
            pathname: putResult.pathname,
            contentType: putResult.contentType,
            size: payload.byteLength,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn(`Vercel Blob put failed for token[${i}]`, message);
          errors.push({ tokenIndex: i, message });
          continue;
        }
      }

      console.error('All blob token candidates failed', errors);
      return res.status(500).json({
        error: 'All blob token candidates failed',
        attempts: errors.length,
        details: errors,
      });
    }

    // Fallback: return a relative uploads path for local/dev use when no blob token is configured.
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
