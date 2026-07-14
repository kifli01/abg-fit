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

    // Try Vercel Blob upload if configured. Support multiple env names for
    // token/store to match different dashboard setups.
    const triedTokenEnv = ['VERCEL_BLOB_TOKEN', 'BLOB_TOKEN', 'BLOB_API_TOKEN', 'BLOB_WRITE_KEY'];
    const triedStoreEnv = ['BLOB_STORE_ID', 'VERCEL_BLOB_STORE_ID', 'BLOB_STORE'];
    const blobToken = process.env.VERCEL_BLOB_TOKEN || process.env.BLOB_TOKEN || process.env.BLOB_API_TOKEN || process.env.BLOB_WRITE_KEY;
    const blobStoreId = process.env.BLOB_STORE_ID || process.env.VERCEL_BLOB_STORE_ID || process.env.BLOB_STORE;

    // If a store is configured but no token is present, return a helpful error
    if (blobStoreId && !blobToken) {
      console.error('Blob store configured but no write token found');
      return res.status(500).json({
        error: 'Blob store configured but no write token found',
        guidance: `Set one of these env vars with the blob write token: ${triedTokenEnv.join(', ')}`,
        triedStoreEnv,
        blobStoreId,
      });
    }

    if (blobToken && blobStoreId) {
      try {
        const createResp = await fetch(`https://api.vercel.com/v1/blob/stores/${encodeURIComponent(blobStoreId)}/objects`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${blobToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: fileName, size: payload.byteLength, contentType, visibility: 'public' }),
        });

        if (!createResp.ok) {
          const txt = await createResp.text().catch(() => '');
          console.error('Vercel Blob create object failed', createResp.status, txt);
          throw new Error('Blob create failed');
        }

        const createJson = await createResp.json().catch(() => ({}));
        const uploadUrl = createJson.uploadURL || createJson.uploadUrl || createJson.upload_url;
        const publicUrl = createJson.url || createJson.publicUrl || createJson.cdnUrl || null;

        if (!uploadUrl) {
          console.error('Vercel Blob create response missing uploadURL', createJson);
          throw new Error('Blob create response invalid');
        }

        const putResp = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: Buffer.from(payload),
        });

        if (!putResp.ok) {
          const txt = await putResp.text().catch(() => '');
          console.error('Vercel Blob upload PUT failed', putResp.status, txt);
          throw new Error('Blob upload failed');
        }

        const finalUrl = publicUrl || `/uploads/${encodeURIComponent(fileName)}`;
        return res.status(200).json({ url: finalUrl, pathname: `/uploads/${encodeURIComponent(fileName)}`, contentType, size: payload.byteLength });
      } catch (e) {
        console.error('Vercel Blob flow failed', e instanceof Error ? e.stack || e.message : e);
        // Return non-sensitive debug to the client to aid troubleshooting.
        return res.status(500).json({
          error: 'Vercel Blob upload failed',
          message: e instanceof Error ? e.message : String(e),
          guidance: `Ensure your blob write token is valid and the store (${blobStoreId}) exists and is accessible. Tried token envs: ${triedTokenEnv.join(', ')}`,
        });
      }
    }

    // Fallback: return a relative uploads path (client/dev will handle)
    return res.status(200).json({ url: `/uploads/${encodeURIComponent(fileName)}`, pathname: `/uploads/${encodeURIComponent(fileName)}`, contentType, size: payload.byteLength });
  } catch (error) {
    console.error('Upload failed', error instanceof Error ? error.stack || error.message : error);
    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
