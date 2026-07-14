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

    // Try Vercel Blob upload if configured. Support rotating/secondary tokens.
    const triedTokenEnv = ['VERCEL_BLOB_TOKEN', 'BLOB_TOKEN', 'BLOB_API_TOKEN', 'BLOB_WRITE_KEY'];
    const triedStoreEnv = ['BLOB_STORE_ID', 'VERCEL_BLOB_STORE_ID', 'BLOB_STORE'];
    const blobStoreId = process.env.BLOB_STORE_ID || process.env.VERCEL_BLOB_STORE_ID || process.env.BLOB_STORE;

    // tokens may be provided as comma-separated list or individual envs
    const tokensFromList = typeof process.env.VERCEL_BLOB_TOKENS === 'string' && process.env.VERCEL_BLOB_TOKENS.trim()
      ? process.env.VERCEL_BLOB_TOKENS.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const individualTokens = triedTokenEnv.map(n => process.env[n]).filter(Boolean) as string[];
    const tokenCandidates = [...tokensFromList, ...individualTokens];

    if (blobStoreId && tokenCandidates.length === 0) {
      console.error('Blob store configured but no write token candidates found');
      return res.status(500).json({
        error: 'Blob store configured but no write token found',
        guidance: `Set a write token in Vercel and add it to env (VERCEL_BLOB_TOKENS or one of ${triedTokenEnv.join(', ')})`,
        triedStoreEnv,
        blobStoreId,
      });
    }

    if (blobStoreId && tokenCandidates.length > 0) {
      const errors: Array<{ tokenIndex: number; status?: number; message?: string }> = [];
      for (let i = 0; i < tokenCandidates.length; i++) {
        const blobToken = tokenCandidates[i];
        try {
          const createResp = await fetch(`https://api.vercel.com/v1/blob/stores/${encodeURIComponent(blobStoreId)}/objects`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${blobToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: fileName, size: payload.byteLength, contentType, visibility: 'public' }),
          });

          if (!createResp.ok) {
            const txt = await createResp.text().catch(() => '');
            console.warn(`Blob create failed for token[${i}]`, createResp.status, txt.slice(0, 200));
            errors.push({ tokenIndex: i, status: createResp.status, message: txt.slice(0, 200) });
            continue; // try next token
          }

          const createJson = await createResp.json().catch(() => ({}));
          const uploadUrl = createJson.uploadURL || createJson.uploadUrl || createJson.upload_url;
          const publicUrl = createJson.url || createJson.publicUrl || createJson.cdnUrl || null;

          if (!uploadUrl) {
            console.warn(`Vercel Blob create response missing uploadURL for token[${i}]`, createJson);
            errors.push({ tokenIndex: i, message: 'missing uploadURL' });
            continue;
          }

          const putResp = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': contentType }, body: Buffer.from(payload) });

          if (!putResp.ok) {
            const txt = await putResp.text().catch(() => '');
            console.warn(`Blob PUT failed for token[${i}]`, putResp.status, txt.slice(0, 200));
            errors.push({ tokenIndex: i, status: putResp.status, message: txt.slice(0, 200) });
            continue; // try next token
          }

          const finalUrl = publicUrl || `/uploads/${encodeURIComponent(fileName)}`;
          return res.status(200).json({ url: finalUrl, pathname: `/uploads/${encodeURIComponent(fileName)}`, contentType, size: payload.byteLength });
        } catch (e) {
          console.error(`Vercel Blob attempt ${i} threw`, e instanceof Error ? e.message : String(e));
          errors.push({ tokenIndex: i, message: e instanceof Error ? e.message : String(e) });
          continue; // try next token
        }
      }

      console.error('All blob token candidates failed', errors);
      return res.status(500).json({ error: 'All blob token candidates failed', attempts: errors.length, details: errors.map(e => ({ tokenIndex: e.tokenIndex, status: e.status || null, message: e.message || null })) });
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
